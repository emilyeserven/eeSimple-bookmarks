import type { Meta, StoryObj } from "@storybook/react-vite";

import { TagForm } from "./TagForm";
import { sampleTagTree } from "../test-utils/story-mocks";

const meta = {
  title: "Tags/TagForm",
  component: TagForm,
  args: {
    allTags: sampleTagTree,
    submitLabel: "Create tag",
    pendingLabel: "Creating…",
    isError: false,
    onSubmit: () => {},
  },
} satisfies Meta<typeof TagForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The full create form: name, romanized name, and a parent select. */
export const Default: Story = {};

/** Name-only mode (e.g. the header's "New sub-tag" quick-add) hides the parent select. */
export const NameOnly: Story = {
  args: {
    showParent: false,
  },
};

/** A failed submit surfaces the error message below the form. */
export const WithError: Story = {
  args: {
    isError: true,
    errorMessage: "A tag with that name already exists.",
  },
};
