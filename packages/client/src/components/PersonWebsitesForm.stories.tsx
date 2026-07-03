import type { Meta, StoryObj } from "@storybook/react-vite";

import { PersonWebsitesForm, PersonWebsitesView } from "./PersonWebsitesForm";
import { makePerson } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const person = makePerson({
  id: "person-1",
  name: "Kyle Simpson",
  slug: "kyle-simpson",
  bookmarkCount: 9,
  websiteIds: ["site-github"],
});

const meta = {
  title: "Components/PersonWebsitesForm",
  component: PersonWebsitesForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    person,
  },
} satisfies Meta<typeof PersonWebsitesForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one website already connected. */
export const Default: Story = {};

/** No connections selected yet. */
export const NoneConnected: Story = {
  args: {
    person: {
      ...person,
      websiteIds: [],
    },
  },
};

/** Read-only view of the connected websites. */
export const ReadOnlyView: Story = {
  render: () => <PersonWebsitesView person={person} />,
};
