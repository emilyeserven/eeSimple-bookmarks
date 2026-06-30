import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { BookmarkView } from "./BookmarkView";
import { apiHandlers, sampleBookmark } from "../../../test-utils/story-mocks";

const meta = {
  title: "Components/Panel/ContentTypes/BookmarkView",
  component: BookmarkView,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/bookmarks", () => HttpResponse.json([sampleBookmark])),
        http.get("/api/property-groups", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
  render: args => (
    <div className="w-96">
      <BookmarkView {...args} />
    </div>
  ),
} satisfies Meta<typeof BookmarkView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: sampleBookmark.id,
  },
};

export const NotFound: Story = {
  args: {
    id: "missing-bookmark",
  },
};
