import { describe, expect, it } from "vitest";

import { parseSharedInput } from "./shareTarget";

describe("parseSharedInput", () => {
  it("keeps an explicit url and title (the Chrome share shape)", () => {
    expect(parseSharedInput({
      url: "https://example.com",
      title: "Example",
    })).toEqual({
      url: "https://example.com",
      title: "Example",
    });
  });

  it("extracts a url embedded in shared text", () => {
    expect(parseSharedInput({
      text: "Check this out https://example.com/post",
    })).toEqual({
      url: "https://example.com/post",
      title: "Check this out",
    });
  });

  it("prefers the explicit url over one inside text", () => {
    expect(parseSharedInput({
      url: "https://a.com",
      text: "https://b.com",
    })).toEqual({
      url: "https://a.com",
      title: undefined,
    });
  });

  it("uses the title even when the url comes from text", () => {
    expect(parseSharedInput({
      title: "My title",
      text: "https://example.com",
    })).toEqual({
      url: "https://example.com",
      title: "My title",
    });
  });

  it("treats whitespace-only fields as absent", () => {
    expect(parseSharedInput({
      url: "  ",
      title: "  ",
      text: "  ",
    })).toEqual({
      url: undefined,
      title: undefined,
    });
  });

  it("returns no url when text has none", () => {
    expect(parseSharedInput({
      text: "just a note",
    })).toEqual({
      url: undefined,
      title: "just a note",
    });
  });
});
