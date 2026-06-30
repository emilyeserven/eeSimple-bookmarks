import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { CommandPalette } from "./CommandPalette";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const meta = {
  title: "Components/CommandPalette",
  component: CommandPalette,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/bookmarks", () => HttpResponse.json([sampleBookmark])),
        http.get("/api/card-display-rules", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The CMD+K palette mounts closed; press Cmd/Ctrl+K to open it. */
export const Default: Story = {};
