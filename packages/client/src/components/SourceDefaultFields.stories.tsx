import type { Meta, StoryObj } from "@storybook/react-vite";

import { SourceDefaultFields } from "./SourceDefaultFields";

const categoryOptions = [
  {
    value: "cat-1",
    label: "Articles",
  },
  {
    value: "cat-2",
    label: "Videos",
  },
  {
    value: "cat-3",
    label: "Podcasts",
  },
];
const mediaTypeOptions = [
  {
    value: "mt-1",
    label: "Blog",
  },
  {
    value: "mt-2",
    label: "Newsletter",
  },
];

const meta = {
  title: "Components/SourceDefaultFields",
  component: SourceDefaultFields,
  args: {
    initialCategoryId: null,
    initialMediaTypeId: null,
    categoryOptions,
    mediaTypeOptions,
    onCategoryChange: () => {},
    onMediaTypeChange: () => {},
    note: "Media type applied automatically to bookmarks saved from this site.",
  },
} satisfies Meta<typeof SourceDefaultFields>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Preselected: Story = {
  args: {
    initialCategoryId: "cat-2",
    initialMediaTypeId: "mt-1",
  },
};

export const NewsletterLabels: Story = {
  args: {
    categoryLabel: "Default category",
    mediaTypeLabel: "Default media type",
    note: "Category and media type applied automatically to bookmarks imported from this newsletter.",
  },
};
