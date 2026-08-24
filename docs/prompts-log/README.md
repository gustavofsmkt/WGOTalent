# Log de Prompts (Marcos)

Este diretório registra **apenas marcos estruturais** (milestones) e grandes decisões de engenharia do desenvolvimento greenfield do WGOTalent, conforme `docs.instructions.md` (seção 4).

## O que entra aqui

- Fechamento de uma fase/gate do roteiro (`WGOTalent_GREENFIELD_ROTEIRO_COPILOT.md`).
- Uma TASK ou grupo de TASKs que introduziu ou corrigiu uma decisão arquitetural relevante.
- Pivôs de arquitetura (ex.: encerramento da integração via n8n em favor do motor de agentes nativo).
- Auditorias de produto que corrigiram desvios reais (design, performance, formulários, soft delete).

## O que **não** entra aqui

- Prompts completos trocados com o Copilot/Claude — eles já existem no roteiro e no histórico do chat; não são copiados aqui.
- Correções pontuais de sintaxe, ajustes de estilo sem decisão associada, ou qualquer interação do dia a dia.
- Métricas inventadas (tokens consumidos, tempo de execução) — se não foi medido e registrado no momento, não é reconstruído retroativamente.

## Campos de cada entrada

| Campo | Significado |
|---|---|
| **Data** | Data do(s) commit(s) do marco. |
| **TASK** | Identificador no roteiro (`TASK-NNN`), quando existir. Marcos sem TASK numerada (pivôs, correções emergentes) usam uma descrição curta. |
| **Modelo** | Modelo efetivamente usado quando confirmável (trailer `Co-Authored-By` do commit), ou o modelo recomendado pelo roteiro quando não há confirmação no commit — sempre identificado qual dos dois é. |
| **Objetivo** | O que a TASK/marco pretendia entregar. |
| **Resultado** | O que foi de fato entregue e validado (build/teste/lint). |
| **Falha/Correção** | Problemas reais encontrados durante a execução e como foram corrigidos. "Nenhuma" quando não houve. |
| **ADR** | Architecture Decision Record relevante, se houver (ver `docs/decisions/`). |

## Nota sobre o modelo de execução

O roteiro original recomenda Gemini 3.1 Pro / 3.6 Flash via GitHub Copilot Chat para todas as TASKs. A partir da implementação do motor de agentes de IA (TASK-137, 2026-08-19), o histórico de commits passa a trazer `Co-Authored-By: Claude Sonnet 5` / `Claude Sonnet 4.6`, confirmando a transição para Claude Code no restante do desenvolvimento. Este log identifica explicitamente, marco a marco, quando o modelo é confirmado pelo commit e quando é apenas a recomendação do roteiro.

## Entradas

- [2026-08 — Bootstrap ao congelamento do MVP v1](2026-08.md)
