import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { SidebarItemsCard } from "./SidebarItemsCard";

const items = [
  {
    key: "tags",
    label: "Tags",
  },
  {
    key: "websites",
    label: "Websites",
  },
  {
    key: "media-types",
    label: "Media Types",
  },
  {
    key: "youtube-channels",
    label: "YouTube Channels",
  },
];

const meta = {
  title: "Components/SidebarItemsCard",
  component: SidebarItemsCard,
  args: {
    title: "Taxonomies",
    description: "Choose which taxonomy browsers appear in the left sidebar.",
    items,
    hiddenItems: [],
    onToggle: () => {},
    idPrefix: "taxonomy",
  },
} satisfies Meta<typeof SidebarItemsCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllVisible: Story = {
  render: () => <Controlled initial={[]} />,
};

export const SomeHidden: Story = {
  render: () => <Controlled initial={["websites", "youtube-channels"]} />,
};

function Controlled({
  initial,
}: { initial: string[] }) {
  const [hidden, setHidden] = useState<string[]>(initial);
  return (
    <div className="w-80">
      <SidebarItemsCard
        title="Taxonomies"
        description="Choose which taxonomy browsers appear in the left sidebar."
        items={items}
        hiddenItems={hidden}
        idPrefix="taxonomy"
        onToggle={key =>
          setHidden(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))}
      />
    </div>
  );
}
