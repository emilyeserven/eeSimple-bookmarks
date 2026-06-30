import type { CardOverlayItem } from "./CardImageOverlays";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkCardImage } from "./BookmarkCardImage";
import { makeBookmark } from "../test-utils/factories";

import { Badge } from "@/components/ui/badge";

const bookmarkWithImage = makeBookmark({
  id: "bookmark-image",
  title: "A bookmark with an image",
  image: {
    id: "bookmark-image-img",
    url: "https://placehold.co/600x400/png",
    width: 600,
    height: 400,
    source: "upload",
    isMain: true,
    sortOrder: 0,
  },
});

/** Two sample corner overlays so the overlaid-fields layout is visible in the story. */
const overlayItems: CardOverlayItem[] = [
  {
    key: "top-left",
    corner: "top-left",
    scale: 1,
    mobileScale: null,
    node: <Badge variant="secondary">Article</Badge>,
  },
  {
    key: "bottom-right",
    corner: "bottom-right",
    scale: 1,
    mobileScale: null,
    node: <Badge variant="secondary">★ 4.5</Badge>,
  },
];

const meta = {
  title: "Bookmarks/BookmarkCardImage",
  component: BookmarkCardImage,
  args: {
    bookmark: bookmarkWithImage,
    imageLeft: false,
    imageMode: "natural",
    overlayItems: [],
  },
} satisfies Meta<typeof BookmarkCardImage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithOverlays: Story = {
  args: {
    overlayItems,
  },
};

export const ImageLeft: Story = {
  args: {
    imageLeft: true,
    overlayItems,
  },
};
