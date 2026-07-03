import type { Meta, StoryObj } from "@storybook/react-vite";

import { PersonYouTubeChannelsForm, PersonYouTubeChannelsView } from "./PersonYouTubeChannelsForm";
import { makePerson } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const person = makePerson({
  id: "person-1",
  name: "Derek Muller",
  slug: "derek-muller",
  bookmarkCount: 9,
  youtubeChannelIds: ["channel-veritasium"],
});

const meta = {
  title: "Components/PersonYouTubeChannelsForm",
  component: PersonYouTubeChannelsForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    person,
  },
} satisfies Meta<typeof PersonYouTubeChannelsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one channel already connected. */
export const Default: Story = {};

/** No connections selected yet. */
export const NoneConnected: Story = {
  args: {
    person: {
      ...person,
      youtubeChannelIds: [],
    },
  },
};

/** Read-only view of the connected channels. */
export const ReadOnlyView: Story = {
  render: () => <PersonYouTubeChannelsView person={person} />,
};
