import type { Meta, StoryObj } from "@storybook/react-vite";

import { PersonGeneralView } from "./personViews";
import { makePerson } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";

const person = makePerson({
  id: "person-1",
  name: "Jane Doe",
  slug: "jane-doe",
  bookmarkCount: 12,
  labeledWebsites: [
    {
      label: "Website",
      url: "https://janedoe.example.com",
      websiteId: null,
    },
    {
      label: "Biography",
      url: "https://en.wikipedia.org/wiki/Jane_Doe",
      websiteId: null,
    },
  ],
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
      labeledWebsites: [],
      socialLinks: [],
    },
  },
};
