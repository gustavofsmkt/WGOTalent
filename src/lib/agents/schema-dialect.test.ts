import { describe, expect, it } from "vitest";
import { assertRaizObjeto, objetoComLista } from "./schema-dialect";

describe("objetoComLista", () => {
  it("wraps an item schema into an object with a single array property", () => {
    const item = {
      type: "object",
      properties: { id: { type: "string" }, score: { type: "number" } },
      required: ["id", "score"],
      additionalProperties: false,
    };

    expect(objetoComLista("itens", item)).toEqual({
      type: "object",
      properties: { itens: { type: "array", items: item } },
      required: ["itens"],
      additionalProperties: false,
    });
  });

  it("produces a schema that passes assertRaizObjeto", () => {
    const schema = objetoComLista("linhas", { type: "string" });
    expect(() => assertRaizObjeto(schema, "test")).not.toThrow();
  });
});

describe("assertRaizObjeto", () => {
  it("accepts a root object schema", () => {
    expect(() =>
      assertRaizObjeto({ type: "object", properties: {} }, "test"),
    ).not.toThrow();
  });

  it("rejects a root array schema with an actionable message", () => {
    expect(() =>
      assertRaizObjeto({ type: "array", items: { type: "string" } }, "openai"),
    ).toThrow(/objetoComLista/);
  });

  it("rejects a schema with no type", () => {
    expect(() => assertRaizObjeto({ properties: {} }, "anthropic")).toThrow(
      /"type": "object"/,
    );
  });
});
