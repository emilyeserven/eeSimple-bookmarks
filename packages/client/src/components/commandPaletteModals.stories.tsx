import type { useBookmarkTaxonomyContext } from "./useBookmarkTaxonomyContext";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { CommandPaletteModals } from "./commandPaletteModals";
import { apiHandlers } from "../test-utils/story-mocks";

const updateBookmark = {
  mutate: () => {},
} as unknown as ReturnType<typeof useBookmarkTaxonomyContext>["updateBookmark"];

const meta = {
  title: "Components/CommandPaletteModals",
  component: CommandPaletteModals,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    addBookmarkOpen: false,
    setAddBookmarkOpen: () => {},
    pendingUrl: "",
    createKind: null,
    assignOnCreate: false,
    closeCreate: () => {},
    bookmarkId: null,
    bookmark: undefined,
    updateBookmark,
  },
} satisfies Meta<typeof CommandPaletteModals>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Nothing open — every modal is dormant. */
export const Closed: Story = {};

/** The inline "Add new category" modal opened from the palette. */
export const AddCategoryOpen: Story = {
  args: {
    createKind: "category",
  },
};

/** The full Add Bookmark draft modal opened from the palette. */
export const AddBookmarkOpen: Story = {
  args: {
    addBookmarkOpen: true,
  },
};
