import type { CategoryCondition } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { CategoryConditionEditor } from "./CategoryConditionEditor";
import { makeCategory } from "../../test-utils/factories";

const categories = [
  makeCategory({
    id: "c1",
    name: "Reading",
  }),
  makeCategory({
    id: "c2",
    name: "Watch Later",
  }),
  makeCategory({
    id: "c3",
    name: "Reference",
  }),
];

const meta = {
  title: "Components/Conditions/CategoryConditionEditor",
  component: CategoryConditionEditor,
  args: {
    value: {
      type: "category",
      categoryIds: [],
    },
    categories,
    onChange: () => {},
  },
} satisfies Meta<typeof CategoryConditionEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => <Controlled initial={[]} />,
};

export const WithSelection: Story = {
  render: () => <Controlled initial={["c1", "c3"]} />,
};

function Controlled({
  initial,
}: { initial: string[] }) {
  const [value, setValue] = useState<CategoryCondition>({
    type: "category",
    categoryIds: initial,
  });
  return (
    <div className="w-80">
      <CategoryConditionEditor
        value={value}
        categories={categories}
        onChange={setValue}
      />
    </div>
  );
}
