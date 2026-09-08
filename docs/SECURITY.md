# Postura de Segurança e Privacidade

Este documento descreve como o WGOTalent trata segredos, credenciais e dados
pessoais (PII) de candidatos no estado atual do projeto (MVP, greenfield, com
autenticação e sem autorização granular — ver [ADR-0012](decisions/0012-autenticacao-autorizacao.md)). Não duplica o modelo de
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

## Credenciais de e-mail (IMAP) em repouso

- A senha da caixa de e-mail monitorada (`senhaCifrada` em
  `wgotalent_email_credenciais`) segue exatamente o mesmo padrão das
  credenciais de LLM: cifrada em repouso com AES-256-GCM
  ([src/lib/agents/crypto.ts](../src/lib/agents/crypto.ts)), usando a mesma
  chave mestra `AGENT_CREDENTIALS_ENCRYPTION_KEY` — não há uma segunda chave
  nem uma segunda variável de ambiente para isso.
- `senhaCifrada` nunca deve ser exposta fora da camada de
  repository/`lib/email` — o type de retorno de `createEmailCredencial`
  (`EmailCredencialSummary`) não a inclui, e o formulário admin não a
  reexibe após salvar.
- Nenhum log do ciclo de captura (`src/server/email/captura-curriculos.ts`)
  deve imprimir a senha decifrada nem a cifrada — em falha de conexão IMAP,
  o log inclui apenas o host e a mensagem de erro.

## PII de candidatos

O `Candidato` concentra dados pessoais sensíveis: nome, e-mail, celular,
endereço completo, data de nascimento, estado civil, CNH, e o campo `pcd`
(informação de deficiência — dado sensível). Some a isso o currículo em si
(arquivo + texto extraído) e o parecer/avaliação de IA, que podem conter
informações adicionais inferidas do candidato.

O MVP exige autenticação para acessar a aplicação, mas ainda não implementa
autorização granular: qualquer conta autenticada pode consultar e alterar PII.
Limite a criação e distribuição de contas a pessoas autorizadas e mantenha a
instância em uma rede compatível com a sensibilidade desses dados.

Na captação de currículo por e-mail, o corpo e o assunto da mensagem
**nunca são persistidos nem logados** — o ciclo de captura
(`src/server/email/captura-curriculos.ts`) extrai só os bytes dos anexos
elegíveis (mesma lista de mimetypes/tamanho do upload manual) e descarta o
resto da mensagem assim que os anexos são processados, exatamente como no
upload manual.

## Currículo (arquivo)

- Formatos aceitos: PDF, DOCX (via `mammoth`), PNG, JPEG (ver
  [ADR-0007](decisions/0007-encerramento-integracao-n8n.md)).
- Arquivos nunca ficam em `public/`; são servidos via
  `src/app/api/files/[...path]/route.ts`, que exige uma sessão autenticada e
  isola o caminho do disco público. Não há autorização por currículo: qualquer
  usuário autenticado pode abrir um arquivo cuja chave conheça.
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

## Autenticação e sessão

- Todas as páginas exigem login; `/login` e `/api/health` são as únicas rotas
  públicas. Server Actions e a rota de currículos repetem a checagem no ponto
  sensível, sem depender exclusivamente do middleware.
- Senhas são armazenadas como hashes `scrypt` com salt aleatório. A senha
  inicial da conta `admin` é apenas um bootstrap; recomenda-se trocá-la no
  primeiro acesso pela página **Perfil**. A troca não é forçada porque esse
  fluxo não faz parte do requisito atual.
- A sessão stateless é um cookie assinado com HMAC-SHA-256, `HttpOnly`,
  `SameSite=Lax`, `Secure` em produção e validade de sete dias. A chave
  `SESSION_SECRET` nunca deve ser commitada; sua rotação invalida todas as
  sessões.
- Trocas e redefinições incrementam `password_version`, revogando cookies
  anteriores. Senhas geradas são exibidas uma única vez e nunca persistidas em
  texto puro.
- Após cinco tentativas, o login bloqueia apenas o par endereço/usuário durante
  quinze minutos. O bloqueio geral do endereço exige cinquenta falhas na mesma
  janela, reduzindo lockouts coletivos para equipes atrás do mesmo NAT sem
  remover a proteção contra pulverização de usernames. O endereço considerado
  é o último valor de `X-Forwarded-For`, acrescentado pelo Nginx Proxy Manager;
  por isso o app de produção deve continuar exposto apenas em `127.0.0.1`. Se
  nenhum header confiável estiver presente, o login falha antes de consultar o
  banco em produção; desenvolvimento/teste usa um bucket local explícito. O
  contador vive no único processo da aplicação e é zerado em reinícios, uma
  limitação aceita para este deploy sem réplicas.
- Não há papéis nem autorização granular. Inclusive gestão de usuários,
  configurações de agentes e credenciais administrativas ficam disponíveis a
  qualquer usuário autenticado; esse risco é aceito apenas para o escopo atual.

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
