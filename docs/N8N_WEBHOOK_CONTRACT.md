# Contratos de Integração n8n

Este documento define os contratos de integração (inbound e outbound) entre a Plataforma WGOTalent e os workflows do n8n (Cadastro_Candidato e Classificador_Candidatos), baseando-se nas Architectural Decision Records (ADRs) e especificações do projeto.

---

## 1. Inbound — Cadastro de Candidatos

**Endpoint:** `POST /api/webhooks/n8n/candidatos`
**Origem:** n8n (Workflow Cadastro_Candidato)
**Objetivo:** Receber dados de candidatos extraídos de currículos e inseri-los no banco de dados.

### 1.1 Regras de Processamento

*   **Formato:** O payload é **sempre um array JSON**. Cada item representa um candidato extraído e deve ser processado individualmente.
*   **Campos Obrigatórios:** `candidato.nome`, `candidato.email`, `candidato.celular`.
*   **Referências de Cargo e Área:** Os campos `cargo_interesse_id` e `area_interesse_id` no objeto `candidato` vêm como `null`. A plataforma deve usar os valores string recebidos no objeto `referencias` para buscar (lookup) os UUIDs corretos no banco. Se não encontrar, pode ignorar ou cadastrar nova área/cargo, conforme política de fallback definida pela aplicação.
*   **Disponibilidade de Horários:** Se vier como o valor booleano `false`, deve ser transformado em `null` ou ignorado. Caso venha como string descritiva, persistir na coluna `disponibilidade_horarios` (tipo TEXT).
*   **Segurança:** Requer header `x-webhook-secret` com chave secreta combinada (Shared Secret).
*   **Idempotência:** Requer header `x-idempotency-key` (UUID ou hash gerado pelo n8n) para prevenir dupla inserção.
*   **Ação pós-processamento:** Após persistir o candidato e seus relacionamentos, o sistema deve disparar o Classificador de forma **assíncrona**.

### 1.2 Exemplo de Payload

```json
[
  {
    "candidato": {
      "nome": "João Silva",
      "email": "joao.silva@example.com",
      "celular": "+5511999999999",
      "disponibilidade_horarios": false,
      "texto_curriculo_extraido": "Profissional com 10 anos de experiência em gestão de TI...",
      "curriculo_arquivo_key": null,
      "cargo_interesse_id": null,
      "area_interesse_id": null
    },
    "formacoes": [
      {
        "titulo": "Bacharelado em Ciência da Computação",
        "instituicao": "Universidade de São Paulo (USP)",
        "area_formacao": "TI",
        "data_inicio": "2010-01-01",
        "data_termino": "2014-12-31"
      }
    ],
    "experiencias_profissionais": [
      {
        "empresa": "Tech Solutions LTDA",
        "cargo_titulo": "Gerente de TI",
        "descricao": "Liderança técnica de equipes multidisciplinares...",
        "data_entrada": "2015-03-01",
        "data_saida": null
      }
    ],
    "certificacoes": [],
    "referencias": {
      "cargo_interesse": "Gerente de TI",
      "area_interesse": "Tecnologia da Informação"
    }
  }
]
```

### 1.3 Respostas Esperadas

*   **200 OK:** Candidato criado/atualizado com sucesso.
*   **401 Unauthorized:** Header `x-webhook-secret` ausente ou inválido.
*   **409 Conflict:** Conflito de Idempotência ou o candidato referenciado por email sofreu soft-delete (conforme ADR 0002).
*   **422 Unprocessable Entity:** Payload inválido (falha na validação Zod).

---

## 2. Inbound — Resultado da Triagem (Classificador IA)

**Endpoint:** `POST /api/webhooks/n8n/triagem`
**Origem:** n8n (Workflow Classificador_Candidatos)
**Objetivo:** Receber a avaliação de um currículo contra uma vaga.

### 2.1 Regras de Processamento

*   **Formato:** O payload é **sempre um array JSON**. Diferentemente do endpoint de candidatos, cada item possui um wrapper `output` englobando os dados reais.
*   **Campos Obrigatórios:** `output.candidato_id`, `output.vaga_id`, `output.score_ia`, `output.parecer_ia`.
*   **Estrutura de Fases da Triagem:**
    *   Não são enviados campos como `fase`, `recomendacao` nem `motivo`.
    *   O handler é responsável por preencher os valores padrão de domínio:
        *   `etapa = 'curriculo'` (fixo para a avaliação inicial baseada em IA).
        *   `resultado = 'em_andamento'` (o n8n só envia avaliações com score > 65. Cabe ao RH aprovar ou rejeitar futuramente).
        *   `motivo = null`
*   **Campos de Texto (Bullet Points):** Os campos `pontos_fortes`, `requisitos_faltantes`, `eliminatorios_falhos` e `alertas` não são arrays JSON. Eles chegam como strings (`TEXT`) formatadas com quebras de linha (newlines, ex: `• Ponto 1\n• Ponto 2`). Se algum destes for uma string vazia `""`, mapear para `null`.
*   **Segurança e Idempotência:** Exigem os headers `x-webhook-secret` e `x-idempotency-key`.

### 2.2 Exemplo de Payload

```json
[
  {
    "output": {
      "candidato_id": "c1f8d42d-20d0-42ec-aab2-4b2a60dc1d91",
      "vaga_id": "v9b4a18e-6e8d-4e9b-8a71-8c4d3b6a9c1e",
      "vaga_foi_inferida": false,
      "pontos_fortes": "• Extensa experiência em liderança.\n• Certificação PMI.",
      "requisitos_faltantes": "",
      "eliminatorios_falhos": "",
      "alertas": "• Trocou de emprego 3 vezes no último ano.",
      "score_ia": 88,
      "parecer_ia": "O candidato atende aos requisitos primários da vaga..."
    }
  }
]
```

### 2.3 Respostas Esperadas

*   **200 OK:** Triagem e AvaliacaoIA registradas com sucesso.
*   **401 Unauthorized:** Header `x-webhook-secret` ausente ou inválido.
*   **409 Conflict:** Conflito de Idempotência (avaliação já registrada).
*   **422 Unprocessable Entity:** Payload não aderente ao schema.

---

## 3. Outbound — Trigger para o Classificador (Webhook n8n)

**Endpoint:** `POST <CLASSIFICADOR_N8N_WEBHOOK_URL>` (URL resolvida por variável de ambiente)
**Origem:** Plataforma WGOTalent
**Objetivo:** Notificar o workflow n8n responsável por comparar candidatos com vagas e emitir os resultados de volta via inbound webhook (detalhado no item 2).

### 3.1 Regras de Processamento

*   **Gatilhos:** A requisição é disparada após o registro de um novo candidato ou vaga (ADR 0005).
*   **Arquitetura e Resiliência:** Esta é uma chamada de integração *Fire-and-forget* executada *após* a transação principal (DB Commit). Uma falha nesta chamada HTTP não deve reverter a inserção/atualização do candidato ou da vaga no banco.
*   **Formato Dinâmico (Candidato vs Vaga):** O payload envia dados baseados na entidade "focal" da transação:
    *   `flow 1 (Novo Candidato)`: Payload envia um `candidato` completo contra uma ou mais `vagas` ativas compatíveis.
    *   `flow 2 (Nova Vaga)`: Payload envia uma `vaga` completa contra múltiplos `candidatos` do banco de talentos compatíveis.

### 3.2 Exemplo de Payload (Flow 1: Novo Candidato)

```json
{
  "candidato": {
    "id": "c1f8d42d-20d0-42ec-aab2-4b2a60dc1d91",
    "nome": "João Silva",
    "texto_curriculo_extraido": "...",
    "formacoes": [...],
    "experiencias_profissionais": [...]
  },
  "vagas": [
    {
      "id": "v9b4a18e-6e8d-4e9b-8a71-8c4d3b6a9c1e",
      "titulo": "Gerente de Projetos de TI",
      "descricao": "...",
      "requisitos": "..."
    }
  ]
}
```

### 3.3 Exemplo de Payload (Flow 2: Nova Vaga)

```json
{
  "vaga": {
    "id": "v9b4a18e-6e8d-4e9b-8a71-8c4d3b6a9c1e",
    "titulo": "Desenvolvedor Backend Sênior",
    "descricao": "...",
    "requisitos": "..."
  },
  "candidatos": [
    {
      "id": "c2x9z11d-20d0-42ec-aab2-4b2a60dc1d91",
      "nome": "Maria Souza",
      "texto_curriculo_extraido": "...",
      "formacoes": [...],
      "experiencias_profissionais": [...]
    }
  ]
}
```
