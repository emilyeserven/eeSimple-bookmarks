import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkPropertyFileField } from "./BookmarkPropertyFileField";
import { makeCustomProperty } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const fileProperty = makeCustomProperty({
  id: "prop-attachment",
  name: "Attachment",
  slug: "attachment",
  type: "file",
});

const imageProperty = makeCustomProperty({
  id: "prop-cover",
  name: "Cover image",
  slug: "cover",
  type: "image",
});

const meta = {
  title: "Bookmarks/BookmarkPropertyFileField",
  component: BookmarkPropertyFileField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmarkId: "bm-file-field",
    property: fileProperty,
    value: undefined,
  },
} satisfies Meta<typeof BookmarkPropertyFileField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EmptyFile: Story = {};

export const WithFile: Story = {
  args: {
    value: {
      propertyId: "prop-attachment",
      url: "/api/bookmarks/bm-file-field/property-file/prop-attachment?v=1",
      contentType: "application/pdf",
      byteSize: 1_258_291,
      originalFilename: "spec-sheet.pdf",
      width: null,
      height: null,
    },
  },
};

export const ImageProperty: Story = {
  args: {
    property: imageProperty,
    value: {
      propertyId: "prop-cover",
      url: "https://placehold.co/300x200/png",
      contentType: "image/webp",
      byteSize: 48_210,
      originalFilename: null,
      width: 300,
      height: 200,
    },
  },
};
