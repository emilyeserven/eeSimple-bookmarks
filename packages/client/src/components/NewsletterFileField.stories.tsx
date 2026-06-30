import type { Meta, StoryObj } from "@storybook/react-vite";

import { NewsletterFileField } from "./NewsletterFileField";

const sampleFile = new File(["<html></html>"], "weekly-digest.html", {
  type: "text/html",
});

const meta = {
  title: "Components/NewsletterFileField",
  component: NewsletterFileField,
  args: {
    file: null,
    onChange: () => {},
  },
} satisfies Meta<typeof NewsletterFileField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The empty drop zone, prompting the user to choose or drag a newsletter file. */
export const Empty: Story = {};

/** A file is selected — its name shows with a remove button. */
export const WithFile: Story = {
  args: {
    file: sampleFile,
  },
};
