import type { WebsiteCondition } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { WebsiteConditionEditor } from "./WebsiteConditionEditor";
import { apiHandlers } from "../../test-utils/story-mocks";

const meta = {
  title: "Components/Conditions/WebsiteConditionEditor",
  component: WebsiteConditionEditor,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    value: {
      type: "website",
      domains: [],
    },
    onChange: () => {},
  },
} satisfies Meta<typeof WebsiteConditionEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => <Controlled initial={[]} />,
};

export const WithSelection: Story = {
  render: () => <Controlled initial={["github.com"]} />,
};

function Controlled({
  initial,
}: { initial: string[] }) {
  const [value, setValue] = useState<WebsiteCondition>({
    type: "website",
    domains: initial,
  });
  return (
    <div className="w-80">
      <WebsiteConditionEditor
        value={value}
        onChange={setValue}
      />
    </div>
  );
}
