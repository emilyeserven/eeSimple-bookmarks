import type { Meta, StoryObj } from "@storybook/react-vite";

import { Loading, Problem, WithPanelItem } from "./status";

const meta = {
  title: "Components/Panel/ContentTypes/Status",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

interface Item {
  id: string;
  label: string;
}

const items: Item[] = [
  {
    id: "a",
    label: "First item",
  },
  {
    id: "b",
    label: "Second item",
  },
];

export const LoadingState: Story = {
  render: () => <Loading />,
};

export const ProblemState: Story = {
  render: () => <Problem>Something went wrong.</Problem>,
};

export const Resolved: Story = {
  render: () => (
    <WithPanelItem
      queryResult={{
        data: items,
        isLoading: false,
        error: null,
      }}
      id="a"
      notFoundMessage="Item not found."
    >
      {item => <p className="text-sm">Resolved: {item.label}</p>}
    </WithPanelItem>
  ),
};

export const NotFound: Story = {
  render: () => (
    <WithPanelItem
      queryResult={{
        data: items,
        isLoading: false,
        error: null,
      }}
      id="missing"
      notFoundMessage="Item not found."
    >
      {item => <p className="text-sm">Resolved: {item.label}</p>}
    </WithPanelItem>
  ),
};
