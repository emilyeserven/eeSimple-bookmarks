// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";

import { translateErrorCode } from "./errorMessages";

describe("translateErrorCode", () => {
  afterEach(async () => {
    // Never leak a locale switch into other tests.
    await i18n.changeLanguage("en");
  });

  it("returns the English phrase (key = source) for a mapped code at en", () => {
    expect(translateErrorCode("notFound", {
      entity: "Bookmark",
    })).toBe("Bookmark not found");
    expect(translateErrorCode("builtInImmutable")).toBe("Built-in items can't be modified or deleted");
  });

  it("interpolates params", () => {
    expect(translateErrorCode("duplicateName", {
      entity: "media type",
      name: "X",
    })).toBe(
      "A media type named \"X\" already exists",
    );
  });

  it("returns undefined for an unmapped code so the caller keeps the raw English message", () => {
    expect(translateErrorCode("validation")).toBeUndefined();
    expect(translateErrorCode("schemaValidation")).toBeUndefined();
    expect(translateErrorCode("internal")).toBeUndefined();
  });

  it("renders a ja translation when the locale is switched (no ja.json commit)", async () => {
    // Add an in-memory ja bundle to the shared app instance for this assertion only.
    i18n.addResourceBundle("ja", "translation", {
      "Image is too large": "画像が大きすぎます",
    }, true, true);
    await i18n.changeLanguage("ja");
    expect(translateErrorCode("imageTooLarge")).toBe("画像が大きすぎます");
    // A code whose phrase has no ja entry falls through to the English source.
    expect(translateErrorCode("noFileUploaded")).toBe("No file uploaded");
  });
});
