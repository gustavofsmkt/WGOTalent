import Link from "next/link";
import { PageHeader } from "~/components/page-header";
import { Card, CardContent } from "~/components/ui/card";
import { buttonVariants } from "~/components/ui/button";
import { agenteConfigRepository } from "~/server/db/repositories/agente-config";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agentes IA | Admin | WGOTalent",
};

export default async function AgentesPage() {
  const agentes = await agenteConfigRepository.findAll();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <PageHeader
        title="Motor de Agentes IA"
        description="Configuração de provedor, modelo e prompts dos 3 slots fixos (ADR-0007)."
      />

      <div className="space-y-3">
        {agentes.map((agente) => (
          <Card key={agente.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{agente.slot}</div>
                <div className="text-sm text-muted-foreground">
                  {agente.provider} · {agente.model} ·{" "}
                  {agente.ativo ? "ativo" : "inativo"}
                </div>
              </div>
              <Link
                href={`/admin/agentes/${agente.slot}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Editar
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
