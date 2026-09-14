# 15. Área e Cargo de Interesse do Candidato como Texto

## Status

Aceita

- **Substitui parcialmente:** [ADR-0004: Mapeamento de Campos n8n para Banco de Dados](./0004-n8n-webhook-field-mapping.md)
- **Relacionado a:** [ADR-0007: Encerramento da Integração via n8n e Adoção de Motor de Agentes Nativo](./0007-encerramento-integracao-n8n.md)

## Contexto

Área e cargo de interesse eram referências opcionais aos cadastros de
Departamento e Cargo. Esse modelo impedia o agente de extração de preservar um
interesse declarado no currículo quando ainda não existia uma correspondência
no catálogo interno.

A edição manual continua precisando restringir escolhas aos departamentos e
cargos ativos e garantir que o cargo pertença à área selecionada.

## Decisão

`Candidato.areaInteresse` e `Candidato.cargoInteresse` passam a ser textos
opcionais no registro do candidato. A extração pode persistir o conteúdo
declarado sem resolver IDs no catálogo.

No formulário manual, os controles continuam sendo preenchidos com o catálogo
ativo, mas salvam os nomes. A escolha de um cargo também define a área do
departamento correspondente. A escolha isolada de uma área não infere nem
seleciona um cargo.

O agente só preenche cargo quando houver objetivo ou função desejada explícita.
A área pode ser declarada ou derivada diretamente desse cargo; o sentido inverso
é proibido.

## Consequências

- Interesses extraídos deixam de ser descartados por ausência no catálogo.
- Renomear um Cargo ou Departamento não altera retroativamente o texto salvo no
  candidato.
- A aplicação, e não uma chave estrangeira, garante a correspondência entre
  cargo e área nas criações e edições manuais.
- Os IDs do catálogo existem apenas como valores transitórios dos controles da
  interface e não fazem parte do payload persistido.
- A migração preserva os dados existentes convertendo as antigas referências
  nos respectivos títulos e nomes antes de remover as colunas antigas.

## Alternativas

- **Manter as FKs e acrescentar campos livres paralelos:** descartada por criar
  duas fontes de verdade para o mesmo interesse.
- **Resolver toda extração contra o catálogo:** descartada porque perderia
  interesses legítimos ainda não cadastrados.
- **Derivar cargo a partir da área:** descartada porque uma área admite vários
  cargos e a inferência seria arbitrária.
