import { notFound } from "next/navigation";
import { PageHeader } from "~/components/page-header";
import { AgenteConfigForm } from "~/components/agente-config-form";
import { agenteConfigRepository } from "~/server/db/repositories/agente-config";
import { llmCredencialRepository } from "~/server/db/repositories/llm-credencial";
import type { AgenteConfig } from "~/server/db/schema";

export const dynamic = "force-dynamic";

const SLOTS_VALIDOS: AgenteConfig["slot"][] = [
  "extracao_curriculo",
  "classificador_aderencia",
  "avaliador_triagem",
];

interface EditAgentePageProps {
  params: Promise<{ slot: string }>;
}

export default async function EditAgentePage(props: EditAgentePageProps) {
  const { slot } = await props.params;

  if (!SLOTS_VALIDOS.includes(slot as AgenteConfig["slot"])) {
    notFound();
  }

  const [agenteConfig, credenciais] = await Promise.all([
    agenteConfigRepository.findBySlot(slot as AgenteConfig["slot"]),
    llmCredencialRepository.findAll(),
  ]);

  if (!agenteConfig) {
    notFound();
  }

  const credenciaisOptions = credenciais
    .filter((c) => c.ativo || c.id === agenteConfig.credencialId)
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      provider: c.provider,
      ativo: c.ativo,
    }));

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-4xl mx-auto w-full space-y-4">
      <PageHeader
        title={`Editar Agente: ${agenteConfig.slot}`}
        description="Prompt e modelo deste slot fixo."
      />
      <AgenteConfigForm
        agenteConfig={agenteConfig}
        credenciais={credenciaisOptions}
      />
    </div>
  );
}
