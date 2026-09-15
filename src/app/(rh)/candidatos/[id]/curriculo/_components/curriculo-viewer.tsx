import { FileWarning } from "lucide-react";
import type { PreviewCurriculo } from "~/server/candidatos/preview-curriculo";

interface CurriculoViewerProps {
  preview: PreviewCurriculo;
  /** Usado no título acessível do quadro de visualização. */
  candidatoNome: string;
}

const MOLDURA_CSS =
  "h-[calc(100vh-12rem)] min-h-[32rem] w-full overflow-hidden rounded-lg border border-border bg-muted/30";

export function CurriculoViewer({
  preview,
  candidatoNome,
}: CurriculoViewerProps) {
  const titulo = `Currículo de ${candidatoNome}`;

  if (preview.tipo === "pdf") {
    return <iframe src={preview.url} title={titulo} className={MOLDURA_CSS} />;
  }

  if (preview.tipo === "imagem") {
    return (
      <div className={`${MOLDURA_CSS} flex items-center justify-center p-4`}>
        <img
          src={preview.url}
          alt={titulo}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }

  if (preview.tipo === "html") {
    return (
      <>
        <p className="text-xs text-muted-foreground">
          Este formato não é exibido pelo navegador. Abaixo está a uma versão
          convertida {"DOCX -> HTML"} — baixe o arquivo para ver o original.
        </p>
        <iframe
          srcDoc={preview.documento}
          title={titulo}
          // Sem scripts e sem same-origin: o HTML convertido do DOCX fica isolado.
          sandbox=""
          className={`${MOLDURA_CSS} bg-white`}
        />
      </>
    );
  }

  if (preview.tipo === "texto") {
    return (
      <div className={`${MOLDURA_CSS} overflow-y-auto bg-background p-6`}>
        <p className="mb-4 text-xs text-muted-foreground">
          Este formato não é exibido pelo navegador. Abaixo está a transcrição
          feita pela IA — baixe o arquivo para ver o original.
        </p>
        <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap text-foreground">
          {preview.texto}
        </pre>
      </div>
    );
  }

  return (
    <div
      className={`${MOLDURA_CSS} flex flex-col items-center justify-center gap-2 text-center`}
    >
      <FileWarning className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">
        Não é possível visualizar este arquivo
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">
        O formato não é suportado pelo navegador e não há transcrição
        disponível. Baixe o arquivo para abri-lo localmente.
      </p>
    </div>
  );
}
