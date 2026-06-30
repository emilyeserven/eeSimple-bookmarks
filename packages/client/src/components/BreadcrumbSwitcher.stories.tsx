import type { Meta, StoryObj } from "@storybook/react-vite";

import { BreadcrumbSwitcher } from "./BreadcrumbSwitcher";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/BreadcrumbSwitcher",
  component: BreadcrumbSwitcher,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  // The trigger only appears on hover of the parent crumb — show it within a hover group, with the
  // breadcrumb label beside it for context.
  decorators: [
    Story => (
      <span className="group/crumb inline-flex items-center text-sm">
        Workflow
        <Story />
      </span>
    ),
  ],
  args: {
    spec: {
      kind: "category",
      currentSlug: "workflow",
    },
  },
} satisfies Meta<typeof BreadcrumbSwitcher>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Switch among sibling categories. */
export const Default: Story = {};
