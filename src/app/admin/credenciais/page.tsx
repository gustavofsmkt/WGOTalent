import { PageHeader } from "~/components/page-header";
import { Card, CardContent } from "~/components/ui/card";
import { llmCredencialRepository } from "~/server/db/repositories/llm-credencial";
import { CreateCredencialForm } from "./_components/create-credencial-form";
import { DeactivateCredencialButton } from "./_components/deactivate-credencial-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Credenciais LLM | Admin | WGOTalent",
};

export default async function CredenciaisPage() {
  const credenciais = await llmCredencialRepository.findAll();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-8">
      <PageHeader
        title="Credenciais de Provedor LLM"
        description="A chave nunca é reexibida após salva — apenas provedor, status e data."
      />

      <div className="space-y-3">
        {credenciais.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma credencial cadastrada.</p>
        ) : (
          credenciais.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{c.provider}</div>
                  <div className="text-sm text-muted-foreground">
                    {c.ativo ? "ativa" : "inativa"} · cadastrada em{" "}
                    {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                {c.ativo && <DeactivateCredencialButton credencialId={c.id} />}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="flex justify-center">
        <CreateCredencialForm />
      </div>
    </div>
  );
}
