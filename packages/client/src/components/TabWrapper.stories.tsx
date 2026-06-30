import type { Meta, StoryObj } from "@storybook/react-vite";

import { TabWrapper } from "./TabWrapper";

interface DemoEntity {
  name: string;
}

const meta = {
  title: "Components/TabWrapper",
  component: TabWrapper<DemoEntity>,
  args: {
    entity: {
      name: "Articles",
    },
    isLoading: false,
    notFoundMessage: "That entity could not be found.",
    title: "General",
    description: "Edit the entity's name and basic details.",
    children: (entity: DemoEntity) => (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        {`Tab body for "${entity.name}" renders here.`}
      </div>
    ),
  },
} satisfies Meta<typeof TabWrapper<DemoEntity>>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The loaded state: header + the resolved entity's tab body. */
export const Default: Story = {};

/** While the entity is being fetched. */
export const Loading: Story = {
  args: {
    entity: undefined,
    isLoading: true,
  },
};

/** The entity was not found (e.g. a stale slug). */
export const NotFound: Story = {
  args: {
    entity: undefined,
    isLoading: false,
  },
};
