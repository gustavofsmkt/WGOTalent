import { describe, it, expect } from "vitest";
import {
  departamentoSchema,
  createDepartamentoSchema,
  updateDepartamentoSchema,
  type CreateDepartamentoInput,
} from "~/lib/validation/departamento";

describe("DepartamentoForm - Validation Integration", () => {
  it("validates valid department input according to shared schema", () => {
    const input: CreateDepartamentoInput = {
      nome: "Engenharia de Software",
      descricao: "Equipe responsável pelo desenvolvimento de sistemas.",
    };

    const result = departamentoSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nome).toBe("Engenharia de Software");
      expect(result.data.descricao).toBe(
        "Equipe responsável pelo desenvolvimento de sistemas.",
      );
    }
  });

  it("validates onBlur field schema for 'nome'", () => {
    const nomeSchema = departamentoSchema.shape.nome;

    const validNome = nomeSchema.safeParse("Recursos Humanos");
    expect(validNome.success).toBe(true);

    const emptyNome = nomeSchema.safeParse("");
    expect(emptyNome.success).toBe(false);

    const whitespaceNome = nomeSchema.safeParse("   ");
    expect(whitespaceNome.success).toBe(false);

    const longNome = nomeSchema.safeParse("a".repeat(121));
    expect(longNome.success).toBe(false);
  });

  it("validates onBlur field schema for 'descricao'", () => {
    const descricaoSchema = departamentoSchema.shape.descricao;

    const validDescricao = descricaoSchema.safeParse(
      "Descrição do departamento",
    );
    expect(validDescricao.success).toBe(true);

    const emptyDescricao = descricaoSchema.safeParse("");
    expect(emptyDescricao.success).toBe(false);

    const whitespaceDescricao = descricaoSchema.safeParse("   ");
    expect(whitespaceDescricao.success).toBe(false);
  });

  it("ensures createDepartamentoSchema and updateDepartamentoSchema share the exact same base definition without duplication", () => {
    expect(createDepartamentoSchema).toBe(departamentoSchema);

    const updatePartial = updateDepartamentoSchema.safeParse({
      nome: "Novo Nome",
    });
    expect(updatePartial.success).toBe(true);
  });
});
