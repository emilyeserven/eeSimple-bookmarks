import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppSidebar } from "./app-sidebar";
import { apiHandlers } from "../test-utils/story-mocks";

import { SidebarProvider } from "@/components/ui/sidebar";

const meta = {
  title: "Layout/AppSidebar",
  component: AppSidebar,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  decorators: [
    Story => (
      <SidebarProvider>
        <Story />
      </SidebarProvider>
    ),
  ],
} satisfies Meta<typeof AppSidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
