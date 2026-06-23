import type { MatchCondition } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { MatchConditionEditor } from "./MatchConditionEditor";

const meta = {
  title: "Components/Conditions/MatchConditionEditor",
  component: MatchConditionEditor,
  args: {
    value: {
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "",
    },
    onChange: () => {},
  },
} satisfies Meta<typeof MatchConditionEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<MatchCondition>({
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "",
    });
    return (
      <div className="w-md">
        <MatchConditionEditor
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const WithPattern: Story = {
  render: () => {
    const [value, setValue] = useState<MatchCondition>({
      type: "match",
      field: "title",
      operator: "starts_with",
      pattern: "How to",
    });
    return (
      <div className="w-md">
        <MatchConditionEditor
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};
