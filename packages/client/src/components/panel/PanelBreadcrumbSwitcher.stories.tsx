import type { Meta, StoryObj } from "@storybook/react-vite";

import { PanelBreadcrumbSwitcher } from "./PanelBreadcrumbSwitcher";
import { apiHandlers } from "../../test-utils/story-mocks";

const meta = {
  title: "Components/Panel/PanelBreadcrumbSwitcher",
  component: PanelBreadcrumbSwitcher,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  decorators: [
    Story => (
      <div className="group/crumb inline-flex p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    dCT: "category",
    dCId: "cat-workflow",
  },
} satisfies Meta<typeof PanelBreadcrumbSwitcher>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The hover-revealed switcher button beside a panel breadcrumb; clicking lists sibling items. */
export const Default: Story = {};
