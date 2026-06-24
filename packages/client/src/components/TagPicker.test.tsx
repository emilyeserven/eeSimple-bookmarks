import type { TagNode } from "@eesimple/types";

import { fireEvent, render, screen } from "@testing-library/react";
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
  it("renders the trigger button with placeholder when nothing is selected", () => {
    render(
      <TagPicker
        tree={tree}
        selectedIds={[]}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Select tags…");
  });

  it("trigger summarises the selected tag name", () => {
    render(
      <TagPicker
        tree={tree}
        selectedIds={["tools"]}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("tools");
  });

  it("calls onToggle with the tag id when an item is selected", () => {
    const onToggle = vi.fn();
    render(
      <TagPicker
        tree={tree}
        selectedIds={[]}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", {
      name: "dev",
    }));
    expect(onToggle).toHaveBeenCalledWith("dev");
  });

  it("shows empty state when tree is empty", () => {
    render(
      <TagPicker
        tree={[]}
        selectedIds={[]}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("No tags yet. Create some on the Tags page.")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
