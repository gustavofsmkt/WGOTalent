import { describe, expect, it } from "vitest";
import { parseSomenteFalhas } from "./processamento-ia-filters";

describe("parseSomenteFalhas", () => {
  it("enables the filter only for the canonical URL value", () => {
    expect(parseSomenteFalhas("1")).toBe(true);
    expect(parseSomenteFalhas(["1", "0"])).toBe(true);
  });

  it.each([undefined, "", "0", "true", ["0", "1"]])(
    "keeps the filter disabled for %j",
    (value) => {
      expect(parseSomenteFalhas(value)).toBe(false);
    },
  );
});
