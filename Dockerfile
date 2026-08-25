# syntax=docker/dockerfile:1

###############################################################################
# Estágio 1 — deps: instala a árvore completa de dependências uma única vez.
# Este layer só é invalidado quando package.json/package-lock.json mudam,
# então rebuilds de código não pagam o custo do `npm ci`.
###############################################################################
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

###############################################################################
# Estágio 2 — builder: compila o Next.js em modo standalone.
#
# Build-time vs runtime (a distinção que importa):
#
#   * Vars NEXT_PUBLIC_* são INLINADAS no bundle JS do cliente durante o
#     `next build`. Elas precisam existir AQUI, como ARG de build — e por
#     definição são públicas (vão para o navegador de qualquer forma).
#     NUNCA passe segredo via ARG: ARGs ficam gravados nos layers/history
#     da imagem.
#
#   * Vars server-side (DATABASE_URL, AGENT_CREDENTIALS_ENCRYPTION_KEY,
#     STORAGE_ROOT, EMAIL_CAPTURA_INTERVALO_MS) são lidas em RUNTIME por
#     src/env.js. Elas NÃO devem existir no build: SKIP_ENV_VALIDATION=1
#     faz o env.js pular a validação, o build não precisa de nenhum
#     segredo e, portanto, nenhum segredo entra em layer de imagem.
###############################################################################
FROM node:22-alpine AS builder
WORKDIR /app
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_TELEMETRY_DISABLED=1

# O projeto hoje não tem nenhuma var NEXT_PUBLIC_* (client: {} em src/env.js).
# Quando ganhar, o caminho é este — ARG no build, nunca no .env de runtime:
#   ARG NEXT_PUBLIC_APP_URL
#   ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
# e no compose:  build: { args: { NEXT_PUBLIC_APP_URL: "https://..." } }

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

###############################################################################
# Estágio migrate: imagem one-off para `npm run db:migrate`.
#
# Herda do builder de propósito: migração precisa de drizzle-kit
# (devDependency), drizzle.config.ts e da pasta drizzle/ — nada disso existe
# na imagem standalone de produção. Esta imagem nunca roda como serviço
# permanente; é usada apenas via `docker compose run --rm migrate` no deploy.
###############################################################################
FROM builder AS migrate
# Reativa a validação do env.js: em runtime de migração o .env completo está
# presente (via env_file), então validar é de graça e pega config quebrada
# antes de tocar no banco. String vazia = falsy para SKIP_ENV_VALIDATION.
ENV SKIP_ENV_VALIDATION=""
USER node
CMD ["npm", "run", "db:migrate"]

###############################################################################
# Estágio 3 — runner: imagem final mínima.
# Só entra o output standalone (server.js + node_modules podados pelo file
# tracing), assets estáticos e public/. Sem npm, sem código-fonte, sem
# devDependencies, sem shell utilities além do busybox do alpine. Non-root.
###############################################################################
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# server.js do standalone lê HOSTNAME/PORT; 0.0.0.0 para aceitar conexões
# vindas do proxy pela rede interna do compose.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# STORAGE_ROOT dos currículos. Criado já com o dono certo: quando o volume
# nomeado (vazio) é montado aqui pela primeira vez, o Docker copia o
# ownership deste diretório para o volume — sem isso o volume nasceria
# root:root e o app (non-root) não conseguiria gravar upload nenhum.
RUN mkdir -p /app/storage && chown nextjs:nodejs /app/storage

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
