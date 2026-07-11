import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { AiSummarizationSettings } from "./AiSummarizationSettings";

const settingsHandler = http.get("/api/app-settings/ai-summarization", () => HttpResponse.json({
  aiSummarizationPrompt: "Summarize each linked page in two sentences for a busy reader.",
  aiSummarizationSuggestTags: false,
}));

const emptyQueueHandlers = [
  settingsHandler,
  http.get("/api/ai-summarization/queue", () => HttpResponse.json([])),
];

const filledQueueHandlers = [
  settingsHandler,
  http.get("/api/ai-summarization/queue", () => HttpResponse.json([
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

const meta = {
  title: "Settings/AiSummarizationSettings",
  component: AiSummarizationSettings,
  parameters: {
    msw: {
      handlers: filledQueueHandlers,
    },
  },
} satisfies Meta<typeof AiSummarizationSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Queue has bookmarks — the generated prompt lists them and the Copy button is enabled. */
export const Default: Story = {};

/** Empty AI Summary Queue — the prompt notes there is nothing to summarize. */
export const EmptyQueue: Story = {
  parameters: {
    msw: {
      handlers: emptyQueueHandlers,
    },
  },
};
