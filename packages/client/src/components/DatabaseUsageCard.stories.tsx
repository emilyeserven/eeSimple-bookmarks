import type { DatabaseTableDetail, DatabaseUsageReport } from "@eesimple/types";
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

const bookmarksDetail: DatabaseTableDetail = {
  tableName: "bookmarks",
  heapBytes: 4_000_000,
  indexBytes: 1_200_000,
  toastBytes: 42_880,
  totalBytes: 5_242_880,
  rowEstimate: 1240,
  deadRowEstimate: 18,
  sequentialScans: 3,
  indexScans: 5210,
  lastVacuum: "2026-06-30T12:00:00.000Z",
  lastAutoVacuum: "2026-07-01T03:00:00.000Z",
  lastAnalyze: "2026-06-30T12:00:00.000Z",
  lastAutoAnalyze: "2026-07-01T03:00:00.000Z",
  columns: [
    {
      columnName: "id",
      dataType: "uuid",
    },
    {
      columnName: "title",
      dataType: "text",
    },
    {
      columnName: "url",
      dataType: "text",
    },
  ],
  indexes: [
    {
      indexName: "bookmarks_pkey",
      bytes: 900_000,
    },
    {
      indexName: "bookmarks_category_id_idx",
      bytes: 300_000,
    },
  ],
};

const meta = {
  title: "Settings/DatabaseUsageCard",
  component: DatabaseUsageCard,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/database-usage", () => HttpResponse.json(report)),
        http.get(
          "/api/app-settings/database-usage/:tableName",
          () => HttpResponse.json(bookmarksDetail),
        ),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof DatabaseUsageCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * The detail-fetch endpoint 404s — click a table row in the Storybook canvas to see the dialog's
 * error state.
 */
export const DetailLoadError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/database-usage", () => HttpResponse.json(report)),
        http.get(
          "/api/app-settings/database-usage/:tableName",
          () => HttpResponse.json({
            message: "Table not found",
          }, {
            status: 404,
          }),
        ),
        ...apiHandlers,
      ],
    },
  },
};
