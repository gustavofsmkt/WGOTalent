import "server-only";
import mammoth from "mammoth";
import { storage } from "~/lib/storage";

/**
 * Como o currículo deve ser exibido na página de visualização. PDF e imagem o
 * browser renderiza nativamente a partir da rota de arquivos; DOCX é convertido
 * aqui; o resto cai na transcrição do agente de extração (ADR-0001).
 */
export type PreviewCurriculo =
  | { tipo: "pdf"; url: string }
  | { tipo: "imagem"; url: string }
  | { tipo: "html"; documento: string }
  | { tipo: "texto"; texto: string }
  | { tipo: "indisponivel" };

const EXTENSOES_IMAGEM = new Set(["png", "jpg", "jpeg"]);

export function extensaoDoArquivo(arquivoKey: string): string {
  return arquivoKey.includes(".")
    ? (arquivoKey.split(".").pop()?.toLowerCase() ?? "")
    : "";
}

interface UrlArquivoOpcoes {
  /** Força `Content-Disposition: attachment` na rota de arquivos. */
  download?: boolean;
  /** Nome sugerido no download; a rota acrescenta a extensão se faltar. */
  filename?: string;
}

export function urlArquivoCurriculo(
  arquivoKey: string,
  opcoes: UrlArquivoOpcoes = {},
): string {
  const caminho = arquivoKey.split("/").map(encodeURIComponent).join("/");
  const params = new URLSearchParams();
  if (opcoes.filename) params.set("filename", opcoes.filename);
  if (opcoes.download) params.set("download", "true");

  const query = params.toString();
  return `/api/files/${caminho}${query ? `?${query}` : ""}`;
}

/**
 * Documento completo entregue ao iframe do preview. O iframe roda com
 * `sandbox=""` (sem scripts e sem same-origin), então o HTML do mammoth não
 * precisa passar por um sanitizador. O documento é renderizado sempre em papel
 * branco, como um PDF no visualizador do browser, e não segue o tema da app.
 */
function montarDocumentoHtml(corpo: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { color-scheme: light; }
  body {
    margin: 0;
    padding: 2.5rem 3rem;
    background: #ffffff;
    color: #18181b;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 15px;
    line-height: 1.65;
    overflow-wrap: break-word;
  }
  h1, h2, h3, h4 { line-height: 1.3; margin: 1.4em 0 0.5em; }
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.25rem; }
  h3 { font-size: 1.1rem; }
  p { margin: 0 0 0.75em; }
  ul, ol { margin: 0 0 0.75em; padding-left: 1.5rem; }
  img { max-width: 100%; height: auto; }
  a { color: #1d4ed8; }
  table { border-collapse: collapse; width: 100%; margin: 0 0 1em; }
  td, th { border: 1px solid #d4d4d8; padding: 0.35rem 0.6rem; text-align: left; }
</style>
</head>
<body>${corpo}</body>
</html>`;
}

/**
 * Resolve a forma de exibir o currículo a partir da key de storage. Nunca lança:
 * qualquer falha de leitura ou conversão degrada para a transcrição de texto e,
 * na ausência dela, para o estado indisponível (com download ainda oferecido).
 */
export async function carregarPreviewCurriculo(
  arquivoKey: string,
  textoExtraido?: string | null,
): Promise<PreviewCurriculo> {
  const extensao = extensaoDoArquivo(arquivoKey);
  const url = urlArquivoCurriculo(arquivoKey);

  if (extensao === "pdf") {
    return { tipo: "pdf", url };
  }

  if (EXTENSOES_IMAGEM.has(extensao)) {
    return { tipo: "imagem", url };
  }

  if (extensao === "docx") {
    try {
      const buffer = await storage.read(arquivoKey);
      const { value } = await mammoth.convertToHtml({ buffer });

      if (value.trim()) {
        return { tipo: "html", documento: montarDocumentoHtml(value) };
      }
    } catch (error) {
      console.error(
        "[Currículo] Falha ao converter DOCX para visualização:",
        error,
      );
    }
  }

  if (textoExtraido?.trim()) {
    return { tipo: "texto", texto: textoExtraido };
  }

  return { tipo: "indisponivel" };
}
