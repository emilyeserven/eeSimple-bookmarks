import type { FavoriteSettingsPage } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { SettingsFavoritesFlyout } from "./SettingsFavoritesFlyout";
import { apiHandlers } from "../test-utils/story-mocks";

import { SidebarProvider } from "@/components/ui/sidebar";

const NOW = "2026-06-01T00:00:00.000Z";

const favorites: FavoriteSettingsPage[] = [
  {
    id: "fav-display",
    path: "/settings/display",
    sortOrder: 0,
    createdAt: NOW,
  },
  {
    id: "fav-connectors",
    path: "/settings/connectors",
    sortOrder: 1,
    createdAt: NOW,
  },
];

const meta = {
  title: "Components/SettingsFavoritesFlyout",
  component: SettingsFavoritesFlyout,
  decorators: [
    Story => (
      <SidebarProvider>
        <Story />
      </SidebarProvider>
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        http.get("/api/favorite-settings-pages", () => HttpResponse.json(favorites)),
        ...apiHandlers,
      ],
    },
  },
  args: {
    pathname: "/bookmarks",
  },
} satisfies Meta<typeof SettingsFavoritesFlyout>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Settings button with favorited pages available in its hover flyout. */
export const Default: Story = {};

/** No favorites yet — the flyout shows the empty-state hint. */
export const NoFavorites: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/favorite-settings-pages", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};
