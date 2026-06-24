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
    description: "Choose how each taxonomy browser appears in the left sidebar.",
    items,
    hiddenItems: [],
    seeMoreItems: [],
    onSetMode: () => {},
  },
} satisfies Meta<typeof SidebarItemsCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ThreeState: Story = {
  render: () => <ThreeStateControlled />,
};

export const TwoState: Story = {
  name: "Two-state (Management)",
  render: () => <TwoStateControlled />,
};

function ThreeStateControlled() {
  const [hidden, setHidden] = useState<string[]>([]);
  const [seeMore, setSeeMore] = useState<string[]>(["youtube-channels"]);
  return (
    <div className="w-96">
      <SidebarItemsCard
        title="Taxonomies"
        description="Choose how each taxonomy browser appears in the left sidebar."
        items={items}
        hiddenItems={hidden}
        seeMoreItems={seeMore}
        onSetMode={(key, mode) => {
          setHidden(prev =>
            mode === "hidden" ? [...prev.filter(k => k !== key), key] : prev.filter(k => k !== key));
          setSeeMore(prev =>
            mode === "see-more" ? [...prev.filter(k => k !== key), key] : prev.filter(k => k !== key));
        }}
      />
    </div>
  );
}

function TwoStateControlled() {
  const [hidden, setHidden] = useState<string[]>([]);
  return (
    <div className="w-80">
      <SidebarItemsCard
        title="Management"
        description="Choose which management pages appear in the left sidebar."
        items={[
          {
            key: "categories",
            label: "Categories",
          },
          {
            key: "tags",
            label: "Tags",
          },
        ]}
        hiddenItems={hidden}
        onSetMode={(key, mode) => {
          setHidden(prev =>
            mode === "hidden" ? [...prev.filter(k => k !== key), key] : prev.filter(k => k !== key));
        }}
      />
    </div>
  );
}
