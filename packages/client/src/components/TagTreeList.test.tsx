import type { TagNode } from "@eesimple/types";

import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TagTreeList } from "./TagTreeList";
import { makeTag } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

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

const paths = ["/bookmarks", "/tags/$tagSlug", "/tags/$tagSlug/info", "/tags/$tagSlug/edit"];

describe("TagTreeList", () => {
  it("keeps children hidden when the parent is collapsed", async () => {
    await renderWithRouter(
      <TagTreeList
        tree={tree}
        expanded={new Set()}
        onToggle={vi.fn()}
        columns={1}
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
        columns={1}
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
        columns={1}
      />,
      {
        paths,
      },
    );
    screen.getByLabelText("Expand dev").click();
    expect(onToggle).toHaveBeenCalledWith("dev");
  });

  it("renders an edit link per tag pointing at its edit page, and no chevron for leaf tags", async () => {
    await renderWithRouter(
      <TagTreeList
        tree={tree}
        expanded={new Set(["dev"])}
        onToggle={vi.fn()}
        columns={1}
      />,
      {
        paths,
      },
    );
    const edit = screen.getByLabelText("Edit dev");
    expect(edit).toBeInTheDocument();
    expect(edit).toHaveAttribute("href", "/tags/dev/edit");
    expect(screen.getByLabelText("Edit tools")).toBeInTheDocument();
    // The leaf tag "tools" has no expand/collapse control.
    expect(screen.queryByLabelText("Expand tools")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Collapse tools")).not.toBeInTheDocument();
  });

  it("links the tag name to its filtered bookmarks and the Info button to its info page", async () => {
    await renderWithRouter(
      <TagTreeList
        tree={tree}
        expanded={new Set()}
        onToggle={vi.fn()}
        columns={1}
      />,
      {
        paths,
      },
    );
    expect(screen.getByRole("link", {
      name: "dev",
    })).toBeInTheDocument();
    expect(screen.getByLabelText("View dev")).toHaveAttribute("href", "/tags/dev/info");
  });
});
