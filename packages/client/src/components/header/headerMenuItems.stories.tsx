import type { SettingsPage } from "@/lib/settingsPages";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Monitor } from "lucide-react";

import { FavoriteMenuItem, PinMenuItem, SearchControls } from "./headerMenuItems";

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
  component: SearchControls,
  render: () => (
    <div className="w-72">
      <SearchControls />
    </div>
  ),
} satisfies Meta<typeof SearchControls>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The mobile search modal body — bound to the shared `uiStore` header search query. */
export const Search: Story = {};

/** The "Favorite this Settings page" item, shown inside an open dropdown menu. */
export const Favorite: Story = {
  render: () => (
    <DropdownMenu open>
      <DropdownMenuContent>
        <FavoriteMenuItem page={settingsPage} />
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

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
