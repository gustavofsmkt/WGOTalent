import { describe, it, expect } from "vitest";
import { getWhatsAppUrl } from "./whatsapp";

describe("getWhatsAppUrl", () => {
  it("should prefix 55 to number with DDD and number only", () => {
    expect(getWhatsAppUrl("11987654321")).toBe("https://wa.me/5511987654321");
  });

  it("should return as is if already has 55 prefix", () => {
    expect(getWhatsAppUrl("5511987654321")).toBe("https://wa.me/5511987654321");
  });

  it("should handle formatting characters", () => {
    expect(getWhatsAppUrl("(11) 98765-4321")).toBe(
      "https://wa.me/5511987654321",
    );
    expect(getWhatsAppUrl("+55 (11) 98765-4321")).toBe(
      "https://wa.me/5511987654321",
    );
    expect(getWhatsAppUrl("11 98765 4321")).toBe("https://wa.me/5511987654321");
  });

  it("should prefix 55 for area code 55 (Rio Grande do Sul)", () => {
    // Area code 55: (55) 98765-4321
    expect(getWhatsAppUrl("55987654321")).toBe("https://wa.me/5555987654321");
  });

  it("should handle empty or null input gracefully", () => {
    expect(getWhatsAppUrl("")).toBe("");
    expect(getWhatsAppUrl(null)).toBe("");
    expect(getWhatsAppUrl(undefined)).toBe("");
  });
});
