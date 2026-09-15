import { PageHeader } from "~/components/page-header";
import { BackButton } from "~/components/back-button";
import { UploadLoteForm } from "./_components/upload-lote-form";

export const metadata = {
  title: "Upload em Lote de Currículos | WGOTalent",
};

export default function UploadLotePage() {
  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-3xl mx-auto w-full space-y-4">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/candidatos">Voltar</BackButton>
      </div>

      <PageHeader
        title="Upload em Lote de Currículos"
        description="Envie até 15 currículos de uma vez. Cada arquivo é processado de forma independente pelo motor de agentes IA."
      />

      <UploadLoteForm />
    </div>
  );
}
