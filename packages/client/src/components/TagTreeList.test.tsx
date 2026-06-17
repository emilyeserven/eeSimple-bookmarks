import type { TagNode } from "@eesimple/types";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TagTreeList } from "./TagTreeList";

const tree: TagNode[] = [
  {
    id: "dev",
    name: "dev",
    parentId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    children: [
      {
        id: "tools",
        name: "tools",
        parentId: "dev",
        createdAt: "2026-06-01T00:00:00.000Z",
        children: [],
      },
    ],
  },
];

describe("TagTreeList", () => {
  it("keeps children hidden when the parent is collapsed", () => {
    render(
      <TagTreeList
        tree={tree}
        expanded={new Set()}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("dev")).toBeInTheDocument();
    expect(screen.queryByText("tools")).not.toBeInTheDocument();
  });

  it("reveals children when the parent is expanded", () => {
    render(
      <TagTreeList
        tree={tree}
        expanded={new Set(["dev"])}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("tools")).toBeInTheDocument();
  });

  it("calls onToggle with the tag id when its chevron is clicked", () => {
    const onToggle = vi.fn();
    render(
      <TagTreeList
        tree={tree}
        expanded={new Set()}
        onToggle={onToggle}
      />,
    );
    screen.getByLabelText("Expand dev").click();
    expect(onToggle).toHaveBeenCalledWith("dev");
  });

  it("renders a View button per tag and no chevron for leaf tags", () => {
    render(
      <TagTreeList
        tree={tree}
        expanded={new Set(["dev"])}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("View dev")).toBeInTheDocument();
    expect(screen.getByLabelText("View tools")).toBeInTheDocument();
    // The leaf tag "tools" has no expand/collapse control.
    expect(screen.queryByLabelText("Expand tools")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Collapse tools")).not.toBeInTheDocument();
  });
});
