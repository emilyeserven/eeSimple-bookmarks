import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyDisplaySection } from "./PropertyDisplaySection";
import { CREATE_DEFAULTS, propertySchema } from "./propertyFormSchema";
import { useAppForm } from "../lib/form";
import { apiHandlers } from "../test-utils/story-mocks";

const groupOptions = [
  {
    value: "group-reading",
    label: "Reading",
  },
  {
    value: "group-ratings",
    label: "Ratings",
  },
];

/** Mounts a real property `useAppForm` instance so the section renders in isolation. */
function PropertyDisplaySectionHost() {
  const form = useAppForm({
    defaultValues: CREATE_DEFAULTS,
    validators: {
      onChange: propertySchema,
    },
  });
  return (
    <PropertyDisplaySection
      form={form}
      idPrefix="story"
      groupOptions={groupOptions}
    />
  );
}

const meta = {
  title: "Components/PropertyDisplaySection",
  component: PropertyDisplaySection,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof PropertyDisplaySection>;

export default meta;

type Story = StoryObj;

/** The "Display options" section: grouping combobox, "Show in…" checkboxes, and editing toggles. */
export const Default: Story = {
  render: () => <PropertyDisplaySectionHost />,
};
