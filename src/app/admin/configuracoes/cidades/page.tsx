import { PageHeader } from "~/components/page-header";
import { BackButton } from "~/components/back-button";
import { Card, CardContent } from "~/components/ui/card";
import { cidadeRepository } from "~/server/db/repositories/cidade";
import { CreateCidadeForm } from "../_components/create-cidade-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cidades | Administração | WGOTalent",
};

export default async function CidadesPage() {
  const cidades = await cidadeRepository.findAll();

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/admin">Voltar</BackButton>
      </div>

      <PageHeader
        title="Cidades"
        description="Gerencie as cidades disponíveis para seleção no cadastro de vagas."
      />

      <div className="space-y-2">
        {cidades.length === 0 ? (
          <p className="text-sm text-muted-foreground ml-4">
            Nenhuma cidade cadastrada.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cidades
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((c) => (
                <span className="border p-2 bg-card rounded-md" key={c.id}>
                  {c.nome} — {c.uf}
                </span>
              ))}
          </div>
        )}
      </div>

      <CreateCidadeForm />
    </div>
  );
}
