import type { ListSelection } from "../lib/useListSelection";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategoriesTable } from "./CategoriesTable";
import { makeCategory } from "../test-utils/factories";

const data = [
  makeCategory({
    id: "default",
    name: "Default",
    slug: "default",
    builtIn: true,
    bookmarkCount: 14,
  }),
  makeCategory({
    id: "articles",
    name: "Articles",
    slug: "articles",
    bookmarkCount: 42,
  }),
  makeCategory({
    id: "videos",
    name: "Videos",
    slug: "videos",
    bookmarkCount: 7,
  }),
];

/** A non-selection selection controller (selection mode off → no bulk-select column). */
const noSelection: ListSelection = {
  selectedIds: [],
  selectedSet: new Set<string>(),
  isSelected: () => false,
  toggle: () => {},
  selectAll: () => {},
  clear: () => {},
  count: 0,
  allSelected: false,
  mode: false,
  setMode: () => {},
};

const meta = {
  title: "Components/CategoriesTable",
  component: CategoriesTable,
  args: {
    data,
    selection: noSelection,
    onView: () => {},
    onEdit: () => {},
  },
} satisfies Meta<typeof CategoriesTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Selection mode on — a leading checkbox column appears (built-in rows are not selectable). */
export const SelectionMode: Story = {
  args: {
    selection: {
      ...noSelection,
      mode: true,
    },
  },
};
