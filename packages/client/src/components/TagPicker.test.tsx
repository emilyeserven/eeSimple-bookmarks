import type { TagNode } from "@eesimple/types";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TagPicker } from "./TagPicker";
import { makeTag } from "../test-utils/factories";

const tree: TagNode[] = [
  {
    ...makeTag({
      id: "dev",
      name: "dev",
      slug: "dev",
    }),
    children: [
      {
        ...makeTag({
          id: "tools",
          name: "tools",
          slug: "tools",
          parentId: "dev",
        }),
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

  it("renders the combobox with placeholder when tree is empty", () => {
    render(
      <TagPicker
        tree={[]}
        selectedIds={[]}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Select tags…");
  });
});
