const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function resolveTemplate(
  template: string,
  variaveis: Record<string, unknown>,
): string {
  return template.replace(VARIABLE_PATTERN, (match, key: string) => {
    if (!(key in variaveis)) {
      throw new Error(
        `Variável "{{${key}}}" referenciada no template mas ausente do catálogo fornecido.`,
      );
    }
    const value = variaveis[key];
    return typeof value === "string" ? value : JSON.stringify(value);
  });
}
