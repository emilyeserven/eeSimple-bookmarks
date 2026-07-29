import type { Meta, StoryObj } from "@storybook/react-vite";

import { Globe } from "lucide-react";

import { EditActionCell, ImageCell } from "./cells";

const meta = {
  title: "Components/Tables/Cells",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** The image cell in its rounded and full-circle shapes. */
export const Image: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ImageCell
        src="https://github.githubassets.com/favicons/favicon.png"
        fallback={<Globe className="size-4" />}
      />
      <ImageCell
        src="https://github.githubassets.com/favicons/favicon.png"
        shape="full"
        fallback={<Globe className="size-4" />}
      />
    </div>
  ),
};

/** Null and broken image sources both falling back to the icon. */
export const ImageFallback: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ImageCell
        src={null}
        fallback={<Globe className="size-4" />}
      />
      <ImageCell
        src="https://example.invalid/missing.png"
        fallback={<Globe className="size-4" />}
      />
    </div>
  ),
};

/** The edit action cell linking to an edit page. */
export const EditAction: Story = {
  render: () => (
    <div className="w-40">
      <EditActionCell
        to="/"
        params={{}}
        label="Edit item"
        onClick={() => {}}
      />
    </div>
  ),
};
