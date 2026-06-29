import type { Meta, StoryObj } from "@storybook/react-vite";

import { SidebarExternalLinksSettings } from "./SidebarExternalLinksSettings";

const meta = {
  title: "Settings/SidebarExternalLinksSettings",
  component: SidebarExternalLinksSettings,
} satisfies Meta<typeof SidebarExternalLinksSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
