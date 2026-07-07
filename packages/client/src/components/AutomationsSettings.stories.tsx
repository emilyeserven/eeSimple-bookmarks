import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { AutomationsSettings } from "./AutomationsSettings";
import { apiHandlers } from "../test-utils/story-mocks";

const automationSettings = {
  autoFetchTitle: true,
  autoFetchImage: true,
  autoApplyTitleTags: false,
  autoApplyTitleLocations: false,
  sidebarOpenModifier: "alt",
};

const personSourceLabelSettings = {
  websiteLabel: "website",
  biographyLabel: "biography",
};

const meta = {
  title: "Settings/AutomationsSettings",
  component: AutomationsSettings,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/automation", () => HttpResponse.json(automationSettings)),
        http.get("/api/app-settings/person-source-labels", () => HttpResponse.json(personSourceLabelSettings)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof AutomationsSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllEnabled: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/automation", () => HttpResponse.json({
          ...automationSettings,
          autoApplyTitleTags: true,
          autoApplyTitleLocations: true,
        })),
        http.get("/api/app-settings/person-source-labels", () => HttpResponse.json(personSourceLabelSettings)),
        ...apiHandlers,
      ],
    },
  },
};
