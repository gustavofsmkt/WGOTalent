import { PageFilter } from "~/components/page-filter";

const ETAPA_OPTIONS = [
  { value: "todas", label: "Todas as etapas" },
  { value: "curriculo", label: "Currículo" },
  { value: "testes", label: "Testes" },
  { value: "entrevista_rh", label: "Entrevista RH" },
  { value: "entrevista_gestor", label: "Entrevista Gestor" },
  { value: "finalizado", label: "Finalizado" },
];

const RESULTADO_OPTIONS = [
  { value: "todas", label: "Todos os resultados" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "aprovado", label: "Aprovado" },
  { value: "reprovado", label: "Reprovado" },
  { value: "desistente", label: "Desistente" },
  { value: "banco_talentos", label: "Banco de Talentos" },
];

const MOTIVO_OPTIONS = [
  { value: "todos", label: "Todos os motivos" },
  { value: "curriculo", label: "Reprovação: Currículo" },
  { value: "fit_cultural", label: "Reprovação: Fit Cultural" },
  { value: "testes", label: "Reprovação: Testes Técnicos" },
  { value: "rh", label: "Reprovação: Avaliação RH" },
  { value: "gestor", label: "Reprovação: Avaliação Gestor" },
  {
    value: "incompatibilidade_salarial",
    label: "Desistência: Incompatibilidade Salarial",
  },
  { value: "aceitou_outra_proposta", label: "Desistência: Outra Proposta" },
  { value: "nao_atendeu_contato", label: "Desistência: Não Atendeu Contato" },
  { value: "motivos_pessoais", label: "Desistência: Motivos Pessoais" },
];

interface VagaFilterOption {
  id: string;
  cidades: Array<{ nome: string; uf: string }>;
  cargo: { titulo: string };
}

export function TriagemPageFilter({
  vagaOptions,
}: {
  vagaOptions?: VagaFilterOption[];
}) {
  const vagaSelect = vagaOptions
    ? [
        {
          paramKey: "vaga",
          defaultValue: "todas",
          placeholder: "Vaga",
          options: [
            { value: "todas", label: "Todas as vagas" },
            ...vagaOptions.map((vaga) => ({
              value: vaga.id,
              label: `${vaga.cargo.titulo} — ${vaga.cidades.map((cidade) => `${cidade.nome}/${cidade.uf}`).join(", ")}`,
            })),
          ],
        },
      ]
    : [];

  return (
    <PageFilter
      searchPlaceholder="Buscar por candidato, cargo, departamento..."
      searchAriaLabel="Buscar triagem por candidato, cargo ou departamento"
      filterBar={{
        selects: [
          ...vagaSelect,
          {
            paramKey: "etapa",
            defaultValue: "todas",
            placeholder: "Etapa",
            options: ETAPA_OPTIONS,
          },
          {
            paramKey: "resultado",
            defaultValue: "todas",
            placeholder: "Resultado",
            options: RESULTADO_OPTIONS,
          },
          {
            paramKey: "motivo",
            defaultValue: "todos",
            placeholder: "Motivo",
            options: MOTIVO_OPTIONS,
          },
        ],
        numberInputs: [
          {
            paramKey: "scoreMinimo",
            label: "Score IA mínimo",
            placeholder: "0",
            min: 0,
            max: 100,
            step: 1,
            suffix: "%",
          },
        ],
        checkbox: {
          paramKey: "vagaAtiva",
          trueValue: "1",
          falseValue: "0",
          defaultChecked: true,
          label: "Somente ativas",
        },
      }}
    />
  );
}
