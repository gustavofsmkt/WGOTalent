---
description: Diretrizes para documentação técnica, formato de ADRs, DEVLOG, registros de prompts e manutenção da fonte de verdade.
applyTo:
  - "docs/**/*"
  - "README.md"
  - "LEIA-ME-PRIMEIRO.md"
  - "**/*.md"
---

# Instruções de Documentação (WGOTalent)

Este documento define os padrões obrigatórios para a criação, escrita e manutenção da documentação técnica no projeto WGOTalent.

## 1. Idioma Padrão
- **Português (pt-BR):** Toda a documentação técnica do repositório — incluindo ADRs, DEVLOG, especificações, manuais, guias e mensagens de instruções — deve ser mantida exclusivamente em Português.

## 2. Registros de Decisão de Arquitetura (ADR)
- **Estrutura Padrão:** Qualquer decisão arquitetural relevante deve ser registrada em forma de ADR seguindo rigorosamente estas três seções:
  - **Contexto:** Descrição do problema, necessidades do negócio, restrições e motivação para a mudança.
  - **Decisão:** A solução adotada, com detalhes da escolha técnica e menção clara às alternativas analisadas e descartadas.
  - **Consequências:** Análise dos impactos positivos, trade-offs negativos, custos de manutenção, riscos e débitos técnicos assumidos.

## 3. DEVLOG Factual
- **Registro Factual:** O DEVLOG do projeto deve ser um registro puramente **factual** e objetivo das funcionalidades implementadas, refatorações concluídas e correções realizadas.
- **Foco em Entregas:** Evite opiniões pessoais, especulações ou intenções futuras não confirmadas. Registre o que foi de fato executado e validado no código.

## 4. Log de Prompts (Apenas Marcos / Milestones)
- **Restrito a Marcos Arquiteturais:** Registros de prompts e história de instrução do Copilot (prompts-log) devem ser mantidos apenas para **marcos estruturais (milestones)** e grandes decisões de engenharia.
- **Sem Poluição:** Interações do dia a dia, correções pontuais de sintaxe e pequenos ajustes não devem ser documentados em logs de prompts.

## 5. Fonte de Verdade e Não Duplicação do Schema
- **Proibido Duplicar Schema:** É estritamente proibido recriar tabelas, colunas, tipos SQL ou relacionamentos do banco de dados em arquivos de documentação Markdown.
- **Referência Canônica:** O schema canônico é implementado em `src/server/db/schema.ts` (e especificado em `docs/specs/db_triagem_proposta.ts`). A documentação deve apenas direcionar o leitor para esses arquivos-fonte através de links ou citações curtas.

## 6. Ciclo de Vida e Cleanup de Documentos Obsoletos (Superseded)
- **Remoção de Documentos Obsoletos:** Sempre que uma instrução, guia operacional ou roteiro for substituído (*superseded*) por uma nova arquitetura ou processo, o arquivo antigo DEVE ser removido.
- **Única Fonte da Verdade:** Mantenha a documentação enxuta, sem arquivos legados conflitantes que possam induzir desenvolvedores ou o assistente de IA a erros.
