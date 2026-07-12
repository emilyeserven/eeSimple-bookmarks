import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { AiAutotagSettings } from "./AiAutotagSettings";

const settingsHandler = http.get("/api/app-settings/ai-autotag", () => HttpResponse.json({
  aiAutotagPrompt: "Suggest a few concise topic tags for each linked page.",
  aiAutotagIncludeExistingTags: false,
}));

const tagsHandler = http.get("/api/tags", () => HttpResponse.json([
  {
    id: "tag-1",
    name: "React",
    slug: "react",
    parentId: null,
    description: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    names: [],
    editableOnCard: false,
    excludeFromBackfill: false,
  },
]));

const filledHandlers = [
  settingsHandler,
  tagsHandler,
  http.get("/api/ai-autotag/untagged", () => HttpResponse.json([
    {
      id: "11111111-1111-1111-1111-111111111111",
      url: "https://example.com/article",
      title: "An interesting article",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      url: "https://example.com/talk",
      title: "A conference talk worth watching",
    },
  ])),
];

const emptyHandlers = [
  settingsHandler,
  tagsHandler,
  http.get("/api/ai-autotag/untagged", () => HttpResponse.json([])),
];

const meta = {
  title: "Settings/AiAutotagSettings",
  component: AiAutotagSettings,
  parameters: {
    msw: {
      handlers: filledHandlers,
    },
  },
} satisfies Meta<typeof AiAutotagSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Untagged bookmarks are available — the generated prompt lists them and Copy is enabled. */
export const Default: Story = {};

/** No untagged bookmarks — the prompt notes there is nothing to tag. */
export const NoUntagged: Story = {
  parameters: {
    msw: {
      handlers: emptyHandlers,
    },
  },
};
