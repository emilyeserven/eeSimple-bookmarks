import type { Meta, StoryObj } from "@storybook/react-vite";

import { DisplaySettingsControlsBase } from "./DisplaySettingsControls";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/DisplaySettingsControls",
  component: DisplaySettingsControlsBase,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    value: {
      viewMode: "cards",
      columns: 3,
      imageMode: "natural",
      imageVisibility: "shown",
      imageLayout: "above",
    },
    onViewModeChange: () => {},
    onColumnsChange: () => {},
    onImageModeChange: () => {},
    onImageVisibilityChange: () => {},
    onImageLayoutChange: () => {},
    showsImages: true,
  },
} satisfies Meta<typeof DisplaySettingsControlsBase>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Cards view with images shown: view, columns, images, and aspect controls. */
export const Default: Story = {};

/** Single column with side layout exposes the image Layout (Above/Side) toggle. */
export const SingleColumnWithLayout: Story = {
  args: {
    value: {
      viewMode: "cards",
      columns: 1,
      imageMode: "natural",
      imageVisibility: "shown",
      imageLayout: "side",
    },
  },
};

/** Legacy corner-overlay toggle shown by passing `onCornerOverlaysChange`. */
export const WithCornerOverlays: Story = {
  args: {
    value: {
      viewMode: "cards",
      columns: 3,
      imageMode: "cropped",
      imageVisibility: "shown",
      imageLayout: "above",
      cornerOverlays: true,
    },
    onCornerOverlaysChange: () => {},
  },
};

/** Table view collapses the card-only controls. */
export const TableView: Story = {
  args: {
    value: {
      viewMode: "table",
      columns: 3,
      imageMode: "natural",
      imageVisibility: "shown",
      imageLayout: "above",
    },
  },
};
