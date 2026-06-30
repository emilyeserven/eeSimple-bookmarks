import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { AiSummarizationSettings } from "./AiSummarizationSettings";

const settingsHandler = http.get("/api/app-settings/ai-summarization", () => HttpResponse.json({
  aiSummarizationPrompt: "Summarize each linked page in two sentences for a busy reader.",
}));

const emptyQueueHandlers = [
  settingsHandler,
  http.get("/api/ai-summarization/queue", () => HttpResponse.json([])),
];

const filledQueueHandlers = [
  settingsHandler,
  http.get("/api/ai-summarization/queue", () => HttpResponse.json([
    {
      url: "https://example.com/article",
      title: "An interesting article",
    },
    {
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
