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

export const AdvancedFields: Story = {};

export const WithValues: Story = {
  args: {
    numberInputs: {
      "prop-priority": "8",
      "prop-effort": "3",
    },
  },
};

export const StackedLayout: Story = {
  args: {
    layout: "stack",
  },
};

export const DefaultPlacement: Story = {
  args: {
    categoryId: "cat-content",
    placement: "default",
    booleanInputs: {
      "prop-reviewed": true,
    },
  },
};
