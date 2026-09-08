import { describe, expect, it } from "vitest";
import { getCurriculoDownloadUrl } from "./curriculo-download";

const failedIngestion = {
  id: "processamento-1",
  status: "falha" as const,
  fluxo: "ingestao_curriculo",
  arquivoKey: "curriculos/Currículo Caio.pdf",
};

describe("getCurriculoDownloadUrl", () => {
  it("builds an attachment URL for a failed ingestion with a retained resume", () => {
    expect(getCurriculoDownloadUrl(failedIngestion)).toBe(
      "/api/files/curriculos/Curr%C3%ADculo%20Caio.pdf?filename=curriculo-processamento-processamento-1&download=true",
    );
  });

  it.each([
    { ...failedIngestion, status: "sucesso" as const },
    { ...failedIngestion, fluxo: "vaga_candidatos" },
    { ...failedIngestion, arquivoKey: null },
  ])("does not offer the resume outside eligible failures", (input) => {
    expect(getCurriculoDownloadUrl(input)).toBeNull();
  });
});
