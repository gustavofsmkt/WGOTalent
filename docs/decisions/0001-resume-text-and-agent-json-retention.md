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
