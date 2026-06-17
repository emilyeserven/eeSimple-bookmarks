import type { TagNode } from "@eesimple/types";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TagTreeFilter } from "./TagTreeFilter";

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

describe("TagTreeFilter", () => {
  it("calls onSelect with a tag id when a tag is clicked", () => {
    const onSelect = vi.fn();
    render(
      <TagTreeFilter
        tree={tree}
        onSelect={onSelect}
      />,
    );
    screen.getByRole("button", {
      name: "dev",
    }).click();
    expect(onSelect).toHaveBeenCalledWith("dev");
  });

  it("calls onSelect with undefined when All is clicked", () => {
    const onSelect = vi.fn();
    render(
      <TagTreeFilter
        tree={tree}
        activeId="dev"
        onSelect={onSelect}
      />,
    );
    screen.getByRole("button", {
      name: "All",
    }).click();
    expect(onSelect).toHaveBeenCalledWith(undefined);
  });

  it("renders nothing when the tree is empty", () => {
    const {
      container,
    } = render(
      <TagTreeFilter
        tree={[]}
        onSelect={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
