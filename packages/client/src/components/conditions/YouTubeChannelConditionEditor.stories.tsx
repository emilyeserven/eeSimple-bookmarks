import type { YouTubeChannelCondition } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { YouTubeChannelConditionEditor } from "./YouTubeChannelConditionEditor";
import { apiHandlers } from "../../test-utils/story-mocks";

const meta = {
  title: "Components/Conditions/YouTubeChannelConditionEditor",
  component: YouTubeChannelConditionEditor,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    value: {
      type: "youtube-channel",
      channelIds: [],
    },
    onChange: () => {},
  },
} satisfies Meta<typeof YouTubeChannelConditionEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => <Controlled initial={[]} />,
};

export const WithSelection: Story = {
  render: () => <Controlled initial={["channel-fireship"]} />,
};

function Controlled({
  initial,
}: { initial: string[] }) {
  const [value, setValue] = useState<YouTubeChannelCondition>({
    type: "youtube-channel",
    channelIds: initial,
  });
  return (
    <div className="w-80">
      <YouTubeChannelConditionEditor
        value={value}
        onChange={setValue}
      />
    </div>
  );
}
