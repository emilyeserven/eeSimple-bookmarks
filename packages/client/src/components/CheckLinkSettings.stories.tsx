import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { CheckLinkSettings } from "./CheckLinkSettings";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Settings/CheckLinkSettings",
  component: CheckLinkSettings,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/shortener-ignore-list", () => HttpResponse.json([])),
        http.get("/api/app-settings/custom-strip-params", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof CheckLinkSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
