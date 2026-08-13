# 5. Disparo Outbound para n8n Classificador

Data: 2026-08-13

## Status

Aceito

## Contexto

A plataforma de Triagem precisa acionar ativamente (outbound) o agente Classificador (orquestrado no n8n) sempre que um novo candidato for registrado (via webhook inbound `Cadastro_Candidato`) ou quando uma nova vaga for cadastrada manualmente pelo RH.

O objetivo do Classificador é receber os perfis e vagas compatíveis (mesma cidade), avaliá-los utilizando IA e, posteriormente, retornar o resultado para a plataforma via webhook inbound de Triagem.

Para que isso ocorra, precisamos definir a mecânica desse disparo outbound, como filtrar os dados e o comportamento esperado da plataforma em relação a falhas e desempenho.

## Decisão

Foi decidido implementar o disparo outbound seguindo as regras abaixo:

### 1. URL do Classificador
- A URL do webhook do Classificador no n8n não será fixada (hardcoded) no código.
- Será utilizada uma variável de ambiente: `CLASSIFICADOR_N8N_WEBHOOK_URL`.
- *Planejamento:* Esta variável deverá ser adicionada ao esquema de validação em `src/env.js` (como `z.string().url()`) e documentada.

### 2. Comportamento da Chamada HTTP (Fire-and-Forget)
- A chamada ao Classificador deve ser **fire-and-forget** (disparar e esquecer). A plataforma não deve aguardar a execução do workflow de IA do n8n.
- Deve-se configurar um timeout curto (ex: 3 a 5 segundos) apenas para garantir que a requisição inicial foi recebida pelo n8n.
- O resultado real da avaliação de IA retornará de forma assíncrona, via webhook de Triagem (`/api/webhooks/n8n/triagem`).

### 3. Tolerância a Falhas e Isolamento de Transação
- A falha no disparo outbound (ex: n8n fora do ar, timeout, erro 500) **não deve reverter (rollback)** a transação de banco de dados que registrou o candidato ou a vaga.
- O registro local (candidato ou vaga) é soberano. Se o webhook falhar, o erro deve ser apenas **logado** (para eventual retentativa ou auditoria), mas o fluxo principal da aplicação deve retornar sucesso para o RH ou para a esteira de cadastro.

### 4. Filtro e Matching Inicial (Mesma Cidade)
O payload enviado ao Classificador deve conter pares de (Candidato, Vaga) previamente filtrados na base da plataforma:
- **Ao cadastrar Candidato:** Buscar vagas onde `status = 'aberta'` e `vaga.cidade = candidato.cidade`.
- **Ao cadastrar Vaga:** Buscar candidatos "ativos" (sem deleção lógica) e onde `candidato.cidade = vaga.cidade`.

### 5. Limite de Lote (Batching) e Rate Limiting
- Para evitar sobrecarga no n8n ou estouro de timeout, o disparo deve limitar a quantidade máxima de pares processados.
- **Limite sugerido:** Máximo de 50 vagas cruzadas para um novo candidato, ou 50 candidatos cruzados para uma nova vaga, por disparo.
- Caso o limite seja excedido, os restantes poderão ser processados em lotes separados ou sob demanda posteriormente.

### 6. Contexto de Execução no Next.js (Server Actions)
- Para que o disparo não bloqueie a renderização da UI ou atrase a resposta HTTP (tanto em Server Actions quanto em Route Handlers), deve-se utilizar a função `after()` do Next.js 15+ (se disponível/estável no ambiente) para agendar a execução da chamada outbound após a resposta HTTP.
- Caso `after()` não seja viável, a chamada (via `fetch` sem `await` obstrutivo ou executada de forma promise-detached) deve ocorrer no final do bloco do Server Action / Route Handler, imediatamente antes do `return`.

## Consequências

- **Desacoplamento:** O banco de dados do RH e a disponibilidade da plataforma não ficam reféns da estabilidade do n8n.
- **Assincronicidade:** A experiência do usuário (RH) permanece rápida ao criar vagas, pois o processamento da IA ocorre em background.
- **Configuração Adicional:** Será necessário provisionar a variável `CLASSIFICADOR_N8N_WEBHOOK_URL` nos ambientes de deploy.
- **Observabilidade:** Serão necessários logs estruturados para monitorar quando o disparo outbound falha, uma vez que não haverá retry automático implementado nativamente na V1.