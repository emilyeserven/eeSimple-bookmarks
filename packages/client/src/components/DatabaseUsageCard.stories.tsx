import type { DatabaseUsageReport } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { DatabaseUsageCard } from "./DatabaseUsageCard";
import { apiHandlers } from "../test-utils/story-mocks";

const report: DatabaseUsageReport = {
  tables: [
    {
      tableName: "bookmarks",
      totalBytes: 5_242_880,
      rowEstimate: 1240,
    },
    {
      tableName: "bookmark_images",
      totalBytes: 1_048_576,
      rowEstimate: 312,
    },
    {
      tableName: "tags",
      totalBytes: 131_072,
      rowEstimate: 86,
    },
  ],
  totalBytes: 6_422_528,
  capturedAt: "2026-06-01T00:00:00.000Z",
};

const meta = {
  title: "Settings/DatabaseUsageCard",
  component: DatabaseUsageCard,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/database-usage", () => HttpResponse.json(report)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof DatabaseUsageCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
