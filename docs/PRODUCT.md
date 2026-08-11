# Produto: Plataforma de RH (Triagem de Candidatos)

## O Problema
A necessidade de gerenciar de forma estruturada vagas de emprego e o pipeline de candidatos (triagem) através de diferentes etapas. O sistema visa suportar a ingestão automatizada de currículos e avaliações geradas por Inteligência Artificial (via workflow externo no n8n) para agilizar o processo seletivo.

## Usuários
- Profissionais de Recursos Humanos e Recrutadores.
- Gestores de departamentos (que demandam as vagas e participam das etapas finais).

## Entidades Principais
- **Departamento**: Unidade organizacional da empresa.
- **Cargo**: Posições associadas aos departamentos, contendo os requisitos, faixas salariais e critérios.
- **Vaga**: Abertura de uma posição específica para um cargo em determinado local.
- **Candidato**: Perfil da pessoa aplicando para as vagas, contendo informações pessoais, contatos e agregados:
  - Formação Acadêmica
  - Experiência Profissional
  - Certificações
- **Triagem**: Processo de seleção conectando um candidato a uma vaga. Define o status no funil de recrutamento através de `etapa`, `resultado` e `motivo` (para reprovações/desistências).
- **AvaliacaoIA**: Avaliação técnica, pontuação (score) e feedbacks gerados pela Inteligência Artificial, vinculada de forma 1:1 com a Triagem.

## Capacidades do MVP
- **Gestão Organizacional**: CRUD completo de Departamentos, Cargos e Vagas.
- **Gestão de Candidatos**: CRUD de perfis de candidatos, englobando suas experiências, formações e certificações.
- **Pipeline de Triagem**: Visualização e progressão do funil de recrutamento, com controle estrito dos resultados e motivos nas etapas de seleção.
- **Integração Externa (IA)**: Webhook seguro para recebimento assíncrono de dados processados pelo n8n (criação de candidato, triagem e avaliação de IA).
- **Armazenamento de Arquivos**: Interface abstrata `StorageProvider` utilizando disco local para o armazenamento de currículos, blindados sob rotas isoladas.
- **Soft Delete Universal**: Remoção lógica de dados em todas as entidades (via campo `deleted_at`), com operações de exclusão em cascata controladas na camada da aplicação (transações).

## Fora de Escopo (MVP)
- Autenticação, perfis de acesso e autorização (o sistema operará de forma aberta inicialmente).
- Integração nativa com Storage em Nuvem (como AWS S3/Azure Blob).
- UI complexa (como modais avançados, rotas interceptadas ou paralelas).
- Deleções físicas (hard deletes) do banco de dados.
- Escritas diretas do n8n no banco de dados (toda mutação ocorre estritamente pela aplicação via webhooks Next.js).
