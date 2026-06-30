import type { HomepageSection } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";
import { HttpResponse, http } from "msw";

import { HomepageSectionForm } from "./HomepageSectionForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const section: HomepageSection = {
  id: "section-recent",
  title: "Recently added",
  description: "The latest links you've saved.",
  conditions: emptyConditionTree(),
  sortOrder: 0,
  hideIfEmpty: false,
  columns: 2,
  imageMode: "natural",
  imageLayout: "above",
  imageVisibility: "shown",
  viewMode: "cards",
  fieldZones: null,
  cardZoneLayouts: null,
  hiddenCardFields: [],
  cornerOverlays: false,
  hideWebsiteForYouTube: false,
  createdAt: NOW,
};

const meta = {
  title: "Components/HomepageSectionForm",
  component: HomepageSectionForm,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/card-display-rules", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
  args: {
    onCancel: () => {},
  },
} satisfies Meta<typeof HomepageSectionForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Create mode: an empty form with an explicit Save button. */
export const Create: Story = {
  args: {
    onSave: () => {},
  },
};

/** Edit mode: auto-saving on change, with a Done + Delete row. */
export const Edit: Story = {
  args: {
    section,
    onChange: () => {},
    onDelete: () => {},
  },
};
