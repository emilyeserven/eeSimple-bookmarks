import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { OrphanCleanupCard } from "./OrphanCleanupCard";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Settings/OrphanCleanupCard",
  component: OrphanCleanupCard,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/maintenance/orphans", () => HttpResponse.json({
          bookmarks: 4,
          inboxItems: 7,
        })),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof OrphanCleanupCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Orphaned records exist — both delete buttons are enabled with their counts. */
export const Default: Story = {};

/** Nothing to clean up — both delete buttons are disabled. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/maintenance/orphans", () => HttpResponse.json({
          bookmarks: 0,
          inboxItems: 0,
        })),
        ...apiHandlers,
      ],
    },
  },
};
