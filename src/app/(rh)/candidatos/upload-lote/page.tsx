import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { buttonVariants } from "~/components/ui/button";
import { UploadLoteForm } from "./_components/upload-lote-form";

export const metadata = {
  title: "Upload em Lote de Currículos | WGOTalent",
};

export default function UploadLotePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/candidatos"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-muted-foreground hover:text-foreground",
          })}
        >
          <ArrowLeft className="size-4 mr-1.5" />
          Voltar para Candidatos
        </Link>
      </div>

      <PageHeader
        title="Upload em Lote de Currículos"
        description="Envie até 15 currículos de uma vez. Cada arquivo é processado de forma independente pelo motor de agentes IA."
      />

      <UploadLoteForm />
    </div>
  );
}
