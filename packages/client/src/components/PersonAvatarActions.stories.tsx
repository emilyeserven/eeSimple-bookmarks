import type { usePersonAvatarField } from "./usePersonAvatarField";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PersonAvatarActions } from "./PersonAvatarActions";
import { makePerson, makeWebsite, makeYouTubeChannel } from "../test-utils/factories";

type Controller = ReturnType<typeof usePersonAvatarField>;

/** A throwaway mutation-shaped stub — the component only ever calls `.mutate()`. */
const noopMutation = {
  mutate: () => undefined,
} as unknown as Controller["autoAvatar"];

const person = makePerson({
  id: "person-1",
  name: "Jane Person",
  slug: "jane-person",
  bookmarkCount: 3,
  labeledWebsites: [
    {
      label: "Website",
      url: "https://janeperson.example.com",
      websiteId: null,
    },
    {
      label: "Biography",
      url: "https://janeperson.example.com/bio",
      websiteId: null,
    },
  ],
});

const channels = [
  makeYouTubeChannel({
    id: "channel-1",
    channelKey: "@janeperson",
    name: "Jane Person Channel",
    slug: "jane-person-channel",
  }),
];

const websites = [
  makeWebsite({
    id: "site-1",
    domain: "janeperson.example.com",
    siteName: "Jane Person",
    slug: "jane-person",
  }),
];

const meta = {
  title: "Components/PersonAvatarActions",
  component: PersonAvatarActions,
  args: {
    person,
    avatarBusy: false,
    autoAvatar: noopMutation,
    adoptChannel: noopMutation as unknown as Controller["adoptChannel"],
    adoptWebsite: noopMutation as unknown as Controller["adoptWebsite"],
    connectedChannelsWithImage: channels,
    connectedWebsitesWithImage: websites,
  },
} satisfies Meta<typeof PersonAvatarActions>;

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
