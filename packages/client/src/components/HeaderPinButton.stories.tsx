import type { PinnedSidebarItem } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { HeaderPinButton } from "./HeaderPinButton";

const NOW = "2026-06-01T00:00:00.000Z";

const pinnedCategory: PinnedSidebarItem = {
  id: "pin-1",
  entityType: "category",
  entityId: "cat-workflow",
  sortOrder: 0,
  createdAt: NOW,
};

const meta = {
  title: "Components/HeaderPinButton",
  component: HeaderPinButton,
  args: {
    context: {
      entityType: "category",
      entityId: "cat-workflow",
      label: "Workflow",
    },
  },
  parameters: {
    msw: {
      handlers: [
        http.get("/api/pinned-sidebar-items", () => HttpResponse.json([])),
      ],
    },
  },
} satisfies Meta<typeof HeaderPinButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The current page's entity is not pinned (shows the Pin icon). */
export const Unpinned: Story = {};

/** The current page's entity is already pinned (shows the PinOff icon). */
export const Pinned: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/pinned-sidebar-items", () => HttpResponse.json([pinnedCategory])),
      ],
    },
  },
};
