import type { TagNode } from "@eesimple/types";

import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TagTreeList } from "./TagTreeList";
import { makeTag } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

const openItem = vi.fn();

vi.mock("./panel/usePanelControls", () => ({
  usePanelControls: () => ({
    openItem,
  }),
}));

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

const paths = ["/bookmarks", "/tags/$tagSlug", "/tags/$tagSlug/info", "/tags/$tagSlug/edit/general"];

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
    expect(edit).toHaveAttribute("href", "/tags/dev/edit/general");
    expect(screen.getByLabelText("Edit tools")).toBeInTheDocument();
    // The leaf tag "tools" has no expand/collapse control.
    expect(screen.queryByLabelText("Expand tools")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Collapse tools")).not.toBeInTheDocument();
  });

  it("does not open the panel on a plain edit click (the link navigates to the edit page)", async () => {
    openItem.mockClear();
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
    screen.getByLabelText("Edit dev").click();
    expect(openItem).not.toHaveBeenCalled();
  });

  it("opens the panel in edit mode when the edit link is alt-clicked", async () => {
    openItem.mockClear();
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
    fireEvent.click(screen.getByLabelText("Edit dev"), {
      altKey: true,
    });
    expect(openItem).toHaveBeenCalledWith("tag", "dev", "edit");
  });

  it("does not open the panel on a plain name click (the link navigates to the filtered bookmarks)", async () => {
    openItem.mockClear();
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
    screen.getByRole("link", {
      name: "dev",
    }).click();
    expect(openItem).not.toHaveBeenCalled();
  });

  it("opens the panel in view mode when the Info button is alt-clicked", async () => {
    openItem.mockClear();
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
    fireEvent.click(screen.getByLabelText("View dev"), {
      altKey: true,
    });
    expect(openItem).toHaveBeenCalledWith("tag", "dev", "view");
  });
});
