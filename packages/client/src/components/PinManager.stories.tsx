import type { PinnedSidebarItem } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { PinManager } from "./PinManager";
import { apiHandlers, sampleCategories } from "../test-utils/story-mocks";

const pins: PinnedSidebarItem[] = [
  {
    id: "pin-1",
    entityType: "category",
    entityId: sampleCategories[0].id,
    sortOrder: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];

const meta = {
  title: "Components/PinManager",
  component: PinManager,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/pinned-sidebar-items", () => HttpResponse.json(pins)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof PinManager>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The pin combobox plus the current pinned items, each with an unpin button. */
export const Default: Story = {};

/** No pins yet — the empty-state message is shown. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/pinned-sidebar-items", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};
