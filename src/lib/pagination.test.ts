import { describe, expect, it } from "vitest";
import {
  buildPageHref,
  buildPaginationHref,
  getPaginationItems,
  getPaginationOffset,
  getTotalPages,
  parsePage,
} from "./pagination";

describe("pagination", () => {
  it.each([undefined, "", "0", "-2", "1.5", "invalid"])(
    "normalizes %p to the first page",
    (value) => {
      expect(parsePage(value)).toBe(1);
    },
  );

  it("parses a positive integer page", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage(["4", "5"])).toBe(4);
  });

  it("calculates offsets and total pages", () => {
    expect(getPaginationOffset({ page: 3, pageSize: 10 })).toBe(20);
    expect(getTotalPages(0, 10)).toBe(1);
    expect(getTotalPages(21, 10)).toBe(3);
  });

  it("shows every page for compact result sets", () => {
    expect(getPaginationItems(3, 6)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("keeps adjacent pages visible in the middle of a large result set", () => {
    expect(getPaginationItems(6, 12)).toEqual([
      1,
      "ellipsis-start",
      5,
      6,
      7,
      "ellipsis-end",
      12,
    ]);
  });

  it("uses stable windows near the beginning and end", () => {
    expect(getPaginationItems(3, 12)).toEqual([
      1,
      2,
      3,
      4,
      5,
      "ellipsis-end",
      12,
    ]);
    expect(getPaginationItems(11, 12)).toEqual([
      1,
      "ellipsis-start",
      8,
      9,
      10,
      11,
      12,
    ]);
  });

  it("preserves filters and omits the canonical first page", () => {
    expect(
      buildPageHref({
        pathname: "/candidatos",
        searchParams: { q: "ana", origem: "email", page: "4" },
        page: 1,
      }),
    ).toBe("/candidatos?q=ana&origem=email");
  });

  it("supports independent page parameters and anchored sections", () => {
    expect(
      buildPageHref({
        pathname: "/dashboard",
        searchParams: { topVagasPage: "2", activityPage: "3" },
        page: 4,
        pageParam: "topVagasPage",
        hash: "vagas-com-mais-candidatos",
      }),
    ).toBe(
      "/dashboard?activityPage=3&topVagasPage=4#vagas-com-mais-candidatos",
    );
  });

  it("updates multiple page parameters atomically", () => {
    expect(
      buildPaginationHref({
        pathname: "/dashboard",
        searchParams: {
          topVagasPage: "999",
          activityPage: "999",
          view: "operacional",
        },
        pages: { topVagasPage: 2, activityPage: 1 },
        hash: "vagas-com-mais-candidatos",
      }),
    ).toBe(
      "/dashboard?view=operacional&topVagasPage=2#vagas-com-mais-candidatos",
    );
  });

  it.each([
    {
      pages: { topVagasPage: 2, activityPage: 3 },
      expected: "/dashboard?topVagasPage=2&activityPage=3",
    },
    {
      pages: { topVagasPage: 1, activityPage: 4 },
      expected: "/dashboard?activityPage=4",
    },
  ])("canonicalizes independent dashboard pages", ({ pages, expected }) => {
    expect(
      buildPaginationHref({
        pathname: "/dashboard",
        searchParams: { topVagasPage: "999", activityPage: "999" },
        pages,
      }),
    ).toBe(expected);
  });
});
