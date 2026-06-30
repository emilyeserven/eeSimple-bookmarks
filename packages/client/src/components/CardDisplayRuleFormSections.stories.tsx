import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";
import { HttpResponse, http } from "msw";

import { CardDisplayRuleFormSections } from "./CardDisplayRuleFormSections";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const placeholder = (label: string) => (
  <div className="rounded-md border p-4 text-sm">{label}</div>
);

const extraHandlers = [
  ...apiHandlers,
  http.get("/api/bookmarks", () => HttpResponse.json([sampleBookmark])),
  http.get("/api/card-display-rules", () => HttpResponse.json([])),
];

const meta = {
  title: "CardDisplayRules/CardDisplayRuleFormSections",
  component: CardDisplayRuleFormSections,
  parameters: {
    msw: {
      handlers: extraHandlers,
    },
  },
  args: {
    isDefault: false,
    displayDefaultOpen: true,
    nameValue: "Highlight videos",
    conditions: emptyConditionTree(),
    displayModalOpen: false,
    ruleModalOpen: false,
    onExpandDisplay: () => {},
    onExpandRule: () => {},
    editingNote: placeholder("Editing in the expanded view…"),
    displayWithPreview: placeholder("Display controls + card preview"),
    generalFields: placeholder("Name + description inputs"),
    whenFields: placeholder("Condition tree editor"),
  },
} satisfies Meta<typeof CardDisplayRuleFormSections>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A normal rule: collapsible General / When / Display sections + match preview. */
export const Default: Story = {};

/** The Default rule: edits only its concrete display config. */
export const DefaultRule: Story = {
  args: {
    isDefault: true,
  },
};
