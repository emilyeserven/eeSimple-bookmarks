import type { AutoFetchJobStatus } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { ImageFetchProgressIndicator } from "./ImageFetchProgressIndicator";
import { apiHandlers } from "../test-utils/story-mocks";

const running: AutoFetchJobStatus = {
  status: "running",
  totalCount: 24,
  processedCount: 9,
};

const idle: AutoFetchJobStatus = {
  status: "idle",
};

const meta = {
  title: "Components/ImageFetchProgressIndicator",
  component: ImageFetchProgressIndicator,
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/gallery/auto-fetch/status", () => HttpResponse.json(running)),
        http.get("/api/gallery/auto-fetch-screenshot-fallback/status", () => HttpResponse.json(idle)),
      ],
    },
  },
} satisfies Meta<typeof ImageFetchProgressIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A running image auto-fetch job — spinner with a 9/24 count. */
export const Running: Story = {};

/** The screenshot-fallback variant is running instead. */
export const ScreenshotFallback: Story = {
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/gallery/auto-fetch/status", () => HttpResponse.json(idle)),
        http.get("/api/gallery/auto-fetch-screenshot-fallback/status", () =>
          HttpResponse.json({
            status: "running",
            totalCount: 12,
            processedCount: 3,
          } satisfies AutoFetchJobStatus)),
      ],
    },
  },
};
