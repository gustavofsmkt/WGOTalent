# WGOTalent — Roteiro de Correção: Migração da IA do n8n para a Plataforma

## Objetivo

Este roteiro é um **bloco pré-requisito** ao `WGOTalent_GREENFIELD_ROTEIRO_COPILOT.md`. Ele existe porque a decisão de mover toda a orquestração de IA (extração de currículo, classificação de aderência, avaliação/triagem) do n8n para dentro da própria plataforma foi tomada **depois** de várias tasks do roteiro original já terem documentado, e em parte configurado, uma arquitetura baseada em n8n — sem que nenhuma linha de código de integração tivesse sido efetivamente implementada ainda.

Execute as tasks **CORR-01 a CORR-14** abaixo, nesta ordem, antes de retomar o roteiro principal na TASK-061. A ordem importa: CORR-01 cria o ADR mestre que as demais tasks referenciam.

## Onde isso se encaixa no roteiro principal

- `TASK-001` até `TASK-060` do roteiro principal permanecem válidas e não precisam de nenhuma alteração — não dependem de n8n.
- `TASK-029` (ADR de idempotência do webhook) e `TASK-049` (persistência dessa idempotência) nunca foram executadas no histórico do projeto e ficam formalmente descartadas por este roteiro de correção — idempotência agora é tratada no contexto do worker de captação de e-mail, não de webhook n8n.
- `TASK-061` e a `Fase 14 — Webhook n8n` (`TASK-106` a `TASK-114`) já foram removidas do roteiro principal — não descreviam trabalho executado, então não havia razão pra manter como nota/aviso (git preserva o histórico se precisar resgatar). A `Fase 14` será substituída por um novo bloco de fases (motor de agentes IA nativo), a ser detalhado em roteiro específico após a conclusão deste bloco de correção.
- `Fase 15` em diante do roteiro principal seguem inalteradas.

---

## CORR-01 — Criar ADR mestre de encerramento da integração via n8n

**Modelo recomendado:** Gemini 3.1 Pro (ou modelo equivalente de raciocínio — evitar tier "Flash" aqui)

### Prompt para o Copilot Chat

```text
Crie docs/decisions/0007-encerramento-integracao-n8n.md usando o template em docs/decisions/README.md.

Contexto: o projeto planejava orquestrar a triagem de IA via n8n (workflows Cadastro_Candidato, Classificador, Triagem), documentado em ADR-0004, ADR-0005, ADR-0006 e N8N_WEBHOOK_CONTRACT.md. Nenhuma dessas integrações foi implementada em código ainda — a decisão foi tomada antes da implementação, o que reduz o custo da mudança.

Decisão: mover toda a orquestração de IA (extração de currículo, classificação de aderência, avaliação/triagem) para dentro da própria plataforma, como um motor de agentes configurável via admin (modelo/provedor/system prompt/user prompt/parâmetros por slot fixo), sem depender de n8n. Formatos de currículo suportados no MVP: PDF, DOCX, PNG, JPEG — DOCX via mammoth, sem serviço de conversão externo. Captação via upload manual (recrutador) e via provedor de e-mail configurável (Zimbra/Microsoft 365/Google Workspace), com credenciais de LLM e de e-mail cadastradas via admin, cifradas em repouso.

Justificativa: os 3 fluxos n8n analisados são pipelines sequenciais (extração → classificação → avaliação) sem orquestração complexa que justifique um motor de workflow externo; trazer isso pra dentro da plataforma permite configuração via admin sem deploy, elimina os saltos de webhook por avaliação, e concentra auditoria/custo de chamadas de IA num só lugar.

Status: Aceita. Supersedes: ADR-0006 (integralmente). Superscreva parcialmente ADR-0004 e ADR-0005 — não decida sozinho o que sobrevive de cada uma, isso é tratado nas tasks CORR-02 e CORR-03.

Depois de criar o ADR, atualize o índice em docs/decisions/README.md incluindo a entrada do ADR-0007.
Faça commit `docs(adr): define native ai engine and end n8n integration`.
```

---

## CORR-02 — Marcar ADR-0004 e ADR-0005 como parcialmente supersedidas

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Edite docs/decisions/0004-n8n-webhook-field-mapping.md e docs/decisions/0005-outbound-classifier-trigger.md.

Não apague o conteúdo original — histórico arquitetural fica em ADR, não em código morto. Atualize o campo Status para "Obsoleta" e o campo Superseded-by para linkar docs/decisions/0007-encerramento-integracao-n8n.md, e adicione uma nota curta no topo de cada arquivo:

Em 0004: "Superseded parcialmente pelo ADR-0007. O mapeamento de payload n8n (eliminatorios_falhos, wrapper output etc.) não se aplica mais. Sobrevive a decisão de negócio: ao persistir uma AvaliacaoIA gerada por IA, etapa = 'curriculo' e resultado = 'em_andamento' como defaults."

Em 0005: "Superseded parcialmente pelo ADR-0007. O alvo HTTP externo (CLASSIFICADOR_N8N_WEBHOOK_URL) deixa de existir. Sobrevive o princípio: a chamada de classificação/avaliação não deve bloquear a transação principal de registro do candidato/vaga (fire-and-forget ou after())."

Faça commit `docs(adr): mark n8n-specific ADRs as partially superseded`.
```

---

## CORR-03 — Marcar ADR-0006 como totalmente supersedida

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Edite docs/decisions/0006-n8n-docker-compose-service.md. Atualize Status para "Obsoleta" e Superseded-by para docs/decisions/0007-encerramento-integracao-n8n.md. Adicione nota no topo: "Superseded pelo ADR-0007 — o serviço n8n foi removido do docker-compose.yml (ver CORR-04)." Não apague o arquivo.
Faça commit `docs(adr): mark n8n docker compose ADR as superseded`.
```

---

## CORR-04 — Remover o serviço n8n do docker-compose e do .env.example

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Em docker-compose.yml, remova o serviço n8n inteiro (imagem n8nio/n8n, container wgotalent-n8n, ports, environment, volumes, extra_hosts) e o volume nomeado n8n_data.

Em .env.example, remova as linhas: WEBHOOK_N8N_SECRET (e o comentário "Webhooks (Shared secret for N8N integration)"), N8N_PORT, N8N_BASIC_AUTH_USER, N8N_BASIC_AUTH_PASSWORD (e o comentário referenciando docs/decisions/0006), CLASSIFICADOR_N8N_WEBHOOK_URL (e o comentário referenciando docs/decisions/0005).

Pesquise src/env.js por WEBHOOK_N8N_SECRET e remova se presente — confirme que nenhuma outra parte do projeto referencia essas variáveis antes de remover.

Além disso, atualize WGOTalent_GREENFIELD_ROTEIRO_COPILOT.md:
- Remova o corpo da TASK-033a (o serviço n8n que ela adiciona deixa de existir).
- Atualize TASK-131, TASK-133, TASK-135 e TASK-136 (Fase 19) removendo toda menção a n8n como serviço do docker-compose de produção.
- Atualize a seção "Estrutura-alvo" removendo a linha `webhooks/n8n/` da árvore de diretórios.

Rode docker compose config para validar o arquivo resultante.
Faça commit `chore(infra): remove n8n service and env vars`.
```

---

## CORR-05 — Emendar ADR-0001 (retenção de texto do currículo)

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Releia docs/decisions/0001-resume-text-and-agent-json-retention.md. A premissa original era que o n8n gerava texto_curriculo_extraido via OCR externo (Mistral) antes de qualquer estruturação. No novo desenho, PDF/imagem vão direto multimodal pro agente extracao_curriculo (sem OCR separado); o arquivo original é preservado via StorageProvider como fonte de reprocessamento.

Adicione uma seção "Emenda (ADR-0007)" ao final do ADR-0001 (não reescreva a decisão original) reavaliando se texto_curriculo_extraido continua justificado como está, ou se o papel dele passa a ser coberto pelo arquivo original + um campo opcional de transcrição gerado pelo próprio agente como parte do schema de saída. Apresente as duas opções com trade-offs; não decida sozinho sem justificar.
Faça commit `docs(adr): amend resume text retention decision for native ai engine`.
```

---

## CORR-06 — Remover N8N_WEBHOOK_CONTRACT.md

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Remova docs/N8N_WEBHOOK_CONTRACT.md. É documentação operacional supersedida — a regra de limpeza do projeto manda remover, não manter como "referência histórica" (isso é reservado a ADRs).
Pesquise o repositório inteiro por referências a esse arquivo (docs, instructions, skills, README, "Estrutura-alvo" no roteiro principal) e remova ou corrija cada uma.

Além disso, em WGOTalent_GREENFIELD_ROTEIRO_COPILOT.md remova o corpo da TASK-032 (ela existe só pra criar o arquivo que esta task está removendo) e o corpo da TASK-031b (o mapeamento de campos n8n→DB não se aplica mais — mas antes confira se alguma regra de negócio ali descrita, como os defaults etapa/resultado, precisa ser preservada em outro lugar; se precisar, copie o trecho relevante para o ADR-0007 antes de remover a task).
Faça commit `docs: remove superseded n8n webhook contract`.
```

---

## CORR-07 — Atualizar ARCHITECTURE.md e PROJECT_STATE.md

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Remova a seção "Integração n8n" de docs/PROJECT_STATE.md e o parágrafo "AI screening" (three integration endpoints...) de docs/ARCHITECTURE.md que descrevem o fluxo via n8n, incluindo as referências a docs/N8N_WEBHOOK_CONTRACT.md (removido pela CORR-06).

Substitua por um resumo curto: "Triagem de IA executada nativamente pela plataforma via motor de agentes configurável (ver ADR-0007); detalhamento completo vem com o roteiro da nova Fase 14." Não invente detalhes de implementação do motor de agentes ainda — isso é escopo do próximo roteiro.
Faça commit `docs: update architecture and project state for native ai engine`.
```

---

## CORR-09 — Ajustar a TASK-094 do roteiro principal

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Em WGOTalent_GREENFIELD_ROTEIRO_COPILOT.md, acrescente uma linha ao prompt da TASK-094: "Após salvar via StorageProvider, disparar o agente extracao_curriculo (motor de agentes da nova Fase 14) de forma assíncrona." O resto da task permanece igual — não é uma reescrita completa.
Faça commit `docs(harness): link manual upload task to native ai engine`.
```

---

## CORR-10 — Revisar a skill webhook-contract-check

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Leia .agents/skills/webhook-contract-check/SKILL.md. Ela é inteiramente sobre validar contrato do n8n, arquitetura que não existe mais.

Decida (e justifique a escolha no commit): (a) reescrever a skill como "intake-contract-check", genérica pra validar os contratos de entrada dos agentes IA e dos providers de e-mail, ou (b) remover a skill por completo se nenhum escopo equivalente sobreviver. Se optar por (b), pesquise e remova referências a ela em outros arquivos (.github/instructions/integrations.instructions.md, outras skills).
Faça commit `chore(harness): resolve obsolete webhook-contract-check skill`.
```

---

## CORR-11 — Remover referências de rota n8n em layer-api

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Remova .agents/skills/layer-api/references/n8n-webhook-route.md e .agents/skills/layer-api/references/n8n-candidatos-webhook-route.md — são padrões de referência para Route Handlers do webhook n8n que não serão implementados.
Atualize .agents/skills/layer-api/SKILL.md removendo qualquer referência a esses dois arquivos.
Faça commit `chore(harness): remove n8n route handler reference patterns`.
```

---

## CORR-12 — Remover/atualizar validação de webhook em layer-validation

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Remova .agents/skills/layer-validation/references/webhook-schema.md (padrão de validação do payload n8n, mesmo escopo da antiga TASK-061).
Atualize .agents/skills/layer-validation/SKILL.md removendo a referência a esse arquivo.
Faça commit `chore(harness): remove n8n webhook validation reference pattern`.
```

---

## CORR-13 — Inspecionar referências remanescentes antes de editar

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Leia .agents/skills/layer-actions/references/triagens-actions.md e .github/instructions/nextjs.instructions.md — ambos têm menção a n8n encontrada por busca textual.

Para cada um: identifique especificamente o que menciona n8n. Se for só exemplo/referência de implementação amarrado ao fluxo antigo, remova ou reescreva pra refletir o motor de agentes nativo. Se houver uma regra de negócio ou padrão de arquitetura que sobrevive independente do n8n (ex: uso de transaction, formato de resposta de Server Action), preserve essa parte e só remova o que é n8n-specific.
Não faça remoção cega — reporte o que encontrou e a decisão tomada em cada arquivo no corpo do commit.
Faça commit `chore(harness): resolve remaining n8n references in skills and instructions`.
```

---

## CORR-14 — Auditoria final de limpeza

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Rode a skill repository-cleanliness-check sobre o repositório inteiro, com foco em referências a "n8n", "webhook" (no sentido do antigo fluxo n8n) e à arquitetura de integração descontinuada.

Liste qualquer arquivo, import, referência de skill, instruction, ADR ou variável de ambiente que ainda aponte pra arquitetura n8n e não tenha sido coberto pelas tasks CORR-01 a CORR-13.
Não corrija automaticamente — reporte antes de agir. Esta é a task de fechamento do bloco de correção; só depois dela o roteiro principal deve ser retomado na TASK-062.
```
