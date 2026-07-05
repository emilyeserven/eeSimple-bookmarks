import type { SettingsPage } from "@/lib/settingsPages";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Monitor } from "lucide-react";

import { FavoriteMenuItem, PinMenuItem } from "./headerMenuItems";

import {
  DropdownMenu,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

const settingsPage: SettingsPage = {
  path: "/settings/display/general",
  label: "Display: General",
  icon: Monitor,
};

const meta = {
  title: "Components/Header/HeaderMenuItems",
  component: FavoriteMenuItem,
  args: {
    page: settingsPage,
  },
  render: () => (
    <DropdownMenu open>
      <DropdownMenuContent>
        <FavoriteMenuItem page={settingsPage} />
      </DropdownMenuContent>
    </DropdownMenu>
  ),
} satisfies Meta<typeof FavoriteMenuItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The "Favorite this Settings page" item, shown inside an open dropdown menu. */
export const Favorite: Story = {};

/** The "Pin this entity" item, shown inside an open dropdown menu. */
export const Pin: Story = {
  render: () => (
    <DropdownMenu open>
      <DropdownMenuContent>
        <PinMenuItem
          context={{
            entityType: "category",
            entityId: "cat-workflow",
            label: "Workflow",
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
