import type { useAutoFetchImages, useAutoFetchWithFallback, useScanBucket } from "../hooks/useGallery";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { GalleryToolbar } from "./GalleryToolbar";

/** A minimal idle mutation-result stub (only the fields the toolbar reads). */
function mutationStub(overrides: Record<string, unknown> = {}) {
  return {
    mutate: () => {},
    isPending: false,
    data: undefined,
    ...overrides,
  };
}

const scan = mutationStub() as unknown as ReturnType<typeof useScanBucket>;
const autoFetch = mutationStub() as unknown as ReturnType<typeof useAutoFetchImages>;
const autoFetchWithFallback
  = mutationStub() as unknown as ReturnType<typeof useAutoFetchWithFallback>;

const meta = {
  title: "Components/GalleryToolbar",
  component: GalleryToolbar,
  args: {
    view: "grid",
    onViewChange: () => {},
    layout: "natural",
    onLayoutChange: () => {},
    scan,
    autoFetch,
    autoFetchRunning: false,
    autoFetchWithFallback,
    autoFetchWithFallbackRunning: false,
    pendingAutoFetchCount: 0,
  },
} satisfies Meta<typeof GalleryToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The grid toolbar: scan + view toggle + layout toggle. */
export const Default: Story = {};

/** With missing-image work pending — adds the "Fetch missing images" buttons + estimate. */
export const WithPendingAutoFetch: Story = {
  args: {
    pendingAutoFetchCount: 12,
  },
};

/** The table view hides the natural/square layout toggle. */
export const TableView: Story = {
  args: {
    view: "table",
  },
};

/** A scan in progress (spinner + "Scanning…"). */
export const Scanning: Story = {
  args: {
    scan: mutationStub({
      isPending: true,
    }) as unknown as ReturnType<typeof useScanBucket>,
  },
};
