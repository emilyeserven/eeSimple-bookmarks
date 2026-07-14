import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { HomepageSectionForm } from "./HomepageSectionForm";
import { makeHomepageSection } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const section = makeHomepageSection({
  id: "section-recent",
  title: "Recently added",
  description: "The latest links you've saved.",
  columns: 2,
});

const meta = {
  title: "Components/HomepageSectionForm",
  component: HomepageSectionForm,
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
    onCancel: () => {},
  },
} satisfies Meta<typeof HomepageSectionForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Create mode: an empty form with an explicit Save button. */
export const Create: Story = {
  args: {
    onSave: () => {},
  },
};

/** Edit mode: auto-saving on change, with a Done + Delete row. */
export const Edit: Story = {
  args: {
    section,
    onChange: () => {},
    onDelete: () => {},
  },
};
