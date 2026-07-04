// @vitest-environment node
import { createInstance } from "i18next";
import { describe, expect, it } from "vitest";

import { I18N_OPTIONS } from "./i18n";

/**
 * Proves the `ja` rendering path without committing any Japanese to `ja.json`: a throwaway in-memory
 * instance (built from the app's real i18next options) registers a one-off `ja` resource, switches
 * to it, and asserts the translated output — then switches back to `en` to confirm the key-as-source
 * fallback. The real app instance and `ja.json` are untouched.
 */
describe("i18n ja rendering path", () => {
  it("renders the ja translation when the locale is switched, and the English key otherwise", async () => {
    const i18n = createInstance();
    await i18n.init({
      ...I18N_OPTIONS,
      resources: {
        ja: {
          translation: {
            "Save changes": "変更を保存",
          },
        },
      },
    });

    // Default locale ("en"): no resource, so the English-phrase key renders verbatim.
    expect(i18n.t("Save changes")).toBe("Save changes");

    await i18n.changeLanguage("ja");
    expect(i18n.t("Save changes")).toBe("変更を保存");
    // A key with no ja entry falls through to the English source phrase.
    expect(i18n.t("Delete")).toBe("Delete");

    await i18n.changeLanguage("en");
    expect(i18n.t("Save changes")).toBe("Save changes");
  });

  it("interpolates values with the i18next {{var}} syntax", async () => {
    const i18n = createInstance();
    await i18n.init({
      ...I18N_OPTIONS,
      resources: {
        ja: {
          translation: {
            "Updated {{label}}": "{{label}}を更新しました",
          },
        },
      },
    });

    expect(i18n.t("Updated {{label}}", {
      label: "Title",
    })).toBe("Updated Title");

    await i18n.changeLanguage("ja");
    expect(i18n.t("Updated {{label}}", {
      label: "Title",
    })).toBe("Titleを更新しました");
  });
});
