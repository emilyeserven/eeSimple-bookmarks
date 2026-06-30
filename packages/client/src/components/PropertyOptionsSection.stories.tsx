import type { CustomPropertyType } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { CREATE_DEFAULTS, propertySchema } from "./propertyFormSchema";
import { PropertyOptionsSection } from "./PropertyOptionsSection";
import { useAppForm } from "../lib/form";

/** Mounts a real property `useAppForm` instance seeded to a given type so the section renders. */
function PropertyOptionsSectionHost({
  type,
}: {
  type: CustomPropertyType;
}) {
  const form = useAppForm({
    defaultValues: {
      ...CREATE_DEFAULTS,
      type,
    },
    validators: {
      onChange: propertySchema,
    },
  });
  return (
    <PropertyOptionsSection
      form={form}
      idPrefix="story"
      mode="create"
      numberProperties={[]}
      full={false}
    />
  );
}

const meta = {
  title: "Components/PropertyOptionsSection",
  component: PropertyOptionsSection,
} satisfies Meta<typeof PropertyOptionsSection>;

export default meta;

type Story = StoryObj;

/** The Number type-specific options — slider range, units, labels, and format. */
export const NumberType: Story = {
  render: () => <PropertyOptionsSectionHost type="number" />,
};

/** The Boolean options — value-display preset plus a live preview. */
export const BooleanType: Story = {
  render: () => <PropertyOptionsSectionHost type="boolean" />,
};

/** The rating-scale options — star scale, half-ratings, and label toggles. */
export const RatingType: Story = {
  render: () => <PropertyOptionsSectionHost type="ratingScale" />,
};
