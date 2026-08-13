# 4. Mapeamento de Campos n8n para Banco de Dados

Data: 2026-08-13

## Status

Aceito

## Contexto

A plataforma recebe dados de candidatos e avaliações de IA de um agente orquestrado no n8n. O n8n envia payloads em formatos específicos (com wrappers de array e propriedades aninhadas) que não correspondem 1:1 ao nosso esquema de banco de dados (`drizzle.schema.ts`). 
Além disso, certos campos estruturais (como chaves estrangeiras, `etapa` e `resultado` do funil) precisam ser inferidos ou resolvidos pela nossa API antes da persistência.

Para garantir consistência e evitar erros de tipagem e integridade na fronteira (`Route Handlers` inbound), precisamos documentar e fixar como essas transformações ocorrem.

## Decisão

Estabelecemos as seguintes regras obrigatórias de transformação e mapeamento de dados na camada da API, aplicadas assim que o payload é recebido do n8n.

### 1. Webhook de Triagem (`/api/webhooks/n8n/triagem`)

O payload real enviado pelo n8n Triagem é um **array** onde cada item tem um wrapper `output`:
```json
[{ "output": { "candidato_id": "uuid", "vaga_id": "uuid", "score_ia": 85, ... } }]
```

* **`etapa` (DB)**:
  * **Problema**: Ausente no payload do n8n (não envia campo `fase` ou `etapa`).
  * **Solução**: O Route Handler define `etapa = 'curriculo'` fixo para toda triagem criada via webhook IA. As triagens avançarão de etapa no funil apenas manualmente pelo RH via Server Action.
* **`resultado` (DB)**:
  * **Problema**: Ausente no payload do n8n (não envia `recomendacao` nem `resultado`).
  * **Solução**: O Route Handler define `resultado = 'em_andamento'` como valor fixo. O n8n só chama este webhook quando score > 65; candidatos reprovados pela IA não geram registro de Triagem no banco.
* **Campos de Texto Longos (`pontos_fortes`, `requisitos_faltantes`, `eliminatorios_falhos`, `alertas`)**:
  * **Problema/Estado**: Já chegam como `TEXT` do n8n (strings com `\n` embutido), e não como arrays. O nome canônico para o campo de eliminatórios no payload é `eliminatorios_falhos` (não `criterios_eliminatorios_falhos`).
  * **Solução**: Transformar strings vazias (`""`) para que sejam persistidas como `null` no banco.
* **`score_ia`**:
  * **Estado**: Chega como `integer` no payload, é definido como `NUMERIC(5,2)` no banco.
  * **Solução**: Realizar *cast* direto, pois não há perda de precisão esperada.
* **`candidato_id` e `vaga_id`**:
  * **Estado**: O n8n já envia os UUIDs resolvidos corretamente.
  * **Solução**: Utilizar diretamente os UUIDs fornecidos. Não é necessário fazer lookup no banco.

### 2. Webhook de Candidatos (`/api/webhooks/n8n/candidatos`)

* **`area_interesse` (string enviada pelo n8n na chave `referencias`) → `area_interesse_id` (FK para `Departamento`)**:
  * **Estado**: n8n envia strings como "Administrativo", "Comercial", "Recursos Humanos" ou "Técnico/Operacional".
  * **Solução**: A plataforma deve realizar um lookup de banco de dados (`Departamento.nome ILIKE :valor`) para obter o `id`. Se não encontrar correspondência, logar um aviso (`warn`) e salvar `NULL` (campo é nullable).
* **`cargo_interesse` (string enviada pelo n8n na chave `referencias`) → `cargo_interesse_id` (FK para `Cargo`)**:
  * **Estado**: n8n envia uma string descritiva.
  * **Solução**: A plataforma deve realizar um lookup (`Cargo.titulo ILIKE :valor`) para obter o `id`. Se não encontrar correspondência, logar um aviso e salvar `NULL`.
* **`disponibilidade_horarios`**:
  * **Estado**: Pode chegar como `boolean` ou `string` no payload.
  * **Solução**: Se o valor for `false` (boolean) ou `null`, persistir como `NULL` no banco. Se for uma `string` descritiva, persistir como `TEXT`.

## Consequências

* A API se torna a única responsável por inferir o estado inicial no funil de RH para as triagens automáticas (`etapa` e `resultado`).
* Os *lookups* de departamento e cargo podem ser suscetíveis a inconsistências caso o n8n envie nomes ligeiramente diferentes; contudo, o *fallback* para `NULL` com *log* previne a interrupção da esteira de cadastro.
* Será necessário implementar Zod schemas dedicados para os payloads dos webhooks.
