# ADR 0001: Retenção de Texto do Currículo e JSON do Agente

## Contexto
O workflow `Cadastro_Candidato` no n8n realiza o processamento de currículos em PDF e envia os dados estruturados para o sistema via webhook. Além dos dados normalizados, o payload do webhook também envia dois campos adicionais:
1. `texto_curriculo_extraido`: Uma string contendo o texto bruto extraído do PDF original.
2. `json_completo_agente`: Um objeto JSON com o resultado bruto gerado pela extração via LLM (Gemini).

Precisamos decidir se armazenamos ou não esses dados adicionais no banco de dados relacional (PostgreSQL).

## Decisão

1. **`texto_curriculo_extraido`**: **MANTER** o armazenamento na entidade `Candidato`.
   - É a evidência primária extraída pelo n8n a partir do arquivo.
   - A sua retenção evita a necessidade de reprocessar o arquivo original (PDF) sempre que houver necessidade de uma auditoria de discrepâncias entre o currículo e os dados estruturados gerados pela IA.
   - Facilita reprocessamentos e o debug do parsing.
   - **Nota de Segurança:** Por ser uma transcrição integral, trata-se de PII (Personally Identifiable Information). Deve ser estritamente omitido em logs da aplicação e não deve aparecer em respostas normais de API.

2. **`json_completo_agente`**: **NÃO ARMAZENAR** no banco relacional normalizado.
   - É um objeto volumoso e altamente redundante, já que seus dados úteis estão refletidos nas colunas estruturadas.
   - Armazenar payloads grandes no PostgreSQL aumenta o custo de storage e degrada o desempenho.
   - Caso exista requisito futuro para debug aprofundado das saídas do agente, esse log estruturado deverá ser direcionado a uma infraestrutura de observabilidade descartável ou storage de objetos temporário.

## Consequências
- **Impactos Positivos**: 
  - Evitamos inflar a tabela de candidatos e economizamos em custos operacionais e de storage omitindo o JSON.
  - A retenção do texto garante facilidade e precisão nas auditorias sem gargalos de reprocessamento.
- **Riscos / Trade-offs Negativos**: 
  - O campo `texto_curriculo_extraido` ainda consome storage significativo, mas consideramos um custo justificado pela redução no overhead de auditorias.
  - Adiciona o ônus à camada de API/UI de não expor inadvertidamente o `texto_curriculo_extraido` onde apenas dados vitais e estruturados deveriam transitar.

## Emenda (ADR-0007): Reavaliação da Retenção de Texto do Currículo

Com a adoção do motor de agentes nativo (ADR-0007), o fluxo de extração de currículos mudou: não há mais um passo de OCR externo (Mistral via n8n) pré-estruturação. Agora, o arquivo original (PDF/Imagem) é enviado diretamente de forma multimodal para o agente `extracao_curriculo`, e o arquivo original é preservado via `StorageProvider` para fins de auditoria e reprocessamento.

Diante disso, reavaliamos a necessidade e a forma de retenção do campo `texto_curriculo_extraido` na entidade `Candidato`. Apresentamos as seguintes opções:

**Opção A: Manter `texto_curriculo_extraido` preenchido por OCR/Extração de texto na plataforma**
*   **Descrição:** Antes de enviar ao agente multimodal (ou em paralelo), a plataforma realiza a extração do texto bruto do PDF/DOCX localmente (ex: usando bibliotecas como `pdf2json` ou `mammoth`) e salva no banco.
*   **Prós:**
    *   Mantém a funcionalidade de busca textual simples no banco de dados (ex: FTS do PostgreSQL) sem depender do reprocessamento do arquivo.
    *   Garante uma cópia fiel do texto extraído programaticamente, independente de alucinações de LLM.
*   **Contras:**
    *   Adiciona complexidade, dependências e processamento extra (CPU bound) na aplicação para fazer o parsing do texto que o modelo multimodal já é capaz de ler nativamente.
    *   Pode haver divergência entre o texto extraído pela biblioteca local e o que o modelo multimodal "enxerga" na imagem/PDF.

**Opção B: Substituir por Arquivo Original + Transcrição Opcional gerada pelo próprio Agente**
*   **Descrição:** O arquivo original armazenado no `StorageProvider` torna-se a única fonte de verdade primária para auditoria. O agente `extracao_curriculo` pode, como parte do seu schema de saída (Structured Output JSON), retornar um campo de transcrição que será armazenado no campo `texto_curriculo_extraido`.
*   **Prós:**
    *   Simplifica a arquitetura: um único processamento multimodal pelo LLM. A plataforma não precisa lidar com bibliotecas complexas de parsing de PDF/imagens.
    *   O que está no banco de dados reflete exatamente o que o modelo utilizou como base para a estruturação, facilitando o debug da "visão" da IA sobre o documento.
*   **Contras:**
    *   O LLM pode sofrer de alucinação ou alterar a formatação do texto original (embora o arquivo original ainda exista no storage para auditoria real).
    *   Aumenta ligeiramente o custo e a latência de geração do LLM por exigir a geração de um campo de texto longo na resposta.

**Decisão da Emenda:**
Optamos pela **Opção B**. O arquivo original no `StorageProvider` é a fonte primária inquestionável. O campo `texto_curriculo_extraido` no banco de dados continuará existindo, mas passará a armazenar a transcrição que o próprio modelo multimodal faz do documento, solicitada como parte do schema de saída do agente. 

**Justificativa:** A eliminação de uma etapa de OCR/parsing local reduz a complexidade da base de código (menos dependências e processamento CPU-bound na API). Confiar no arquivo original para auditoria rigorosa e na transcrição do próprio LLM para buscas textuais balanceia a simplicidade arquitetural com a funcionalidade do sistema, alinhando-se perfeitamente à estratégia de IA nativa descrita no ADR-0007.
