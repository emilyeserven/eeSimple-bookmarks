import type { TagCondition, TagNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { TagConditionEditor } from "./TagConditionEditor";
import { makeTag } from "../../test-utils/factories";

function tag(id: string, name: string, children: TagNode[] = []): TagNode {
  return {
    ...makeTag({
      id,
      name,
      slug: id,
    }),
    children,
  };
}

const tagTree: TagNode[] = [
  tag("dev", "Development", [tag("ts", "TypeScript"), tag("rust", "Rust")]),
  tag("design", "Design"),
];

const meta = {
  title: "Components/Conditions/TagConditionEditor",
  component: TagConditionEditor,
  args: {
    value: {
      type: "tag",
      tagIds: [],
    },
    tagTree,
    onChange: () => {},
  },
} satisfies Meta<typeof TagConditionEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => <Controlled initial={[]} />,
};

export const WithSelection: Story = {
  render: () => <Controlled initial={["dev"]} />,
};

function Controlled({
  initial,
}: { initial: string[] }) {
  const [value, setValue] = useState<TagCondition>({
    type: "tag",
    tagIds: initial,
  });
  return (
    <div className="w-80">
      <TagConditionEditor
        value={value}
        tagTree={tagTree}
        onChange={setValue}
      />
    </div>
  );
}
