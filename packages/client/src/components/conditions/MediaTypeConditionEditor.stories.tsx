import type { MediaTypeCondition } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { MediaTypeConditionEditor } from "./MediaTypeConditionEditor";
import { apiHandlers } from "../../test-utils/story-mocks";

const meta = {
  title: "Components/Conditions/MediaTypeConditionEditor",
  component: MediaTypeConditionEditor,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    value: {
      type: "media-type",
      mediaTypeIds: [],
    },
    onChange: () => {},
  },
} satisfies Meta<typeof MediaTypeConditionEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => <Controlled initial={[]} />,
};

export const WithSelection: Story = {
  render: () => <Controlled initial={["media-video"]} />,
};

function Controlled({
  initial,
}: { initial: string[] }) {
  const [value, setValue] = useState<MediaTypeCondition>({
    type: "media-type",
    mediaTypeIds: initial,
  });
  return (
    <div className="w-80">
      <MediaTypeConditionEditor
        value={value}
        onChange={setValue}
      />
    </div>
  );
}
