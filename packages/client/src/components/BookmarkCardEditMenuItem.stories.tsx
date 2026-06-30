import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkCardEditMenuItem } from "./BookmarkCardEditMenuItem";
import { apiHandlers } from "../test-utils/story-mocks";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const meta = {
  title: "Components/BookmarkCardEditMenuItem",
  component: BookmarkCardEditMenuItem,
  args: {
    bookmarkId: "bookmark-github",
  },
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  render: args => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <BookmarkCardEditMenuItem {...args} />
      </DropdownMenuContent>
    </DropdownMenu>
  ),
} satisfies Meta<typeof BookmarkCardEditMenuItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
