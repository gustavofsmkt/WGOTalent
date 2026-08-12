import { describe, expect, it } from "vitest";
import { cn } from "~/lib/utils";

describe("cn utility helper", () => {
  it("merges class names correctly", () => {
    const result = cn("px-2 py-1", "bg-red-500");
    expect(result).toBe("px-2 py-1 bg-red-500");
  });

  it("handles conditional class names", () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn("base-class", isActive && "active-class", isDisabled && "disabled-class");
    expect(result).toBe("base-class active-class");
  });

  it("resolves Tailwind conflicts using tailwind-merge", () => {
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });
});
