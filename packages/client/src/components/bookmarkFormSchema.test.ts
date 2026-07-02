// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  bookmarkInputHint,
  buildBookmarkDefaultValues,
  detectBookmarkInputType,
  normalizeIsbn,
} from "./bookmarkFormSchema";
import { makeBookmark } from "../test-utils/factories";

describe("buildBookmarkDefaultValues", () => {
  it("seeds url/title from initial values in create mode", () => {
    const values = buildBookmarkDefaultValues(undefined, undefined, {
      url: "https://example.com",
      title: "Example",
    });
    expect(values.url).toBe("https://example.com");
    expect(values.title).toBe("Example");
  });

  it("defaults to empty strings when no initial values are given", () => {
    const values = buildBookmarkDefaultValues(undefined, undefined);
    expect(values.url).toBe("");
    expect(values.title).toBe("");
  });

  it("ignores initial values in edit mode (existing bookmark wins)", () => {
    const bookmark = makeBookmark({
      url: "https://saved.example.com",
      originalUrl: null,
      title: "Saved title",
    });
    const values = buildBookmarkDefaultValues(bookmark, undefined, {
      url: "https://other.example.com",
      title: "Other",
    });
    expect(values.url).toBe("https://saved.example.com");
    expect(values.title).toBe("Saved title");
  });
});

describe("normalizeIsbn", () => {
  it("accepts a 13-digit ISBN without dashes", () => {
    expect(normalizeIsbn("9780134685991")).toBe("9780134685991");
  });

  it("accepts a 13-digit ISBN with dashes/spaces and strips them", () => {
    expect(normalizeIsbn("978-0-13-468599-1")).toBe("9780134685991");
    expect(normalizeIsbn("978 0 13 468599 1")).toBe("9780134685991");
  });

  it("accepts a 10-digit ISBN, including a trailing X", () => {
    expect(normalizeIsbn("0-306-40615-2")).toBe("0306406152");
    expect(normalizeIsbn("097522980x")).toBe("097522980X");
  });

  it("rejects non-ISBN values", () => {
    expect(normalizeIsbn("hello world")).toBeNull();
    expect(normalizeIsbn("12345")).toBeNull();
    expect(normalizeIsbn("https://example.com")).toBeNull();
    expect(normalizeIsbn("")).toBeNull();
  });
});

describe("detectBookmarkInputType", () => {
  it("classifies fetchable URLs as url (including empty as the neutral default)", () => {
    expect(detectBookmarkInputType("https://example.com/book")).toBe("url");
    expect(detectBookmarkInputType("")).toBe("url");
    expect(detectBookmarkInputType("   ")).toBe("url");
  });

  it("classifies ISBN-10 and ISBN-13 (dashed or not) as isbn", () => {
    expect(detectBookmarkInputType("9780134685991")).toBe("isbn");
    expect(detectBookmarkInputType("978-0-13-468599-1")).toBe("isbn");
    expect(detectBookmarkInputType("0-306-40615-2")).toBe("isbn");
  });

  it("classifies anything else as plain text", () => {
    expect(detectBookmarkInputType("The Pragmatic Programmer")).toBe("text");
    expect(detectBookmarkInputType("a quick note")).toBe("text");
  });
});

describe("bookmarkInputHint", () => {
  it("returns null for an empty input", () => {
    expect(bookmarkInputHint("")).toBeNull();
    expect(bookmarkInputHint("   ")).toBeNull();
  });

  it("labels each detected type, distinguishing ISBN-10 vs ISBN-13", () => {
    expect(bookmarkInputHint("https://example.com")).toBe("Web link");
    expect(bookmarkInputHint("9780134685991")).toBe("ISBN-13");
    expect(bookmarkInputHint("0-306-40615-2")).toBe("ISBN-10");
    expect(bookmarkInputHint("just some text")).toBe("Text — saved as the name");
  });
});
