import type { AutofillBackfillResult, AutofillRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";
import { HttpResponse, http } from "msw";

import { AutofillBackfillView } from "./AutofillBackfillView";
import { makeBookmark } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const rule: AutofillRule = {
  id: "rule-recipes",
  name: "Recipes",
  slug: "recipes",
  description: "Tag recipe links",
  conditions: emptyConditionTree(),
  setCategoryId: "cat-workflow",
  setMediaTypeId: null,
  tagIds: ["tag-cli"],
  locationIds: [],
  numberValues: [],
  booleanValues: [],
  dateTimeValues: [],
  sortOrder: 3,
  createdAt: NOW,
};

const backfillResult: AutofillBackfillResult = {
  entries: [
    {
      bookmark: makeBookmark({
        id: "bm-1",
        title: "Roasted Vegetables 101",
        url: "https://101cookbooks.com/roasted-vegetables",
      }),
      needsBackfill: true,
      isExempt: false,
    },
    {
      bookmark: makeBookmark({
        id: "bm-2",
        title: "The Perfect Risotto",
        url: "https://101cookbooks.com/risotto",
      }),
      needsBackfill: false,
      isExempt: false,
    },
    {
      bookmark: makeBookmark({
        id: "bm-3",
        title: "Sourdough Starter Guide",
        url: "https://101cookbooks.com/sourdough",
      }),
      needsBackfill: true,
      isExempt: true,
    },
  ],
};

const meta = {
  title: "Components/AutofillBackfillView",
  component: AutofillBackfillView,
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/autofill-rules/:id/backfill", () => HttpResponse.json(backfillResult)),
      ],
    },
  },
  args: {
    rule,
  },
} satisfies Meta<typeof AutofillBackfillView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Matching bookmarks with a mix of needs-backfill, up-to-date, and exempt rows. */
export const Default: Story = {};

/** No matching bookmarks. */
export const NoMatches: Story = {
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/autofill-rules/:id/backfill", () =>
          HttpResponse.json({
            entries: [],
          } satisfies AutofillBackfillResult)),
      ],
    },
  },
};

/** The rule sets no prefill values, so backfill is not applicable. */
export const NoPrefillValues: Story = {
  args: {
    rule: {
      ...rule,
      setCategoryId: null,
      tagIds: [],
    },
  },
};
