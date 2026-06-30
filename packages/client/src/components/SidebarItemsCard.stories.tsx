import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import {
  Clapperboard,
  Globe,
  MonitorPlay,
  Tags,
} from "lucide-react";

import { SidebarItemsCard } from "./SidebarItemsCard";

const items = [
  {
    key: "tags",
    label: "Tags",
    icon: Tags,
  },
  {
    key: "websites",
    label: "Websites",
    icon: Globe,
  },
  {
    key: "media-types",
    label: "Media Types",
    icon: Clapperboard,
  },
  {
    key: "youtube-channels",
    label: "YouTube Channels",
    icon: MonitorPlay,
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
