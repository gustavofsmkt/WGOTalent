# Postura de Segurança e Privacidade

Este documento descreve como o WGOTalent trata segredos, credenciais e dados
pessoais (PII) de candidatos no estado atual do projeto (MVP, greenfield, sem
autenticação — ver [docs/PRODUCT.md](PRODUCT.md)). Não duplica o modelo de
dados ([docs/db_triagem_proposta.ts](db_triagem_proposta.ts)) nem as decisões
já registradas em ADR — linka para elas.

## Credenciais e chaves de IA em repouso

- Credenciais de provedor de LLM (`apiKeyCifrada` em
  `wgotalent_llm_credenciais`) são cifradas em repouso com AES-256-GCM antes
  de gravar no banco — nunca em texto puro (ver
  [src/lib/agents/crypto.ts](../src/lib/agents/crypto.ts)).
- A chave mestra é `AGENT_CREDENTIALS_ENCRYPTION_KEY` (mín. 32 bytes,
  base64), validada em [src/env.js](../src/env.js) e nunca commitada (vive só
  em `.env`, gitignored).
- **Rotação da chave mestra sem re-cifrar as credenciais existentes torna
  todas elas permanentemente ilegíveis** — não há como decifrar sem a chave
  original. Qualquer rotação precisa de um plano explícito de re-cifragem
  (decifrar com a chave antiga, recifrar com a nova) antes de trocar a
  variável de ambiente.
- `apiKeyCifrada` nunca deve ser exposta fora da camada de
  repository/`lib/agents` — nenhum type de retorno de Server Action ou de
  página deve incluí-la, e nenhum log deve imprimir a chave em texto puro
  (nem a cifrada, nem a decifrada) em nenhuma etapa do fluxo de
  criação/uso de credencial (`src/actions/credenciais.ts`,
  `src/lib/agents/gemini-client.ts`).

## PII de candidatos

O `Candidato` concentra dados pessoais sensíveis: nome, e-mail, celular,
endereço completo, data de nascimento, estado civil, CNH, e o campo `pcd`
(informação de deficiência — dado sensível). Some a isso o currículo em si
(arquivo + texto extraído) e o parecer/avaliação de IA, que podem conter
informações adicionais inferidas do candidato.

Como o MVP roda **sem autenticação** (próxima seção), qualquer PII persistida
é acessível a quem tiver acesso à rede/instância — trate o ambiente como
"segredo é a borda de rede", não a aplicação. Não exponha uma instância deste
projeto na internet pública nesta fase.

## Currículo (arquivo)

- Formatos aceitos: PDF, DOCX (via `mammoth`), PNG, JPEG (ver
  [ADR-0007](decisions/0007-encerramento-integracao-n8n.md)).
- Arquivos nunca ficam em `public/`; são servidos via
  `src/app/api/files/[...path]/route.ts`, que hoje só isola o caminho do
  disco público — **não há verificação de autorização** nessa rota, porque
  não há autenticação no MVP (mesma ressalva da seção anterior).
- `StorageProvider` explicitamente **não** faz validação de tipo de conteúdo,
  scan de malware ou limite de tamanho — isso é responsabilidade de quem
  chama `save()` (ver contrato em
  [src/lib/storage/storage.ts](../src/lib/storage/storage.ts)). Hoje nada na
  aplicação faz esse scan; é um risco aceito conscientemente para o MVP, não
  um esquecimento — deve ser endereçado antes de qualquer exposição além de
  uso interno/confiável.

## Storage path

- Chaves de arquivo (`curriculo_arquivo_key`) são geradas pela aplicação
  (UUID), nunca derivadas de nome de arquivo enviado pelo usuário — isso
  elimina path traversal e colisão por nome (ver invariante 1 em
  `src/lib/storage/storage.ts`).
- O diretório apontado por `STORAGE_ROOT` (padrão `./storage`, ver
  [.env.example](../.env.example)) está no `.gitignore` (`/storage/`) — foi
  confirmado que nenhum currículo real ou de teste já entrou em um commit
  (ver [Varredura de segredos no Git](#varredura-de-segredos-no-git)).
- **Soft delete de um `Candidato` não apaga o arquivo em disco.** A cascata
  de soft delete (`deletarCandidato`) marca `deleted_at` nas linhas do banco,
  mas não chama `StorageProvider.delete()` sobre o currículo associado — o
  arquivo permanece em `STORAGE_ROOT` indefinidamente. Se isso for um
  requisito de retenção/privacidade no futuro, precisa ser implementado
  explicitamente; hoje não é.

## Logs

- Strings de conexão só devem aparecer mascaradas em log — já é o padrão
  seguido por `src/server/db/seed.ts` e `scripts/db-smoke-test.js`
  (`DATABASE_URL` some com `:***@` antes de qualquer `console.log`). Siga o
  mesmo padrão em qualquer log novo que precise citar a URL do banco.
- Nunca faça `console.log`/`console.error` do payload bruto de uma Server
  Action que possa carregar uma API key em texto puro (ex: o `payload` de
  `createCredencial`) nem do texto de currículo extraído/parecer de IA em
  volume — os `catch` atuais em `src/actions/credenciais.ts` já logam só o
  objeto de erro, não o payload; mantenha esse padrão ao adicionar novas
  actions sobre credenciais.
- Nenhum log deve incluir `apiKeyCifrada` nem o resultado de
  `decryptCredential()`.

## Variáveis de ambiente

- `.env` é gitignored (`.env*` com exceção de `.env.example` em
  [.gitignore](../.gitignore)) e nunca foi commitado neste repositório (
  verificado no histórico completo — ver
  [Varredura de segredos no Git](#varredura-de-segredos-no-git)).
- `.env.example` é o único arquivo de env versionado e não deve conter
  segredo real — hoje contém só placeholders/defaults de desenvolvimento
  local (ex: senha `password` do Postgres do `docker-compose.yml`, que só
  vale para o container local e nunca deve ser reaproveitada fora disso).
- Toda variável precisa estar declarada e validada em
  [src/env.js](../src/env.js) (`@t3-oss/env-nextjs` + Zod) — nunca leia
  `process.env.*` diretamente em código de servidor. Isso garante fail-fast
  se uma variável obrigatória (como a chave de cifragem) estiver ausente.

## Ausência de autenticação no MVP

É uma decisão de produto explícita, não uma lacuna esquecida (ver
[docs/PRODUCT.md](PRODUCT.md), "Fora de Escopo"): o sistema roda
**totalmente aberto** — sem login, sem perfis, sem autorização — incluindo as
rotas `/admin/agentes` e `/admin/credenciais`, onde ficam os prompts do motor
de IA e o cadastro de credenciais de LLM.

Consequências práticas:

- Qualquer pessoa com acesso de rede à instância pode ler/editar PII de
  candidatos, currículos, e (se a UI não estiver devidamente restrita) o
  fluxo de cadastro de credenciais.
- **Não exponha uma instância deste MVP em rede pública ou compartilhada.**
  Rode apenas em ambiente local/confiável até que autenticação e autorização
  sejam implementadas.
- O código já é estruturado para que auth possa ser adicionada depois sem
  reescrita (Server Actions e Route Handlers como única fronteira de
  mutação) — mas até lá, não adicione autenticação "de remendo" (ex: uma
  checagem de senha hardcoded numa única rota); trate como uma mudança
  transversal planejada, não um patch local.

## Soft delete não é anonimização

Soft delete (`deleted_at`) é um mecanismo de **integridade referencial e
recuperação de dados**, não um mecanismo de privacidade:

- Todos os dados pessoais de um `Candidato` soft-deletado continuam
  integralmente no banco (e o currículo continua no disco, ver
  [Storage path](#storage-path)) — só deixam de aparecer em listagens que
  filtram por `notDeleted()`.
- Os índices `UNIQUE` de `Departamento.nome` e `Candidato.email` **não são
  parciais** — um registro soft-deletado continua bloqueando o reuso do
  mesmo nome/e-mail. Isso é intencional para o fluxo de negócio (ver
  [ADR-0003](decisions/0003-organizational-soft-delete-semantics.md) e
  [ADR-0008](decisions/0008-candidato-duplicado-restaurar-e-mesclar.md)), mas
  reforça que soft delete não remove o dado nem libera o identificador.
- Se algum requisito de privacidade exigir apagar de fato os dados de um
  candidato (ex: solicitação de titular sob a LGPD), soft delete **não
  atende** essa exigência sozinho — seria necessário um mecanismo de
  expurgo/anonimização real, que não existe hoje no projeto.

## Dados fictícios

- [src/server/db/seed.ts](../src/server/db/seed.ts) só insere dados
  claramente fictícios: e-mails em `@exemplo.com.br`, URLs de
  LinkedIn/portfólio com o sufixo `-ficticio`, e o próprio log de execução
  identifica o passo como "Seeding Candidatos (Dados Fictícios)". Currículos
  referenciados (`curriculos/*.pdf`) não existem de fato em `storage/` — são
  só chaves de exemplo.
- Os mockups estáticos em `docs/references/ui/**/*.html` usam endereços
  genéricos `@email.com` — também fictícios, servem só de referência visual
  de layout.
- **Regra para qualquer fixture, seed ou dado de teste novo**: nunca use
  dado real de candidato (nome, e-mail, telefone, currículo) — sempre dado
  sintético e claramente identificável como tal (domínio de e-mail
  reservado, marcador tipo "ficticio"/"exemplo"). Se for necessário importar
  dados reais para depuração local, trate o ambiente inteiro (banco, logs,
  `storage/`) como dado sensível de produção e nunca comite nada derivado
  dele.

## Varredura de segredos no Git

Antes de escrever este documento, foi feita uma varredura no histórico
completo do repositório (`git log --all -p` sobre todos os commits/branches)
em busca de segredos e dados reais expostos:

- `.env` — nunca foi commitado (só `.env.example` está versionado, em
  qualquer commit).
- Padrões de chave de API (`AIza…` do Google, `sk-…` estilo OpenAI,
  `AKIA…` da AWS, tokens Slack `xox…`, blocos `BEGIN … PRIVATE KEY`, JWTs) —
  nenhuma ocorrência.
- `AGENT_CREDENTIALS_ENCRYPTION_KEY=` — só aparece vazia (`""`) em
  `.env.example`, nunca com um valor real.
- `DATABASE_URL=` — só aparece com o default de desenvolvimento do
  `docker-compose.yml` (`postgres:password@localhost`), que é um valor
  público e documentado, não um segredo.
- CPF, e e-mails fora dos domínios de teste/exemplo — nenhuma ocorrência de
  CPF; os únicos e-mails "reais-parecendo" encontrados são os mockups
  `@email.com` em `docs/references/ui/`, que são dado de design fictício
  (ver [Dados fictícios](#dados-fictícios)), não PII real.

**Resultado**: nenhum segredo ou dado pessoal real foi encontrado no
histórico do Git. Não houve necessidade de reescrever histórico (`filter-repo`/
`BFG`) nem de revogar credenciais. Se uma futura varredura encontrar uma
exposição real, o procedimento é: (1) revogar/rotacionar o segredo exposto
imediatamente na origem (provedor de LLM, banco, etc.) — a chave em si já
deve ser tratada como comprometida assim que aparece no histórico, reescrever
o Git não desfaz isso; (2) remover o valor do estado atual do repositório;
(3) só então avaliar reescrita de histórico, com o time alinhado, já que isso
reescreve hashes de commit para todo mundo com um clone.

## Reportar um problema de segurança

Ainda não há um processo formal de disclosure para este projeto (MVP interno,
sem usuários externos). Reporte diretamente ao mantenedor do repositório.
