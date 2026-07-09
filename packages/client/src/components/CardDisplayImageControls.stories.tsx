import type { CardImageDisplayValue } from "./CardDisplayImageControls";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { CardDisplayImageControls } from "./CardDisplayImageControls";
import { apiHandlers } from "../test-utils/story-mocks";

const inheritedValue: CardImageDisplayValue = {
  imageMode: null,
  imageVisibility: null,
  imageLayout: null,
  hideWebsiteForYouTube: null,
};

const concreteValue: CardImageDisplayValue = {
  imageMode: "natural",
  imageVisibility: "shown",
  imageLayout: "above",
  hideWebsiteForYouTube: false,
};

const meta = {
  title: "Components/CardDisplayImageControls",
  component: CardDisplayImageControls,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  decorators: [
    Story => (
      <div className="max-w-md space-y-4">
        <Story />
      </div>
    ),
  ],
  args: {
    value: concreteValue,
    onChange: () => {},
    idPrefix: "story",
    isDefault: false,
  },
} satisfies Meta<typeof CardDisplayImageControls>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A non-default rule with every image attribute overridden. */
export const Overridden: Story = {};

/** A non-default rule inheriting every attribute — each row shows an "Override" checkbox. */
export const Inheriting: Story = {
  args: {
    value: inheritedValue,
  },
};

/** The Default rule: every attribute is concrete with no inherit option. */
export const DefaultRule: Story = {
  args: {
    value: concreteValue,
    isDefault: true,
  },
};
