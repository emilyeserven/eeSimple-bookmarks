import type { CardFieldTemplate } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { LoadTemplateDropdown, SaveTemplatePopover } from "./CardFieldTemplateControls";
import { defaultCardFieldZones } from "../lib/bookmarkCardValues";
import { apiHandlers, sampleProperties } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const sampleZones = defaultCardFieldZones(sampleProperties);

const sampleTemplates: CardFieldTemplate[] = [
  {
    id: "tpl-compact",
    name: "Compact layout",
    description: null,
    fieldZones: sampleZones,
    createdAt: NOW,
  },
  {
    id: "tpl-gallery",
    name: "Gallery layout",
    description: null,
    fieldZones: sampleZones,
    createdAt: NOW,
  },
];

const withTemplates = [
  ...apiHandlers,
  http.get("/api/card-field-templates", () => HttpResponse.json(sampleTemplates)),
];

const empty = [
  ...apiHandlers,
  http.get("/api/card-field-templates", () => HttpResponse.json([])),
];

const meta = {
  title: "CardDisplayRules/CardFieldTemplateControls",
  component: SaveTemplatePopover,
  parameters: {
    msw: {
      handlers: empty,
    },
  },
} satisfies Meta<typeof SaveTemplatePopover>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The "Save as template" popover trigger (click to open the name field). */
export const Save: Story = {
  args: {
    fieldZones: sampleZones,
  },
};

/** The "Load template" dropdown with saved templates. */
export const LoadWithTemplates: StoryObj<typeof LoadTemplateDropdown> = {
  render: () => <LoadTemplateDropdown onLoad={() => {}} />,
  parameters: {
    msw: {
      handlers: withTemplates,
    },
  },
};

/** The "Load template" dropdown when nothing has been saved yet. */
export const LoadEmpty: StoryObj<typeof LoadTemplateDropdown> = {
  render: () => <LoadTemplateDropdown onLoad={() => {}} />,
};
