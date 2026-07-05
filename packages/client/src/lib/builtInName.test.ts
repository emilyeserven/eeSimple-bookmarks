// @vitest-environment node
import { createInstance } from "i18next";
import { describe, expect, it } from "vitest";

import { I18N_OPTIONS } from "@/i18n";

import { builtInName, languageName } from "./builtInName";

async function makeI18n(ja?: Record<string, string>) {
  const i18n = createInstance();
  await i18n.init({
    ...I18N_OPTIONS,
    ...(ja && {
      resources: {
        ja: {
          translation: ja,
        },
      },
    }),
  });
  return i18n;
}

describe("builtInName", () => {
  it("passes a built-in row's name through t()", async () => {
    const i18n = await makeI18n({
      Video: "動画",
    });
    const row = {
      name: "Video",
      builtIn: true,
    };

    // en: the English-phrase key renders verbatim.
    expect(builtInName(row, i18n.t)).toBe("Video");

    await i18n.changeLanguage("ja");
    expect(builtInName(row, i18n.t)).toBe("動画");
  });

  it("renders a user-created row's name verbatim regardless of locale", async () => {
    const i18n = await makeI18n({
      Video: "動画",
    });
    await i18n.changeLanguage("ja");
    // Even if a user happened to name their type "Video", builtIn:false is never translated.
    expect(builtInName({
      name: "Video",
      builtIn: false,
    }, i18n.t)).toBe("Video");
    expect(builtInName({
      name: "My Custom Type",
    }, i18n.t)).toBe("My Custom Type");
  });
});

describe("languageName", () => {
  it("renders a built-in language via Intl.DisplayNames in the active locale", () => {
    expect(languageName({
      name: "English",
      isoCode: "en",
      builtIn: true,
    }, "en")).toBe("English");
    // Intl renders the English language name in Japanese.
    expect(languageName({
      name: "English",
      isoCode: "en",
      builtIn: true,
    }, "ja")).toBe("英語");
  });

  it("falls back to the stored name for a custom language or one without an ISO code", () => {
    expect(languageName({
      name: "Klingon",
      isoCode: null,
      builtIn: false,
    }, "ja")).toBe("Klingon");
    expect(languageName({
      name: "Elvish",
      isoCode: null,
      builtIn: true,
    }, "ja")).toBe("Elvish");
  });
});
