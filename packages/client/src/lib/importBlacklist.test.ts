// @vitest-environment node
import { describe, expect, it } from "vitest";

import { entryFromInput } from "./importBlacklist";

describe("entryFromInput", () => {
  it("prepends https:// to a bare host before deriving patterns", () => {
    expect(entryFromInput("domain", "example.com")).toEqual({
      kind: "domain",
      value: "example.com",
    });
  });

  it("leaves an input that already has a scheme alone", () => {
    expect(entryFromInput("domain", "http://example.com/foo")).toEqual({
      kind: "domain",
      value: "example.com",
    });
  });

  it("returns the domain entry, stripping leading www. and lower-casing", () => {
    expect(entryFromInput("domain", "www.Example.COM/Foo/")).toEqual({
      kind: "domain",
      value: "example.com",
    });
  });

  it("returns the exact entry as host + path, trailing slash trimmed", () => {
    expect(entryFromInput("exact", "example.com/Foo/Bar/")).toEqual({
      kind: "exact",
      value: "example.com/foo/bar",
    });
  });

  it("returns the path-prefix entry as host + path", () => {
    expect(entryFromInput("path-prefix", "example.com/foo/")).toEqual({
      kind: "path-prefix",
      value: "example.com/foo",
    });
  });

  it("trims surrounding whitespace before use", () => {
    expect(entryFromInput("domain", "  example.com  ")).toEqual({
      kind: "domain",
      value: "example.com",
    });
  });

  it("falls back to the lower-cased trimmed raw value when the URL can't be parsed", () => {
    expect(entryFromInput("domain", "   ")).toEqual({
      kind: "domain",
      value: "",
    });
  });
});
