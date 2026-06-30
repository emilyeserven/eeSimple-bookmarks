import type { ConditionTree } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { ImportConditionsField } from "./ImportConditionsField";
import { apiHandlers } from "../../test-utils/story-mocks";

const meta = {
  title: "Components/Conditions/ImportConditionsField",
  component: ImportConditionsField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    value: {
      type: "group",
      combinator: "and",
      children: [],
    },
    onChange: () => {},
  },
  decorators: [Story => (
    <div className="max-w-xl">
      <Story />
    </div>
  )],
} satisfies Meta<typeof ImportConditionsField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Only URL / Title / Website sections — everything else is hidden for imports. */
export const Empty: Story = {
  render: () => (
    <Controlled
      initial={{
        type: "group",
        combinator: "and",
        children: [],
      }}
    />
  ),
};

/** A URL "contains" match pre-fills the URL section. */
export const WithUrlMatch: Story = {
  render: () => (
    <Controlled
      initial={{
        type: "group",
        combinator: "and",
        children: [
          {
            type: "match",
            field: "url",
            operator: "contains",
            pattern: "github.com",
          },
        ],
      }}
    />
  ),
};

function Controlled({
  initial,
}: { initial: ConditionTree }) {
  const [value, setValue] = useState<ConditionTree>(initial);
  return (
    <ImportConditionsField
      value={value}
      onChange={setValue}
    />
  );
}
