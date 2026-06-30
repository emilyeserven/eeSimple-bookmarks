import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyGeneralEditForm } from "./PropertyGeneralEditForm";
import { makeCustomProperty } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const property = makeCustomProperty({
  id: "prop-priority",
  name: "Priority",
  slug: "priority",
  type: "number",
  description: "How urgent this is.",
});

const meta = {
  title: "Components/PropertyGeneralEditForm",
  component: PropertyGeneralEditForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    property,
  },
} satisfies Meta<typeof PropertyGeneralEditForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Name, status, and description — each auto-saves (Type is immutable, so it is disabled). */
export const Default: Story = {};

/** A built-in property — the active checkbox is locked and a hint explains why. */
export const BuiltIn: Story = {
  args: {
    property: {
      ...property,
      name: "Date Posted",
      slug: "date-posted",
      builtIn: true,
    },
  },
};
