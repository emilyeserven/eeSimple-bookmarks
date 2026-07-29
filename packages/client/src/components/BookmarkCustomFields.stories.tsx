import type { CustomPropertyInputs } from "./bookmarkFormSchema";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategoryCustomFields } from "./BookmarkCustomFields";
import {
  apiHandlers,
  sampleProperties,
} from "../test-utils/story-mocks";

const emptyInputs: CustomPropertyInputs = {
  numberInputs: {},
  booleanInputs: {},
  dateTimeInputs: {},
  choicesInputs: {},
  progressInputs: {},
  sectionsInputs: {},
  textInputs: {},
};

const noop = () => {};

const meta = {
  title: "Bookmarks/CategoryCustomFields",
  component: CategoryCustomFields,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    categoryId: "cat-workflow",
    properties: sampleProperties,
    placement: "advanced",
    ...emptyInputs,
    onNumberChange: noop,
    onBooleanChange: noop,
    onDateTimeChange: noop,
    onChoicesChange: noop,
    onProgressChange: noop,
    onSectionsChange: noop,
    onTextChange: noop,
  },
} satisfies Meta<typeof CategoryCustomFields>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The advanced-placement fields for a category, all inputs empty. */
export const AdvancedFields: Story = {};

/** Number properties pre-filled with values. */
export const WithValues: Story = {
  args: {
    numberInputs: {
      "prop-priority": "8",
      "prop-effort": "3",
    },
  },
};

/** The fields in the stacked (single-column) layout. */
export const StackedLayout: Story = {
  args: {
    layout: "stack",
  },
};

/** Default-placement fields for another category, with a boolean pre-checked. */
export const DefaultPlacement: Story = {
  args: {
    categoryId: "cat-content",
    placement: "default",
    booleanInputs: {
      "prop-reviewed": true,
    },
  },
};
