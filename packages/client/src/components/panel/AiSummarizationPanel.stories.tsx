import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { AiSummarizationPanel } from "./AiSummarizationPanel";

const handlers = [
  http.get("/api/app-settings/ai-summarization", () => HttpResponse.json({
    aiSummarizationPrompt: "Summarize each linked page in two sentences for a busy reader.",
  })),
  http.get("/api/ai-summarization/queue", () => HttpResponse.json([
    {
      url: "https://example.com/article",
      title: "An interesting article",
    },
  ])),
];

const meta = {
  title: "Components/Panel/AiSummarizationPanel",
  component: AiSummarizationPanel,
  parameters: {
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof AiSummarizationPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The panel wrapper around the AI Summarization settings body. */
export const Default: Story = {};
