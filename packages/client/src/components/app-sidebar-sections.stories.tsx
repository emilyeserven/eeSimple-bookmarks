import type { Meta, StoryObj } from "@storybook/react-vite";

import { SidebarAdvancedSection } from "./app-sidebar-sections";

import { SidebarMenu, SidebarProvider } from "@/components/ui/sidebar";

const meta = {
  title: "Layout/SidebarAdvancedSection",
  component: SidebarAdvancedSection,
  decorators: [
    Story => (
      <SidebarProvider>
        <SidebarMenu>
          <Story />
        </SidebarMenu>
      </SidebarProvider>
    ),
  ],
  args: {
    advanced: {
      coolifyLinkEnabled: true,
      coolifyUrl: "https://coolify.example.com",
      docsLinkEnabled: true,
      storybookLinkEnabled: true,
      drizzleGatewayLinkEnabled: true,
      drizzleGatewayUrl: "http://localhost:4983",
      githubLinkEnabled: true,
    },
  },
} satisfies Meta<typeof SidebarAdvancedSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every external link enabled — Coolify, Docs, Storybook, Drizzle Gateway, and GitHub. */
export const Default: Story = {};

/** Only the keyless Docs and Storybook links enabled. */
export const DocsOnly: Story = {
  args: {
    advanced: {
      coolifyLinkEnabled: false,
      coolifyUrl: "",
      docsLinkEnabled: true,
      storybookLinkEnabled: true,
      drizzleGatewayLinkEnabled: false,
      drizzleGatewayUrl: "",
      githubLinkEnabled: false,
    },
  },
};
