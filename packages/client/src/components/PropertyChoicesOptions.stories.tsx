import type { PropertyFormValues } from "./propertyFormSchema";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ChoicesOptions } from "./PropertyChoicesOptions";
import { CREATE_DEFAULTS, propertySchema } from "./propertyFormSchema";
import { useAppForm } from "../lib/form";

/** Mounts a real property `useAppForm` instance so the choices section can render in isolation. */
function ChoicesOptionsHost({
  full,
}: {
  full: boolean;
}) {
  const defaultValues: PropertyFormValues = {
    ...CREATE_DEFAULTS,
    type: "choices",
    choicesDisplay: "dropdown",
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
        isDefault: true,
      },
    ],
  };
  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: propertySchema,
    },
  });
  return (
    <ChoicesOptions
      form={form}
      idPrefix="story"
      defaultOpen
      full={full}
    />
  );
}

const meta = {
  title: "Components/ChoicesOptions",
  component: ChoicesOptions,
} satisfies Meta<typeof ChoicesOptions>;

export default meta;

type Story = StoryObj;

/** The collapsible "Choices Options" section wired to a live property form with three choices. */
export const Default: Story = {
  render: () => <ChoicesOptionsHost full={false} />,
};

/** The "full" variant, prefixed by a separator (as in the full property form). */
export const Full: Story = {
  render: () => <ChoicesOptionsHost full />,
};
