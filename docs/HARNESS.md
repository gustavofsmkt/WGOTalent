# Harness e Política de Contexto — WGOTalent

Este documento estabelece as diretrizes de governança, localização de artefatos de IA, políticas de uso de Skills, integrações via Model Context Protocol (MCP) e gerenciamento de contexto no VS Code para o projeto WGOTalent.

---

## 1. Localização dos Artefatos de IA (`locations`)

Os artefatos de configuração do agente e instrução do GitHub Copilot estão organizados nas seguintes estruturas de diretórios:

- **Instruções do Copilot:** `.github/copilot-instructions.md` (instrução raiz de alta precedência).
- **Instruções Modularizadas:** `.github/instructions/*.instructions.md` (regras específicas ativadas por escopo `applyTo` para banco de dados, testes, UI, formulários, integrações, documentação e Next.js).
- **Agentes Customizados:** `.github/agents/*.agent.md` (perfis especializados: `Explainer`, `Implementer`, `Planner`, `Reviewer`).
- **Prompts Recorrentes:** `.github/prompts/*.prompt.md` (prompts estruturados para auditorias e rotinas).
- **Skills do Projeto:** `.github/skills/` (skills customizadas e de verificação de qualidade do repositório) e `.claude/skills/` (skills técnicas de frontend, UI, Next.js, formulários e Zod).
- **Configurações do VS Code:** `.vscode/settings.json` (política de inclusão/exclusão de busca e contexto).
- **Documentação e Especificações:** `docs/` (memória arquitetural e DEVLOG) e `docs/specs/` (especificações de domínio e schemas de referência).

---

## 2. Suporte a Skills (`.claude/skills` e `.github/skills`)

O ambiente do agente suporta nativamente a resolução de skills tanto no diretório `.github/skills/` quanto no diretório `.claude/skills/`.

- **`.claude/skills/`:** Armazena as skills técnicas de frontend, arquitetura React/Next.js, componentes shadcn, formulários e validações (ex: `building-components`, `composition-patterns`, `impeccable`, `nextjs-app-router-patterns`, `react-best-practices`, `shadcn`, `tailwind-css-patterns`, `tailwind-design-system`, `tanstack-form`, `zod-validation-utilities`).
- **`.github/skills/`:** Armazena as skills operacionais e de governança do repositório WGOTalent (ex: `drizzle-migration-check`, `soft-delete-check`, `repository-cleanliness-check`, `task-closeout`).

Ambas as localizações devem ser tratadas de forma transparente pelo assistente de IA.

---

## 3. Política de Skill Mínima por Tarefa

Para evitar sobrecarga de contexto (*context blooming*) e manter a precisão do modelo:

- **Uso Seletivo:** Invoque e carregue apenas as skills estritamente necessárias para a resolução da tarefa atual.
- **Não Carregar em Lote:** NUNCA recupere ou leia todas as skills preventivamente. Se a tarefa é focada em banco de dados/Drizzle, invoque apenas as skills de banco e migração. Se for UI, invoque apenas as skills de UI/Tailwind relevantes.
- **Foco Escopado:** Cada interação/chat deve ter escopo limitado e contexto enxuto.

---

## 4. Política de Integrações MCP (Model Context Protocol)

### 4.1. GitHub MCP (Opcional)
- O uso de GitHub MCP é **opcional** e restrito a operações remotas na plataforma GitHub (como criação de Pull Requests remotos, leitura de issues e reviews).
- Para operações locais de desenvolvimento (commits, status, branches locais, verificações de diff), deve-se dar preferência aos comandos Git nativos no terminal.

### 4.2. Proibição de Postgres MCP (`sem Postgres MCP`)
- É **estritamente proibido** conectar ou utilizar ferramentas Postgres MCP diretamente no banco de dados.
- Toda e qualquer alteração de banco de dados ou consulta deve ser realizada via fluxo oficial do Drizzle ORM (schema-first em `src/server/db/schema.ts`, Drizzle Kit para geração de migrações e código da aplicação em TypeScript).

### 4.3. Preferência do CLI do shadcn sobre MCP (`shadcn CLI preferida a MCP`)
- Para adição, atualização ou inspeção de componentes de UI shadcn/ui, deve-se utilizar a **CLI oficial do shadcn** (`npx shadcn@latest add <component>`) via terminal.
- Não utilize ferramentas MCP para manipulação de componentes shadcn/ui quando o CLI oficial puder executar a tarefa diretamente no projeto.

---

## 5. Política de Gerenciamento de Contexto no VS Code

A configuração em `.vscode/settings.json` otimiza a janela de contexto do Copilot e a busca do VS Code, garantindo que o modelo trabalhe apenas com código fonte e documentação relevante.

### 5.1. Diretórios Excluídos de Busca/Contexto
Os seguintes diretórios e padrões de arquivos estão excluídos para prevenir ruído e consumo desnecessário de tokens:
- Artefatos de dependências e build: `node_modules`, `.next`, `coverage`, `volumes`.
- Armazenamento e arquivos temporários/logs: `storage`, `logs`, `*.tmp`, `*.log`, `tmp/`, `temp/`.

### 5.2. Diretórios Preservados (Obrigatórios no Contexto)
Os diretórios essenciais do projeto permanecem totalmente acessíveis à busca e indexação do contexto:
- Código-fonte da aplicação: `src/app`, `src/actions`, `src/lib`, `src/server`, `src/components`, `src/styles`.
- Governança, especificações e esquemas: `docs/` (incluindo `docs/db_triagem_proposta.ts`), `drizzle/` e pastas de skills (`.github/skills`, `.claude/skills`).

---

## 6. Diretrizes Finais de Execução

1. **Uma Tarefa por Conversa:** Mantenha cada sessão de chat focada em uma única TASK do Roteiro.
2. **Sem Configuração Prematura de MCP:** Não configure ou ative ferramentas MCP até que explicitamente solicitado no fluxo do projeto.
3. **Fidelidade à Fonte da Verdade:** Toda mudança deve seguir a arquitetura definida em `docs/ARCHITECTURE.md` e as diretrizes do projeto.
