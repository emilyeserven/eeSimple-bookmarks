import type { Meta, StoryObj } from "@storybook/react-vite";

import { PersonGeneralView } from "./personViews";
import { makePerson } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";

const person = makePerson({
  id: "person-1",
  name: "Jane Doe",
  slug: "jane-doe",
  bookmarkCount: 12,
  personWebsiteUrl: "https://janedoe.example.com",
  biographyUrl: "https://en.wikipedia.org/wiki/Jane_Doe",
  socialLinks: [
    {
      platform: "x",
      url: "https://x.com/janedoe",
    },
  ],
});

const meta = {
  title: "Components/Workbench/PersonGeneralView",
  component: PersonGeneralView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof PersonGeneralView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entity: person,
  },
};

export const Minimal: Story = {
  args: {
    entity: {
      ...person,
      id: "person-2",
      name: "Anonymous",
      slug: "anonymous",
      bookmarkCount: 0,
      personWebsiteUrl: null,
      biographyUrl: null,
      socialLinks: [],
    },
  },
};
