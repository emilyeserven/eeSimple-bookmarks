import type { HomepageContentSettings as HomepageContent } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { HomepageContentSettings } from "./HomepageContentSettings";
import { apiHandlers } from "../test-utils/story-mocks";

const content: HomepageContent = {
  homepageText: "## Welcome\n\nSome intro Markdown.",
  homepageTextWidth: "full",
  bookmarkQuickAddEnabled: true,
  bookmarkQuickAddWidth: "half",
  bookmarkQuickAddDisplay: "collapsible",
  homepageHeaderHidden: false,
  homepageTextEnabled: true,
  searchEnabled: false,
  searchWidth: "full",
  widgetOrder: ["homepageText", "bookmarkQuickAdd", "search"],
};

const meta = {
  title: "Components/HomepageContentSettings",
  component: HomepageContentSettings,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/homepage-content", () => HttpResponse.json(content)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof HomepageContentSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The homepage content settings panel (text + Quick Add), auto-saving on edit. */
export const Default: Story = {};

/** Quick Add disabled — only the text section is configurable. */
export const QuickAddDisabled: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/homepage-content", () => HttpResponse.json({
          ...content,
          bookmarkQuickAddEnabled: false,
        })),
        ...apiHandlers,
      ],
    },
  },
};
