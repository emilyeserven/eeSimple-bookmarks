import type { SettingsPage } from "@/lib/settingsPages";
import type { FavoriteSettingsPage } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Monitor } from "lucide-react";
import { HttpResponse, http } from "msw";

import { HeaderSettingsFavoriteButton } from "./HeaderSettingsFavoriteButton";

const NOW = "2026-06-01T00:00:00.000Z";

const page: SettingsPage = {
  path: "/settings/display/general",
  label: "Display: General",
  icon: Monitor,
};

const favorite: FavoriteSettingsPage = {
  id: "fav-1",
  path: page.path,
  sortOrder: 0,
  createdAt: NOW,
};

const meta = {
  title: "Components/HeaderSettingsFavoriteButton",
  component: HeaderSettingsFavoriteButton,
  args: {
    page,
  },
  parameters: {
    msw: {
      handlers: [
        http.get("/api/favorite-settings-pages", () => HttpResponse.json([])),
      ],
    },
  },
} satisfies Meta<typeof HeaderSettingsFavoriteButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The current Settings page is not favorited (empty star). */
export const Unfavorited: Story = {};

/** The current Settings page is favorited (filled yellow star). */
export const Favorited: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/favorite-settings-pages", () => HttpResponse.json([favorite])),
      ],
    },
  },
};
