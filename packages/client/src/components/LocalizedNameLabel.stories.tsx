import type { EntityName } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocalizedNameLabel } from "./LocalizedNameLabel";

function makeName(value: string, isoCode: string, isPrimary: boolean, sortOrder: number): EntityName {
  return {
    id: `${isoCode}-${sortOrder}`,
    language: {
      id: isoCode,
      name: isoCode.toUpperCase(),
      slug: isoCode,
      isoCode,
    },
    value,
    isPrimary,
    sortOrder,
  };
}

const JA_NAMES: EntityName[] = [
  makeName("君の名は。", "ja", true, 0),
  makeName("Your Name.", "en", false, 1),
];

const meta = {
  title: "Components/LocalizedNameLabel",
  component: LocalizedNameLabel,
  args: {
    names: [],
    base: "Your Name.",
  },
} satisfies Meta<typeof LocalizedNameLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** No multilingual names — renders the plain base title. */
export const BaseOnly: Story = {
  args: {
    names: [],
    base: "The Lord of the Rings",
  },
};

/** Primary (native-script) name with a de-emphasized secondary (English) name inline. */
export const PrimaryWithSecondary: Story = {
  args: {
    names: JA_NAMES,
    base: "Your Name.",
    secondaryLanguage: {
      isoCode: "en",
    },
  },
};

/** The same names stacked onto two lines (used by location listing cards). */
export const Stacked: Story = {
  args: {
    names: JA_NAMES,
    base: "Your Name.",
    secondaryLanguage: {
      isoCode: "en",
    },
    stacked: true,
  },
};
