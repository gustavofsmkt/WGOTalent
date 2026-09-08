# 12. Autenticação stateless sem autorização

## Contexto

O WGOTalent deixou de operar com acesso aberto. Todas as páginas, Server
Actions e a rota de currículos precisam identificar um usuário válido antes de
permitir acesso. O requisito atual é somente autenticação: todos os usuários
autenticados continuam com as mesmas capacidades, sem papéis ou RBAC.

O projeto proíbe Auth.js/NextAuth e a mudança não autoriza uma nova
dependência. A solução também precisa usar sessões stateless, sem tabela de
sessões, e manter Server Actions e Route Handlers como fronteiras de mutação e
arquivo.

## Decisão

- Persistir identidades locais em `wgotalent_usuarios`, com `username` único,
  hash de senha via `scrypt`, `password_version` e os timestamps/soft delete
  comuns. A migration cria a conta inicial `admin` com senha inicial `admin`.
- Emitir um cookie `wgo_session` `HttpOnly`, `SameSite=Lax`, `Secure` em
  produção e válido por sete dias. O conteúdo é assinado com HMAC-SHA-256 por
  `SESSION_SECRET`; nenhum estado de sessão é persistido no banco.
- Executar `middleware.ts` no runtime Node.js e validar assinatura, expiração e
  o usuário no banco em toda navegação protegida. O usuário já validado é
  encaminhado em um header interno, sempre removido/substituído pelo próprio
  middleware, para que a DAL, Server Actions e a rota de currículos repitam o
  gate sem uma segunda leitura idêntica na mesma request.
- Incluir `password_version` no token. Trocar ou redefinir uma senha incrementa
  essa versão, invalidando todos os tokens anteriores sem armazenar sessões.
- Permitir que qualquer usuário autenticado liste e crie usuários ou redefina
  senhas, pois autorização e perfis de acesso permanecem fora do escopo.

## Consequências

- A aplicação e os currículos deixam de ser acessíveis anonimamente; `/login`
  e `/api/health` são as únicas rotas públicas.
- A chave `SESSION_SECRET` passa a ser obrigatória, deve ter ao menos 32
  caracteres e sua rotação encerra todas as sessões existentes.
- Senhas geradas têm exatamente oito dígitos e aparecem uma única vez na UI.
  O banco guarda somente hashes com salt aleatório.
- O login limita tentativas em janelas de quinze minutos: cinco falhas por par
  endereço/usuário e cinquenta por endereço. No deploy suportado, o Nginx Proxy
  Manager é o único proxy e o app aceita tráfego somente via loopback; o
  endereço confiável é, portanto, o último valor acrescentado a
  `X-Forwarded-For`. A ausência de um endereço confiável faz o login falhar em
  produção, evitando um bucket global `unknown`; desenvolvimento/teste usa um
  bucket local explícito. O contador é local ao único processo e reinícios
  zeram a janela, limitação aceita porque não haverá réplicas.
- O cookie assinado evita uma tabela de sessões, mas revogação depende da
  consulta ao usuário e de `password_version`; por isso o middleware Node.js
  realiza uma leitura curta de banco em cada request protegido.
- Não há separação de privilégios. Caso RBAC seja necessário, deverá ser
  decidido e implementado em uma mudança posterior.
