import type { Language, LanguageUsageLevel } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { LanguageUsageFilterPill } from "./LanguageUsageFilterPill";
import { makeLanguage, makeLanguageUsageLevel } from "../test-utils/factories";

const languages: Language[] = [
  makeLanguage({
    id: "lang-en",
    name: "English",
    isoCode: "en",
    slug: "english",
  }),
  makeLanguage({
    id: "lang-ja",
    name: "Japanese",
    isoCode: "ja",
    slug: "japanese",
  }),
];

const levels: LanguageUsageLevel[] = [
  makeLanguageUsageLevel({
    id: "level-dub",
    name: "Dub",
    slug: "dub",
    kind: "availability",
  }),
  makeLanguageUsageLevel({
    id: "level-subs",
    name: "Subtitles",
    slug: "subtitles",
    kind: "availability",
  }),
];

const meta = {
  title: "Filters/LanguageUsageFilterPill",
  component: LanguageUsageFilterPill,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/languages", () => HttpResponse.json(languages)),
        http.get("/api/language-usage-levels", () => HttpResponse.json(levels)),
      ],
    },
  },
  args: {
    search: {},
    onSearchChange: () => {},
  },
} satisfies Meta<typeof LanguageUsageFilterPill>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Both vocabularies have options — the pill renders. */
export const Default: Story = {};

/** An active selection in both multi-selects — the pill fills and shows a count. */
export const WithSelection: Story = {
  args: {
    search: {
      languageUsageLanguages: ["lang-en"],
      languageUsageLevels: ["level-dub"],
    },
  },
};

/** Neither vocabulary has any entries — the pill renders nothing. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/languages", () => HttpResponse.json([])),
        http.get("/api/language-usage-levels", () => HttpResponse.json([])),
      ],
    },
  },
};
