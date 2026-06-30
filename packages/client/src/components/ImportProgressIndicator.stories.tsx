import type { ActiveImport } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { ImportProgressIndicator } from "./ImportProgressIndicator";
import { apiHandlers } from "../test-utils/story-mocks";

const active: ActiveImport[] = [
  {
    id: "import-1",
    source: "url",
    sourceLabel: "Morning Brew #482",
    status: "processing",
    totalCount: 30,
    processedCount: 12,
  },
  {
    id: "import-2",
    source: "paste",
    sourceLabel: "Pasted links",
    status: "queued",
    totalCount: null,
    processedCount: null,
  },
];

const meta = {
  title: "Components/ImportProgressIndicator",
  component: ImportProgressIndicator,
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/imports/active", () => HttpResponse.json(active)),
      ],
    },
  },
} satisfies Meta<typeof ImportProgressIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Two in-flight imports — one processing, one queued. */
export const Default: Story = {};

/** A single import in progress. */
export const SingleImport: Story = {
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/imports/active", () => HttpResponse.json([active[0]])),
      ],
    },
  },
};
