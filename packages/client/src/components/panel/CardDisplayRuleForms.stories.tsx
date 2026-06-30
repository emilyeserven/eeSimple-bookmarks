import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { CreateCardDisplayRule } from "./CardDisplayRuleForms";
import { apiHandlers, sampleBookmark } from "../../test-utils/story-mocks";

const handlers = [
  ...apiHandlers,
  http.get("/api/bookmarks", () => HttpResponse.json([sampleBookmark])),
  http.get("/api/card-display-rules", () => HttpResponse.json([])),
  http.get("/api/card-field-templates", () => HttpResponse.json([])),
];

const meta = {
  title: "Components/Panel/CreateCardDisplayRule",
  component: CreateCardDisplayRule,
  parameters: {
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof CreateCardDisplayRule>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The panel's inline create form for a new card display rule. */
export const Default: Story = {};
