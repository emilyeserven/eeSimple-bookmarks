import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { HomepageSectionCard } from "./HomepageSectionCard";
import { makeHomepageSection } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const section = makeHomepageSection({
  id: "section-recent",
  title: "Recently added",
  description: "The latest links you've saved.",
  columns: 2,
});

const meta = {
  title: "Components/HomepageSectionCard",
  component: HomepageSectionCard,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/card-display", () => HttpResponse.json({
          sections: [],
          imageCorners: {
            "top-left": [],
            "top-right": [],
            "bottom-left": [],
            "bottom-right": [],
          },
          imageMode: "natural",
          imageVisibility: "shown",
          imageLayout: "above",
          hideWebsiteForYouTube: false,
        })),
        ...apiHandlers,
      ],
    },
  },
  args: {
    section,
  },
} satisfies Meta<typeof HomepageSectionCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A collapsed section row in the settings list (drag handle, edit, expand). */
export const Collapsed: Story = {};

/** A section that hides itself when empty (shows the EyeOff indicator). */
export const HidesWhenEmpty: Story = {
  args: {
    section: {
      ...section,
      title: "Unread",
      hideIfEmpty: true,
    },
  },
};

/** Rendered mid-drag (elevated shadow). */
export const Dragging: Story = {
  args: {
    isDragging: true,
  },
};
