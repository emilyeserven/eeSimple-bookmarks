import type { Meta, StoryObj } from "@storybook/react-vite";

import { PersonGeneralForm } from "./PersonGeneralForm";
import { makePerson } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

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
  ],
});

const meta = {
  title: "Components/PersonGeneralForm",
  component: PersonGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    person,
  },
} satisfies Meta<typeof PersonGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Person General edit tab — name, URLs, avatar, and social links, all auto-saving. */
export const Default: Story = {};
