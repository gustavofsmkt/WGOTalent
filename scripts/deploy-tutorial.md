# Tutorial de Deploy — WGOTalent em VPS (Docker Compose)

Stack de produção: `Dockerfile` multi-stage (Next.js standalone, non-root) +
`docker-compose.prod.yml` (app + postgres:16). TLS e roteamento ficam a cargo
do **Nginx Proxy Manager (NPM)** da VPS, que já detém as portas 80/443 e
emite os certificados SSL. Este stack não sobe nenhum reverse proxy próprio.

## Primeiro deploy (uma única vez, na VPS)

```bash
# 1. Obter o código
git clone <repo> /opt/wgotalent && cd /opt/wgotalent

# 2. Criar os volumes de dados — uma vez, para sempre. O Compose nunca
#    cria nem remove estes volumes (external: true); todo o resto é
#    descartável.
docker volume create wgotalent_pgdata
docker volume create wgotalent_storage

# 3. Env de produção — segredos vivem só neste arquivo, só no servidor
cp .env.example .env
chmod 600 .env
```

Edite o `.env` e substitua **todos** os valores `_____CHANGE_ME_____`
e campos em branco por valores reais de produção:

- `POSTGRES_USER` / `POSTGRES_PASSWORD` (forte) / `POSTGRES_DB`
- `DATABASE_URL="postgresql://<user>:<senha>@postgres:5432/<db>"` — o host
  é `postgres`, o nome do serviço no Compose, não localhost
- `STORAGE_ROOT="/app/storage"` — ponto de montagem do volume de currículos
  dentro do container
- `APP_PORT=3000` — porta exposta no host (vinculada a `127.0.0.1`); escolha
  uma porta livre na VPS se 3000 já estiver em uso
- `AGENT_CREDENTIALS_ENCRYPTION_KEY` — `openssl rand -base64 32`, e nunca
  a perca (as credenciais LLM cifradas ficam ilegíveis sem ela)
- `BACKUP_RCLONE_REMOTE` — remote rclone configurado (ex.: `b2:wgotalent-backups`);
  o cron de backup usa este valor para enviar os dumps off-host e aplicar
  retenção remota. Configure antes de colocar em produção.

O script de deploy falha com erro se o `.env` não tiver `chmod 600`.

```bash
# 4. Deploy
./scripts/deploy.sh
```

O script constrói as imagens, sobe o Postgres (o volume vazio
`wgotalent_pgdata` é inicializado e `infra/postgres/init/` cria a extensão
`unaccent`), faz um backup, aplica todas as migrações de `drizzle/`, sobe o
app e aguarda o healthcheck.

```bash
# 5. Verificar que o app está respondendo (antes de configurar o NPM)
curl http://127.0.0.1:3000/api/health
# Esperado: {"status":"ok"}
```

### Configurando o Nginx Proxy Manager

No painel do NPM, crie um novo **Proxy Host**:

- **Domain Names:** `talent.wgo.com.br`
- **Scheme:** `http`
- **Forward Hostname/IP:** `127.0.0.1`
- **Forward Port:** `3000` (ou o valor de `APP_PORT`)
- **SSL:** emita ou selecione o certificado Let's Encrypt na aba SSL

Pronto — o NPM roteia `talent.wgo.com.br` → `http://127.0.0.1:3000` com TLS.

Por fim, configure o cron de backup no host:

```cron
17 3 * * * cd /opt/wgotalent && ./infra/backup/backup.sh daily >> logs/backup.log 2>&1
```

O script envia os dumps para `BACKUP_RCLONE_REMOTE` e aplica retenção remota
(`BACKUP_RETENTION_DAYS`, padrão 14 dias). Se `BACKUP_RCLONE_REMOTE` não
estiver definido no ambiente do cron, o script avisa — configure-o para que
o backup saia do disco da VPS.

## Todos os deploys seguintes

```bash
cd /opt/wgotalent
git pull
./scripts/deploy.sh
```

O script executa sempre a mesma sequência segura: **build** das imagens novas
enquanto o app antigo segue servindo, **backup** (dump `pre-deploy-*`; o
deploy aborta se ele falhar), **migrate** como one-off com o código novo, e
então **swap** dos containers aguardando o healthcheck.

As imagens são tagueadas com `${GIT_SHA:-latest}`. Para inspecionar qual
versão está rodando:

```bash
docker inspect wgotalent-app:latest --format '{{.Config.Image}}'
```

Rollback de código (schema ok): `git checkout <tag-anterior> && ./scripts/deploy.sh`.

## Migrações

- Sempre executadas como one-off antes do swap, **nunca** no restart do
  container: `docker compose -f docker-compose.prod.yml run --rm migrate`.
  O `deploy.sh` já faz isso na sequência certa.
- Escreva migrações **expand/contract**: adicione colunas/tabelas no release
  atual, remova-as só num release posterior. Isso garante que o código antigo
  rode sobre o schema novo, tornando o rollback de código simples
  (`git checkout <tag-anterior> && ./scripts/deploy.sh`) sem precisar reverter
  schema.
- **Migração destrutiva que quebrou no meio**: o `deploy.sh` tira um dump
  `pre-deploy-*` imediatamente antes do migrate. Se algo correr mal, restaure
  com `./infra/backup/restore.sh backups/pre-deploy-<timestamp>.dump`.
  O drizzle-kit não tem "migrate down" — o dump é o único rollback confiável
  para esse cenário.

## Backup e restore

```bash
# Backup manual (pg_dump -Fc + tar do volume de currículos)
./infra/backup/backup.sh

# Drill mensal — restaura em banco descartável e valida, sem tocar no banco real
./infra/backup/restore.sh --drill backups/<arquivo>.dump

# Restore real (pede confirmação digitando o nome do banco)
./infra/backup/restore.sh backups/<arquivo>.dump
```

Execute o drill ao menos uma vez por mês. Backup nunca testado não é backup.

## Upgrade de major do Postgres (16 → 17+)

Trocar a tag da imagem contra o volume antigo **não funciona**: o formato
on-disk é por major e o Postgres 17 se recusa a abrir um cluster 16. O
caminho seguro é dump/restore:

```bash
./infra/backup/backup.sh pre-upgrade          # dump com as ferramentas do PG 16
docker compose -f docker-compose.prod.yml down
docker volume create wgotalent_pgdata_17
# editar docker-compose.prod.yml: image postgres:17-alpine + volume novo
docker compose -f docker-compose.prod.yml up -d postgres
./infra/backup/restore.sh backups/pre-upgrade-<timestamp>.dump
./scripts/deploy.sh                            # valida app + healthcheck
# só depois de dias estável:
docker volume rm wgotalent_pgdata              # remove o volume antigo
```

Nunca troque a variante da imagem (`-alpine` ↔ debian) sobre o mesmo volume:
a diferença de collation da libc corrompe índices de texto.

## Teste local da stack de produção

Para validar a imagem antes de subir para a VPS, rode direto na sua máquina:

```bash
# Crie volumes locais descartáveis (uma vez)
docker volume create wgotalent_pgdata
docker volume create wgotalent_storage

# Suba a stack
docker compose -f docker-compose.prod.yml up -d
```

O app fica acessível em `http://localhost:3000` — a porta é vinculada a
`127.0.0.1`, suficiente para acesso pelo navegador na mesma máquina.

## Zero-downtime — o que esta stack entrega

Compose puro recria o container do app no swap do deploy: há uma janela de
segundos em que o NPM responde 502. Build e migração acontecem antes do swap
e o healthcheck garante que só o container saudável recebe tráfego, o que
mitiga a janela. Zero-downtime real exigiria duas réplicas com drain no
proxy — decisão consciente de ficar fora do MVP.

## Top 5 formas de este setup perder dados — e a proteção para cada uma

1. **`docker compose down -v` ou `docker volume prune`** — os dois volumes
   de dados são `external: true` com nome literal: o Compose se recusa a
   remover externals, e o prune pula volumes referenciados por containers.
2. **Renomear a pasta do deploy** — sem nome de projeto fixado, o Compose
   derivaria nomes de volume novos e subiria um banco vazio.
   `name: wgotalent` + nomes literais de volume tornam o caminho da pasta
   irrelevante; o `deploy.sh` ainda falha imediatamente se os volumes não
   existirem.
3. **Trocar para `postgres:17` sobre o volume antigo** — o formato
   on-disk é por major; o PG 17 se recusa a abrir um cluster 16. O major
   está fixado, e a seção de upgrade acima documenta o caminho seguro via
   dump/restore.
4. **Migração que falha no meio do deploy** — o `deploy.sh` tira um dump
   `pre-deploy` imediatamente antes do `migrate` e aborta se o backup
   falhar; o drizzle não tem "migrate down", então o rollback documentado
   é o `restore.sh` + disciplina expand/contract nas migrações.
5. **O disco da VPS morre — o volume era a única cópia** — o cron noturno
   roda `pg_dump` + tar do storage com envio off-host via rclone
   (`BACKUP_RCLONE_REMOTE`) e aplica retenção remota automaticamente. O
   `restore.sh --drill` restaura em um banco descartável mensalmente, para
   que o backup seja comprovadamente restaurável, não presumido.
