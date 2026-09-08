interface CurriculoDownloadInput {
  id: string;
  status: "processando" | "sucesso" | "falha";
  fluxo: string;
  arquivoKey: string | null;
}

export function getCurriculoDownloadUrl(
  processamento: CurriculoDownloadInput,
): string | null {
  if (
    processamento.status !== "falha" ||
    processamento.fluxo !== "ingestao_curriculo" ||
    !processamento.arquivoKey
  ) {
    return null;
  }

  const encodedKey = processamento.arquivoKey
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  const filename = encodeURIComponent(
    `curriculo-processamento-${processamento.id}`,
  );

  return `/api/files/${encodedKey}?filename=${filename}&download=true`;
}
