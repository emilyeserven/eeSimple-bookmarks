import type { TagNode } from "@eesimple/types";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TagPicker } from "./TagPicker";

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

describe("TagPicker", () => {
  it("renders every tag in the tree, including nested ones", () => {
    render(
      <TagPicker
        tree={tree}
        selectedIds={[]}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("dev")).toBeInTheDocument();
    expect(screen.getByLabelText("tools")).toBeInTheDocument();
  });

  it("marks selected tags as checked", () => {
    render(
      <TagPicker
        tree={tree}
        selectedIds={["tools"]}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("tools")).toBeChecked();
    expect(screen.getByLabelText("dev")).not.toBeChecked();
  });

  it("calls onToggle with the tag id when a checkbox is clicked", () => {
    const onToggle = vi.fn();
    render(
      <TagPicker
        tree={tree}
        selectedIds={[]}
        onToggle={onToggle}
      />,
    );
    screen.getByLabelText("dev").click();
    expect(onToggle).toHaveBeenCalledWith("dev");
  });
});
