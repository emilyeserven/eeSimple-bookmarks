import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  BooleanPropertyField,
  DateTimePropertyField,
  NumberPropertyField,
  RatingScalePropertyField,
} from "./BookmarkPropertyFields";
import { makeCustomProperty } from "../test-utils/factories";

/**
 * `BookmarkPropertyFields` exports a family of single-property edit inputs used by the bookmark
 * forms. These stories document the scalar variants; `NumberPropertyField` anchors the meta.
 */
const meta = {
  title: "Bookmarks/BookmarkPropertyFields",
  component: NumberPropertyField,
  args: {
    property: makeCustomProperty({
      id: "prop-pages",
      name: "Pages",
      slug: "pages",
      type: "number",
      unitSingular: "page",
      unitPlural: "pages",
      description: "How many pages the document has.",
    }),
    fieldId: "field-pages",
    value: "320",
    onChange: () => {},
  },
} satisfies Meta<typeof NumberPropertyField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Number: Story = {};

export const Boolean: StoryObj<typeof BooleanPropertyField> = {
  render: () => (
    <BooleanPropertyField
      property={makeCustomProperty({
        id: "prop-reviewed",
        name: "Reviewed",
        slug: "reviewed",
        type: "boolean",
        description: "Has this been reviewed?",
      })}
      fieldId="field-reviewed"
      checked={true}
      onChange={() => {}}
    />
  ),
};

export const DateTime: StoryObj<typeof DateTimePropertyField> = {
  render: () => (
    <DateTimePropertyField
      property={makeCustomProperty({
        id: "prop-published",
        name: "Published",
        slug: "published",
        type: "datetime",
        dateTimeFormat: "date",
      })}
      fieldId="field-published"
      value="2026-06-01"
      onChange={() => {}}
    />
  ),
};

export const Rating: StoryObj<typeof RatingScalePropertyField> = {
  render: () => (
    <RatingScalePropertyField
      property={makeCustomProperty({
        id: "prop-rating",
        name: "Rating",
        slug: "rating",
        type: "ratingScale",
        ratingMax: 5,
      })}
      raw="3"
      onChange={() => {}}
    />
  ),
};
