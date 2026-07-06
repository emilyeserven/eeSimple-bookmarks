import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyFilterPill } from "./PropertyFilterPill";
import { makeCustomProperty } from "../test-utils/factories";
import { sampleBookmark, sampleProperties } from "../test-utils/story-mocks";

const booleanProperty = makeCustomProperty({
  id: "prop-reviewed",
  name: "Reviewed",
  slug: "reviewed",
  type: "boolean",
});

const dateTimeProperty = makeCustomProperty({
  id: "prop-published",
  name: "Published",
  slug: "published",
  type: "datetime",
  dateTimeFormat: "date",
});

const choicesProperty = makeCustomProperty({
  id: "prop-status",
  name: "Status",
  slug: "status",
  type: "choices",
  choicesItems: [
    {
      label: "To read",
      value: "to-read",
    },
    {
      label: "Reading",
      value: "reading",
    },
    {
      label: "Done",
      value: "done",
    },
  ],
  choicesMultiple: true,
});

const meta = {
  title: "Filters/PropertyFilterPill",
  component: PropertyFilterPill,
  args: {
    property: sampleProperties[0],
    bookmarks: [sampleBookmark],
    search: {},
    onSearchChange: () => {},
  },
} satisfies Meta<typeof PropertyFilterPill>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A number-range property — the slider bounds derive from the loaded bookmark set. */
export const NumberRange: Story = {};

/** A number-range property with an active selection — the pill fills. */
export const NumberRangeActive: Story = {
  args: {
    search: {
      num: {
        "prop-priority": [4, 8],
      },
    },
  },
};

/** A boolean property. */
export const Boolean: Story = {
  args: {
    property: booleanProperty,
  },
};

/** A datetime property. */
export const DateTime: Story = {
  args: {
    property: dateTimeProperty,
  },
};

/** A choices property — the pill's summary shows the selected count. */
export const Choices: Story = {
  args: {
    property: choicesProperty,
    search: {
      choices: {
        "prop-status": ["reading", "done"],
      },
    },
  },
};
