import type { PropertyCondition } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { PropertyConditionRow } from "./propertyConditionRows";
import { makeCategory, makeCustomProperty } from "../../test-utils/factories";

const categories = [
  makeCategory({
    id: "cat-articles",
    name: "Articles",
    slug: "articles",
  }),
];

const numberProperty = makeCustomProperty({
  id: "p-price",
  name: "Price",
  slug: "price",
  type: "number",
  numberMin: 0,
  numberMax: 500,
  categoryIds: ["cat-articles"],
});

const booleanProperty = makeCustomProperty({
  id: "p-favorite",
  name: "Favorite",
  slug: "favorite",
  type: "boolean",
  categoryIds: ["cat-articles"],
});

const meta = {
  title: "Components/Conditions/PropertyConditionRow",
  component: PropertyConditionRow,
  args: {
    property: numberProperty,
    condition: undefined,
    categories,
    onChange: () => {},
  },
  decorators: [Story => (
    <div className="max-w-md">
      <Story />
    </div>
  )],
} satisfies Meta<typeof PropertyConditionRow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A number property: the mode select offers Any / In range / Has value / Missing. */
export const NumberAny: Story = {
  render: () => <Controlled property={numberProperty} />,
};

/** A number property pre-set to an "In range" predicate, revealing the slider. */
export const NumberInRange: Story = {
  render: () => (
    <Controlled
      property={numberProperty}
      initial={{
        type: "property",
        propertyId: numberProperty.id,
        predicate: {
          valueKind: "number",
          predicate: {
            kind: "range",
            min: 50,
            max: 200,
          },
        },
      }}
    />
  ),
};

/** A boolean property dispatches to the Yes/No presence row. */
export const Boolean: Story = {
  render: () => <Controlled property={booleanProperty} />,
};

function Controlled({
  property,
  initial,
}: {
  property: typeof numberProperty;
  initial?: PropertyCondition;
}) {
  const [condition, setCondition] = useState<PropertyCondition | undefined>(initial);
  return (
    <PropertyConditionRow
      property={property}
      condition={condition}
      categories={categories}
      onChange={next => setCondition(next ?? undefined)}
    />
  );
}
