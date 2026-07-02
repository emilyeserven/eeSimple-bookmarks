// @vitest-environment node
import { describe, expect, it } from "vitest";

import { normalizeRules, normalizeShortLinks } from "./websiteForm";

describe("normalizeShortLinks", () => {
  it("lower-cases, strips a leading www., and trims the domain", () => {
    expect(normalizeShortLinks([{
      domain: "  WWW.Youtu.BE ",
      expandTo: null,
      keepShortened: false,
    }])).toEqual([{
      domain: "youtu.be",
      expandTo: null,
      keepShortened: false,
    }]);
  });

  it("trims expandTo and coerces a blank one to null", () => {
    expect(normalizeShortLinks([
      {
        domain: "a.co",
        expandTo: "  https://example.com  ",
        keepShortened: true,
      },
      {
        domain: "b.co",
        expandTo: "   ",
        keepShortened: false,
      },
    ])).toEqual([
      {
        domain: "a.co",
        expandTo: "https://example.com",
        keepShortened: true,
      },
      {
        domain: "b.co",
        expandTo: null,
        keepShortened: false,
      },
    ]);
  });

  it("drops rows whose domain is empty after normalizing", () => {
    expect(normalizeShortLinks([
      {
        domain: "  www. ",
        expandTo: null,
        keepShortened: false,
      },
      {
        domain: "keep.me",
        expandTo: null,
        keepShortened: false,
      },
    ])).toEqual([{
      domain: "keep.me",
      expandTo: null,
      keepShortened: false,
    }]);
  });
});

describe("normalizeRules", () => {
  it("trims the path suffix and splits/trims/filters the params", () => {
    expect(normalizeRules([{
      pathSuffix: "  /watch ",
      paramsText: " v , , t ",
    }])).toEqual([{
      pathSuffix: "/watch",
      params: ["v", "t"],
    }]);
  });

  it("keeps a rule that has only params (empty path suffix)", () => {
    expect(normalizeRules([{
      pathSuffix: "  ",
      paramsText: "id",
    }])).toEqual([{
      pathSuffix: "",
      params: ["id"],
    }]);
  });

  it("drops a fully-empty row", () => {
    expect(normalizeRules([
      {
        pathSuffix: "   ",
        paramsText: " , ",
      },
      {
        pathSuffix: "/keep",
        paramsText: "",
      },
    ])).toEqual([{
      pathSuffix: "/keep",
      params: [],
    }]);
  });
});
