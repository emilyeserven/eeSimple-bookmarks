import { describe, expect, it } from "vitest";

import { kavitaSeriesUrl } from "./kavita";

describe("kavitaSeriesUrl", () => {
  it("builds the web-UI series deep link from the library and series ids", () => {
    expect(kavitaSeriesUrl("http://localhost:5000", 3, 12)).toBe(
      "http://localhost:5000/library/3/series/12",
    );
  });

  it("trims a single trailing slash on the base URL before appending", () => {
    expect(kavitaSeriesUrl("https://kavita.example.com/", 1, 44)).toBe(
      "https://kavita.example.com/library/1/series/44",
    );
  });
});
