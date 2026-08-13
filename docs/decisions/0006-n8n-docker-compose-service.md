# 6. n8n como Serviço no Docker Compose

## Status

Aceito

* **Supersedes:** nota de escopo do roteiro greenfield que excluía n8n do `docker-compose.yml`.

## Contexto

A plataforma precisa poder ser migrada para produção via Docker, com o máximo de
componentes relevantes containerizados. n8n é parte ativa da integração
(webhooks inbound de candidatos/triagem e disparo outbound do Classificador —
ver ADR-0004 e ADR-0005) e precisa estar disponível de forma consistente tanto
em desenvolvimento local quanto em produção.

## Decisão

n8n roda como serviço `n8n` no mesmo `docker-compose.yml` do Postgres, usando a
imagem `n8nio/n8n:latest` — sem tag fixa, sempre a versão mais recente
disponível no momento do `docker compose pull`/`up`. Dados, credenciais e
workflows do n8n persistem em um volume nomeado (`n8n_data`).

Enquanto a aplicação Next.js ainda roda fora do Compose (até a Fase 19 —
Containerização de Produção), a comunicação entre app e n8n usa
`localhost`/`host.docker.internal`. Quando a app entrar no mesmo Compose, os
endereços passam a usar os nomes de serviço internos (`n8n`, `app`).

n8n continua sem acesso a `DATABASE_URL` — a fronteira de escrita única pela
aplicação (ver `AGENTS.md`) não muda com esta decisão.

## Consequências

Positivo: ambiente de desenvolvimento e produção ficam mais próximos
(paridade); não é preciso um n8n gerenciado externamente para testar os
webhooks localmente.

Negativo: usar `latest` sem pin de versão significa que um `docker compose
pull` pode trazer uma versão do n8n com mudanças incompatíveis sem aviso
prévio — mitigar rodando `docker compose pull` de forma consciente, não
automática, antes de builds importantes.

## Alternativas

n8n gerenciado externamente (n8n Cloud ou instância separada fora deste
repositório): descartado porque não atende ao objetivo de ter o máximo
possível da stack reproduzível via Docker a partir deste repositório.

Tag de versão fixa do n8n: descartado por decisão explícita de sempre usar a
versão mais recente disponível.
