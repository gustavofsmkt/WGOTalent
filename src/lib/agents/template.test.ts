import { describe, expect, it } from "vitest";
import { resolveTemplate } from "./template";

describe("resolveTemplate", () => {
  it("substitutes a string variable inline", () => {
    expect(resolveTemplate("Olá {{nome}}!", { nome: "Maria" })).toBe(
      "Olá Maria!",
    );
  });

  it("serializes non-string values as JSON", () => {
    const result = resolveTemplate("Itens: {{itens}}", {
      itens: [{ id: "1", score: 90 }],
    });
    expect(result).toBe('Itens: [{"id":"1","score":90}]');
  });

  it("substitutes multiple occurrences of the same variable", () => {
    expect(resolveTemplate("{{x}} e {{x}}", { x: "a" })).toBe("a e a");
  });

  it("throws when a referenced variable is missing from the catalog", () => {
    expect(() => resolveTemplate("{{faltando}}", {})).toThrow(/faltando/);
  });
});
