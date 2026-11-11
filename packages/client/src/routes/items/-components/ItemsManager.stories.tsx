import type { Meta, StoryObj } from "@storybook/react-vite";

import { http, HttpResponse } from "msw";

import { ItemsManager } from "./ItemsManager";

import { apiHandlers } from "@/test-utils/story-mocks";

const meta = {
  title: "Components/ItemsManager",
  component: ItemsManager,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof ItemsManager>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A couple of items; descriptions auto-save on blur. */
export const Default: Story = {};

/** The empty state. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [http.get("/api/items", () => HttpResponse.json([])), ...apiHandlers],
    },
  },
};
