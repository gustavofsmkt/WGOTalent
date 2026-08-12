---
description: Diretrizes e padrões para testes automatizados, Vitest, testes unitários, de integração em PostgreSQL e testes de regressão.
applyTo:
  - "tests/**/*"
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
  - "vitest.config.ts"
---

# Instruções de Testes (Vitest)

Este documento estabelece as regras e padrões obrigatórios para a criação, execução e manutenção de testes no projeto WGOTalent.

## 1. Runner e Framework
- **Vitest**: O Vitest é o test runner oficial e exclusivo do projeto.
- **Rápido e Tipado**: Testes devem ser escritos em TypeScript, aproveitando o suporte nativo do Vitest a Módulos ES e verificação de tipos.

## 2. Testes Unitários (Sem Dependência de DB)
- **Isolamento de Banco:** Sempre que possível, escreva testes unitários que **não dependam de banco de dados**.
- **Foco:** Validações de schemas Zod, funções de transformação, utilitários, regras de negócio puras e helpers da aplicação.
- **Rapidez:** Testes unitários devem executar de forma instantânea para dar feedback rápido no ciclo de desenvolvimento.

## 3. Testes de Integração (Postgres Local Descartável)
- **Banco de Dados Real:** Testes de integração que necessitam de persistência devem rodar contra uma instância do PostgreSQL local descartável e isolada (via Docker Compose).
- **Validação de Constraints:** Valide o comportamento real de índices únicos simples (não parciais) para `Departamento.nome` e `Candidato.email` — um soft delete não libera o slot. Valide também integridade referencial, soft deletes e transações (`db.transaction()`).
- **Limpeza de Estado:** Garantir que cada teste limpe seus dados ou rode em um estado isolado para evitar contaminação entre testes (flakiness).

## 4. Testes de Regressão
- **Regra de Ouro:** Qualquer correção de bug **DEVE** incluir um teste de regressão que reproduza a falha reportada antes da correção e garanta que o problema não volte a ocorrer.

## 5. Validação de Migrações em DB Vazio
- **Migrações do Zero:** Teste as migrações geradas pelo Drizzle Kit executando-as em uma instância de banco de dados completamente limpa/vazia (`empty DB`), garantindo que o Drizzle consiga construir todo o schema sem erros de sintaxe ou dependências de ordem.

## 6. Dados Fictícios e Privacidade (PII)
- **Apenas Dados Fictícios:** Todos os dados de teste (fixtures, seeds, mocks) devem ser estritamente fictícios e gerados por código ou fixtures estáticas seguras.
- **Zero PII ou Dados Reais:** É terminantemente proibido utilizar dados de pessoas reais, currículos autênticos, credenciais ou segredos corporativos em arquivos de teste.

## 7. Integridade da Suíte de Testes
- **NUNCA Remover Testes para Passar:** É estritamente proibido deletar, comentar, pular (`it.skip`, `describe.skip`) ou adulterar testes existentes apenas para fazer a suíte verdejar.
- **Correção da Causa Raiz:** Quando um teste falhar, corrija o código da aplicação. Se as regras de negócio tiverem mudado formalmente, atualize os testes refletindo os novos requisitos com clareza.
