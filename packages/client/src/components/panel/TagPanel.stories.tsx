import type { Meta, StoryObj } from "@storybook/react-vite";

import { TagCreateForm } from "./TagPanel";
import { apiHandlers } from "../../test-utils/story-mocks";

const meta = {
  title: "Components/Panel/TagCreateForm",
  component: TagCreateForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  render: () => (
    <div className="w-96">
      <TagCreateForm />
    </div>
  ),
} satisfies Meta<typeof TagCreateForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
