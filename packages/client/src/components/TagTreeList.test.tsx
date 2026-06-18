import type { TagNode } from "@eesimple/types";

import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TagTreeList } from "./TagTreeList";
import { renderWithRouter } from "../test-utils/router";

const openTag = vi.fn();

vi.mock("./panel/usePanelControls", () => ({
  usePanelControls: () => ({
    openTag,
  }),
}));

const tree: TagNode[] = [
  {
    id: "dev",
    name: "dev",
    slug: "dev",
    parentId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    children: [
      {
        id: "tools",
        name: "tools",
        slug: "tools",
        parentId: "dev",
        createdAt: "2026-06-01T00:00:00.000Z",
        children: [],
      },
    ],
  },
];

const paths = ["/tags/$tagSlug/settings"];

describe("TagTreeList", () => {
  it("keeps children hidden when the parent is collapsed", async () => {
    await renderWithRouter(
      <TagTreeList
        tree={tree}
        expanded={new Set()}
        onToggle={vi.fn()}
      />,
      {
        paths,
      },
    );
    expect(screen.getByText("dev")).toBeInTheDocument();
    expect(screen.queryByText("tools")).not.toBeInTheDocument();
  });

  it("reveals children when the parent is expanded", async () => {
    await renderWithRouter(
      <TagTreeList
        tree={tree}
        expanded={new Set(["dev"])}
        onToggle={vi.fn()}
      />,
      {
        paths,
      },
    );
    expect(screen.getByText("tools")).toBeInTheDocument();
  });

  it("calls onToggle with the tag id when its chevron is clicked", async () => {
    const onToggle = vi.fn();
    await renderWithRouter(
      <TagTreeList
        tree={tree}
        expanded={new Set()}
        onToggle={onToggle}
      />,
      {
        paths,
      },
    );
    screen.getByLabelText("Expand dev").click();
    expect(onToggle).toHaveBeenCalledWith("dev");
  });

  it("renders a quick-view button per tag and no chevron for leaf tags", async () => {
    await renderWithRouter(
      <TagTreeList
        tree={tree}
        expanded={new Set(["dev"])}
        onToggle={vi.fn()}
      />,
      {
        paths,
      },
    );
    expect(screen.getByLabelText("Quick view dev")).toBeInTheDocument();
    expect(screen.getByLabelText("Quick view tools")).toBeInTheDocument();
    // The leaf tag "tools" has no expand/collapse control.
    expect(screen.queryByLabelText("Expand tools")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Collapse tools")).not.toBeInTheDocument();
  });

  it("opens the panel at a tag when its quick-view button is clicked", async () => {
    await renderWithRouter(
      <TagTreeList
        tree={tree}
        expanded={new Set()}
        onToggle={vi.fn()}
      />,
      {
        paths,
      },
    );
    screen.getByLabelText("Quick view dev").click();
    expect(openTag).toHaveBeenCalledWith("dev");
  });
});
