import type { useAuthorGeneralForm } from "./useAuthorGeneralForm";
import type { Author, Website, YouTubeChannel } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthorAvatarActions } from "./AuthorAvatarActions";

type Controller = ReturnType<typeof useAuthorGeneralForm>;

/** A throwaway mutation-shaped stub — the component only ever calls `.mutate()`. */
const noopMutation = {
  mutate: () => undefined,
} as unknown as Controller["autoAvatar"];

const author: Author = {
  id: "author-1",
  name: "Jane Author",
  romanizedName: null,
  slug: "jane-author",
  createdAt: "2026-06-01T00:00:00.000Z",
  bookmarkCount: 3,
  authorWebsiteUrl: "https://janeauthor.example.com",
  biographyUrl: "https://janeauthor.example.com/bio",
  imageUrl: null,
  socialLinks: [],
  youtubeChannelIds: [],
  websiteIds: [],
  publisherIds: [],
};

const channels: YouTubeChannel[] = [
  {
    id: "channel-1",
    channelKey: "@janeauthor",
    name: "Jane Author Channel",
    slug: "jane-author-channel",
    selfIds: [],
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];

const websites: Website[] = [
  {
    id: "site-1",
    domain: "janeauthor.example.com",
    siteName: "Jane Author",
    slug: "jane-author",
  } as Website,
];

const meta = {
  title: "Components/AuthorAvatarActions",
  component: AuthorAvatarActions,
  args: {
    author,
    avatarBusy: false,
    autoAvatar: noopMutation,
    adoptChannel: noopMutation as unknown as Controller["adoptChannel"],
    adoptWebsite: noopMutation as unknown as Controller["adoptWebsite"],
    connectedChannelsWithImage: channels,
    connectedWebsitesWithImage: websites,
  },
} satisfies Meta<typeof AuthorAvatarActions>;

export default meta;

type Story = StoryObj<typeof meta>;

/** All four avatar-source buttons: website, biography, a connected channel, and a connected site. */
export const Default: Story = {};

/** Only the website/biography fetch buttons — no connected channels or sites. */
export const NoConnectedSources: Story = {
  args: {
    connectedChannelsWithImage: [],
    connectedWebsitesWithImage: [],
  },
};

/** Busy state — every action button is disabled while an avatar fetch is in flight. */
export const Busy: Story = {
  args: {
    avatarBusy: true,
  },
};
