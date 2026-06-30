import type { Meta, StoryObj } from "@storybook/react-vite";

import { AllowDefaultField } from "./AllowDefaultField";
import { CREATE_DEFAULTS, propertySchema } from "./propertyFormSchema";
import { useAppForm } from "../lib/form";

/** Mounts a real property `useAppForm` instance so the field can render in isolation. */
function PropertyFormHost() {
  const form = useAppForm({
    defaultValues: CREATE_DEFAULTS,
    validators: {
      onChange: propertySchema,
    },
  });
  return (
    <AllowDefaultField
      form={form}
      idPrefix="story"
      className="space-y-2"
    />
  );
}

const meta = {
  title: "Components/AllowDefaultField",
  component: AllowDefaultField,
} satisfies Meta<typeof AllowDefaultField>;

export default meta;

type Story = StoryObj;

/** The "Allow default value" checkbox plus its hint, wired to a live property form. */
export const Default: Story = {
  render: () => <PropertyFormHost />,
};
