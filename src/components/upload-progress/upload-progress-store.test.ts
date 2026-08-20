import { describe, it, expect } from "vitest";
import { temItemEmAndamento, temErroPendente } from "./upload-progress-status";
import type { UploadLoteItem } from "~/server/db/schema";

function item(overrides: Partial<UploadLoteItem>): UploadLoteItem {
  return {
    id: "1",
    fileName: "curriculo.pdf",
    status: "pendente",
    mensagem: null,
    candidatoId: null,
    errorType: null,
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
    ...overrides,
  } as UploadLoteItem;
}

describe("temItemEmAndamento", () => {
  it("returns true when there is a 'pendente' item", () => {
    expect(temItemEmAndamento([item({ status: "pendente" })])).toBe(true);
  });

  it("returns true when there is a 'processando' item", () => {
    expect(temItemEmAndamento([item({ status: "processando" })])).toBe(true);
  });

  it("returns false when every item already finished (sucesso/erro)", () => {
    expect(
      temItemEmAndamento([item({ status: "sucesso" }), item({ status: "erro" })]),
    ).toBe(false);
  });

  it("returns false for an empty list", () => {
    expect(temItemEmAndamento([])).toBe(false);
  });
});

describe("temErroPendente", () => {
  it("returns true when there is at least one 'erro' item", () => {
    expect(
      temErroPendente([item({ status: "sucesso" }), item({ status: "erro" })]),
    ).toBe(true);
  });

  it("returns false when there is no 'erro' item", () => {
    expect(
      temErroPendente([item({ status: "sucesso" }), item({ status: "processando" })]),
    ).toBe(false);
  });

  it("returns false for an empty list", () => {
    expect(temErroPendente([])).toBe(false);
  });
});
