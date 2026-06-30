import type { Meta, StoryObj } from "@storybook/react-vite";

import { RichTextEditor } from "./RichTextEditor";

const SAMPLE = [
  "## Getting started",
  "",
  "This is a **rich-text** field that reads and writes _Markdown_.",
  "",
  "- A bullet point",
  "- Another with a [link](https://example.com)",
].join("\n");

const meta = {
  title: "UI/RichTextEditor",
  component: RichTextEditor,
  render: args => (
    <div className="w-160">
      <RichTextEditor {...args} />
    </div>
  ),
} satisfies Meta<typeof RichTextEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: SAMPLE,
    onChange: () => {},
  },
};

export const Empty: Story = {
  args: {
    value: "",
    onChange: () => {},
  },
};

export const ReadOnly: Story = {
  args: {
    value: SAMPLE,
    editable: false,
  },
};
