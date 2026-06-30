import type { ImportBlacklistEntry } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { ImportsBlacklistCard } from "./ImportsSettings";
import { apiHandlers } from "../test-utils/story-mocks";

const sampleEntries: ImportBlacklistEntry[] = [
  {
    kind: "domain",
    value: "ads.example.com",
  },
  {
    kind: "path-prefix",
    value: "example.com/sponsored",
  },
  {
    kind: "exact",
    value: "tracker.example.com/click",
  },
];

const meta = {
  title: "Settings/ImportsBlacklistCard",
  component: ImportsBlacklistCard,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/import-blacklist", () => HttpResponse.json(sampleEntries)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof ImportsBlacklistCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The blacklist editor with a few blocked entries and a filter input. */
export const Default: Story = {};

/** No blocked links yet — the table shows its empty message. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/import-blacklist", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};
