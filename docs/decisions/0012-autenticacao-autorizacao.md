# 12. Autenticação e Autorização (Roteiro Pós-MVP, Última Prioridade)

## Status

Proposta

## Contexto

O MVP roda intencionalmente sem autenticação — decisão de produto explícita,
não uma lacuna esquecida (ver [PRODUCT.md — Fora de Escopo](../PRODUCT.md#fora-de-escopo-mvp)
e [SECURITY.md — Ausência de autenticação no MVP](../SECURITY.md#ausência-de-autenticação-no-mvp)).
[AGENTS.md](../../AGENTS.md) proíbe explicitamente Auth.js/NextAuth "no MVP" —
essa restrição é escopada ao MVP atual e precisa ser revisitada, não
simplesmente removida, quando esta fase começar.

A captação de currículo por e-mail deixou de ser extensão pós-MVP e foi
antecipada para dentro do MVP atual (ver
[ADR-0010](./0010-captacao-curriculo-via-email.md)). Esta continua sendo a
última extensão pós-MVP priorizada pelo produto — depois de múltiplos
provedores de LLM (ADR-0011) — por ser a que toca a maior superfície de
UI/rotas mesmo que a arquitetura já a facilite estruturalmente.

Estado atual do código:

- Não existe `middleware.ts` nem qualquer infraestrutura de sessão hoje.
- Duas costuras já estão marcadas no código esperando por esta fase:
  [src/app/admin/layout.tsx:1](../../src/app/admin/layout.tsx) (comentário
  `TODO(RBAC)` já descreve a checagem `role === "admin"` a implementar) e
  [src/app/api/files/[...path]/route.ts:50](../../src/app/api/files/[...path]/route.ts)
  (`TODO: Implement authentication check here in the future`).
- Toda escrita interna já passa por uma fronteira única (Server Actions em
  `src/actions/`) e toda escrita externa/streaming por Route Handlers — essa
  decisão de arquitetura, tomada desde o início do projeto
  ([ARCHITECTURE.md](../ARCHITECTURE.md)), foi propositalmente feita para que
  auth pudesse ser adicionada depois sem reescrita.

## Decisão

Quando esta fase for iniciada:

1. Revisitar a proibição de Auth.js/NextAuth do MVP via um ADR próprio de
   implementação (esta ADR de intenção não decide a biblioteca — apenas
   registra que a decisão será tomada quando a fase começar, considerando o
   que estiver maduro para Next.js App Router + React 19 no momento).
2. Adicionar autenticação como camada centralizada, aproveitando a fronteira
   já existente: middleware de sessão para rotas, gate em Server Actions
   (mutação) e em Route Handlers (streaming de arquivo — resolve o TODO da
   rota de arquivos), e checagem de `role` no layout de `/admin`.
3. Se o requisito for RBAC granular por recurso (não só "logado ou não"),
   cada Server Component de leitura precisará de uma revisão — hoje todas as
   leituras assumem acesso aberto.
4. UI de login/sessão nova, fora do padrão de formulários de domínio já
   estabelecido (TanStack Form + Zod) apenas se a solução de auth escolhida
   exigir formulário próprio.

## Consequências

- **Positivas:** a arquitetura de fronteira única de mutação/streaming
  minimiza a superfície que precisa de gate explícito — não é preciso
  proteger dezenas de endpoints REST espalhados, só os pontos já
  centralizados. Os dois TODOs existentes já documentam exatamente o que
  fazer em cada ponto.
- **Trade-offs:** é a extensão com maior superfície de UI (login, sessão,
  possivelmente perfis) e a única que potencialmente exige revisar leituras
  hoje totalmente abertas se RBAC granular for exigido — por isso fica por
  último na ordem de prioridade, depois da captação por e-mail (já
  antecipada para dentro do MVP, ADR-0010) e do suporte a múltiplos
  provedores de LLM (ADR-0011), ambas mais contidas. Também é a única que
  exige revogar uma restrição hoje formal do projeto (proibição de
  Auth.js/NextAuth), o que por si só justifica uma ADR de implementação
  dedicada no momento em que a fase começar.

## Alternativas

- **Patch pontual de autenticação (ex: senha hardcoded numa única rota)**:
  explicitamente rejeitado em [SECURITY.md](../SECURITY.md#ausência-de-autenticação-no-mvp) —
  deve ser tratado como mudança transversal planejada, não remendo local.
- **Implementar já dentro do MVP atual**: descartado por ora — diferente da
  captação por e-mail (ADR-0010, já antecipada), autenticação exige revogar
  uma restrição hoje formal do projeto (proibição de Auth.js/NextAuth no
  MVP) e toca a maior superfície de UI/rotas das extensões pós-MVP;
  permanece deliberadamente por último na ordem de execução.
