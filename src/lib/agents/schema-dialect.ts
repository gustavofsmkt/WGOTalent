/**
 * Saída estruturada não é portável entre provedores (ADR-0011): OpenAI
 * (Structured Outputs strict) e Anthropic (tool use com `input_schema`)
 * exigem um JSON Schema com raiz `type: "object"`; só o Gemini aceita raiz
 * `type: "array"`. Para um agente cuja saída lógica é uma lista, declare o
 * schema com `objetoComLista()` e desembrulhe a propriedade no código do
 * agente.
 */

/** Envolve um schema de item de lista em um objeto com uma única propriedade array, compatível com os 3 provedores. */
export function objetoComLista(
  propriedade: string,
  itemSchema: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      [propriedade]: { type: "array", items: itemSchema },
    },
    required: [propriedade],
    additionalProperties: false,
  };
}

/**
 * Falha rápido, com mensagem acionável, quando um schema de raiz não-objeto
 * chega a um provedor que exige raiz objeto — em vez de deixar a API do
 * provedor devolver um HTTP 400 genérico (foi exatamente essa a causa do bug
 * do classificador rodando em OpenAI).
 */
export function assertRaizObjeto(
  schema: Record<string, unknown>,
  contexto: string,
): void {
  if (schema.type !== "object") {
    throw new Error(
      `[${contexto}] Este provedor exige um JSON Schema com raiz "type": "object" ` +
        `(recebido "type": ${JSON.stringify(schema.type)}). ` +
        `Use objetoComLista() de schema-dialect.ts para saídas em lista.`,
    );
  }
}
