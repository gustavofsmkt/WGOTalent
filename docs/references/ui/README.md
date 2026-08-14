# Referências de UI (Stitch)

Screens de referência visual gerados no Stitch AI a partir dos prompts em `docs/PRODUCT.md` / conversa de design, um por página do MVP (listagem + detalhes, kanban em Triagens). Cada pasta tem o `.png` (screenshot) e o `.html` (código gerado) por tela. `DESIGN.md` é o sistema de design (cores, tipografia, espaçamento) aplicado a todas as telas.

**Uso**: referência visual e de layout apenas. Não implementar campos/dados que não existam em `src/server/db/schema.ts`.

## Discrepâncias conhecidas (corrigir na implementação, não copiar do mockup)

- **Cargos**: código tipo `ENG-001` na listagem — não existe campo `codigo` em `Cargo`.
- **Cargos e Vagas**: faixa salarial/remuneração exibida como intervalo (`R$ X - R$ Y`) — `cargos.faixa_salarial` e `vagas.remuneracao_oferecida` são um único `NUMERIC`, não min/max.
- **Vagas (listagem)**: barra de progresso em "Posições" implica preenchidas/total — só existe `posicoes_disponiveis`, sem contagem de preenchidas.
- **Candidatos (listagem)**: badge de origem "IA" — enum `origem` só tem `email | manual | indicacao`.
- **Triagens (kanban)**: tags "Novo", "Agendado", "Revisão" nos cards — não existem no enum `resultado` (`em_andamento | aprovado | reprovado | desistente | banco_talentos`).
- **Triagens (detalhes)**: stepper com ordem/labels diferentes do enum `etapa` (`curriculo → testes → entrevista_rh → entrevista_gestor → finalizado`); "Oferta" não é sinônimo de `finalizado`.
- **Dashboard**: gráfico "Triagens por Resultado" omite `desistente` (5º valor do enum).
