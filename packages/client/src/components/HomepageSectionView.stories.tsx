import type { Meta, StoryObj } from "@storybook/react-vite";

import { HomepageSectionView } from "./HomepageSectionView";
import { makeHomepageSection } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const section = makeHomepageSection({
  id: "section-reading",
  title: "Currently Reading",
  description: "Books and long-reads in progress.",
  columns: 3,
});

const meta = {
  title: "Components/HomepageSectionView",
  component: HomepageSectionView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    section,
    onPatchDisplay: () => {},
  },
} satisfies Meta<typeof HomepageSectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Read-only Display + Filter summary with a description. */
export const Default: Story = {};

/** A section with no description and no filter conditions. */
export const NoDescriptionNoFilter: Story = {
  args: {
    section: {
      ...section,
      description: null,
    },
  },
};
