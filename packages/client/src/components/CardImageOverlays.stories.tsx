import type { CardOverlayItem } from "./CardImageOverlays";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { CardImageOverlays } from "./CardImageOverlays";

import { Badge } from "@/components/ui/badge";

function badge(label: string) {
  return <Badge variant="secondary">{label}</Badge>;
}

const items: CardOverlayItem[] = [
  {
    key: "media",
    corner: "top-left",
    scale: 1,
    mobileScale: null,
    node: badge("Article"),
  },
  {
    key: "new",
    corner: "top-right",
    scale: 1.5,
    mobileScale: null,
    node: badge("New"),
  },
  {
    key: "rating",
    corner: "bottom-left",
    scale: 1,
    mobileScale: null,
    node: badge("★ 4.5"),
  },
  {
    key: "pages",
    corner: "bottom-right",
    scale: 1,
    mobileScale: null,
    node: badge("320 pages"),
  },
];

/** Renders inside a relative-positioned faux card image so the corner overlays anchor correctly. */
function ImageFrame({
  children,
}: { children: React.ReactNode }) {
  return (
    <div
      className="
        relative h-48 w-72 overflow-hidden rounded-lg bg-linear-to-br
        from-slate-300 to-slate-500
      "
    >
      {children}
    </div>
  );
}

const meta = {
  title: "Components/CardImageOverlays",
  component: CardImageOverlays,
  render: args => (
    <ImageFrame>
      <CardImageOverlays {...args} />
    </ImageFrame>
  ),
  args: {
    items,
  },
} satisfies Meta<typeof CardImageOverlays>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A badge overlaid in each of the four image corners. */
export const Default: Story = {};

/** Two items stacked in a single corner. */
export const StackedCorner: Story = {
  args: {
    items: [
      {
        key: "a",
        corner: "top-left",
        scale: 1,
        mobileScale: null,
        node: badge("Article"),
      },
      {
        key: "b",
        corner: "top-left",
        scale: 1,
        mobileScale: null,
        node: badge("Featured"),
      },
    ],
  },
};

/** A single enlarged (2×) overlay. */
export const Enlarged: Story = {
  args: {
    items: [
      {
        key: "rating",
        corner: "bottom-right",
        scale: 2,
        mobileScale: null,
        node: badge("★ 5.0"),
      },
    ],
  },
};
