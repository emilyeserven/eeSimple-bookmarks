// @vitest-environment node
import { describe, expect, it } from "vitest";

import { BORDERLESS_TILE_URL, cartoBorderlessTileUrl } from "./basemapTiles";

describe("cartoBorderlessTileUrl", () => {
  it("returns the bare template when no key is configured", () => {
    expect(cartoBorderlessTileUrl(null)).toBe(BORDERLESS_TILE_URL);
    expect(cartoBorderlessTileUrl(undefined)).toBe(BORDERLESS_TILE_URL);
  });

  it("treats a blank key as unconfigured", () => {
    expect(cartoBorderlessTileUrl("   ")).toBe(BORDERLESS_TILE_URL);
  });

  it("appends the key as CARTO's ?key= parameter, trimmed", () => {
    expect(cartoBorderlessTileUrl(" abc123 ")).toBe(`${BORDERLESS_TILE_URL}?key=abc123`);
  });

  it("URL-encodes a key containing reserved characters", () => {
    expect(cartoBorderlessTileUrl("a+b/c=")).toBe(`${BORDERLESS_TILE_URL}?key=a%2Bb%2Fc%3D`);
  });

  it("leaves Leaflet's own placeholders intact so the retina/subdomain substitutions still fire", () => {
    const url = cartoBorderlessTileUrl("abc123");
    for (const placeholder of ["{s}", "{z}", "{x}", "{y}", "{r}"]) {
      expect(url).toContain(placeholder);
    }
  });
});
