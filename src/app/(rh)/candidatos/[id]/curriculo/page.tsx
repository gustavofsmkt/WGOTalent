import { notFound } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import {
  carregarPreviewCurriculo,
  extensaoDoArquivo,
  urlArquivoCurriculo,
} from "~/server/candidatos/preview-curriculo";
import { BackButton } from "~/components/back-button";
import { PageHeader } from "~/components/page-header";
import { buttonVariants } from "~/components/ui/button";
import { CurriculoViewer } from "./_components/curriculo-viewer";

export const dynamic = "force-dynamic";

interface CurriculoPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: CurriculoPageProps) {
  const { id } = await props.params;
  const candidato = await candidatoRepository.findById(id);

  if (!candidato) {
    return { title: "Candidato não encontrado | WGOTalent" };
  }

  return {
    title: `${candidato.nome}`,
    description: `Visualização do currículo de ${candidato.nome}.`,
  };
}

export default async function CurriculoPage(props: CurriculoPageProps) {
  const { id } = await props.params;
  const candidato = await candidatoRepository.findById(id);

  if (!candidato?.curriculoArquivoKey) {
    notFound();
  }

  const arquivoKey = candidato.curriculoArquivoKey;
  const extensao = extensaoDoArquivo(arquivoKey);
  const nomeArquivo = `${candidato.nome}${extensao ? `.${extensao}` : ""}`;

  const preview = await carregarPreviewCurriculo(
    arquivoKey,
    candidato.textoCurriculoExtraido,
  );

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-7xl mx-auto w-full space-y-4">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref={`/candidatos/${candidato.id}`}>
          Voltar
        </BackButton>
      </div>

      <PageHeader
        title="Currículo"
        description={
          <span>
            {candidato.nome}
            {extensao && (
              <span className="text-muted-foreground/70">
                {" · "}
                {extensao.toUpperCase()}
              </span>
            )}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <a
              href={urlArquivoCurriculo(arquivoKey)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <ExternalLink className="size-4 mr-2" />
              Abrir original
            </a>
            <a
              href={urlArquivoCurriculo(arquivoKey, {
                filename: nomeArquivo,
                download: true,
              })}
              download={nomeArquivo}
              className={buttonVariants({ variant: "default" })}
            >
              <Download className="size-4 mr-2" />
              Baixar
            </a>
          </div>
        }
      />

      <CurriculoViewer preview={preview} candidatoNome={candidato.nome} />
    </div>
  );
}
