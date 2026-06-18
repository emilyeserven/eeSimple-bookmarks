import type { TagNode } from "@eesimple/types";

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TagPanel } from "./TagPanel";

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

const openTag = vi.fn();
const close = vi.fn();

vi.mock("./usePanelControls", () => ({
  usePanelControls: () => ({
    openTag,
    close,
  }),
}));

const mutationStub = {
  mutate: vi.fn(),
  isError: false,
  error: null,
};

vi.mock("../../hooks/useTags", () => ({
  useTagTree: () => ({
    data: tree,
    isLoading: false,
    error: null,
  }),
  useCreateTag: () => mutationStub,
  useUpdateTag: () => mutationStub,
  useDeleteTag: () => mutationStub,
}));

describe("TagPanel", () => {
  beforeEach(() => {
    openTag.mockClear();
    close.mockClear();
  });

  it("shows read-only info and an Edit button by default", () => {
    render(<TagPanel tagId="dev" />);
    expect(screen.getByRole("button", {
      name: "Edit",
    })).toBeInTheDocument();
    expect(screen.getByText("(root)")).toBeInTheDocument();
  });

  it("swaps to the edit form when Edit is clicked", () => {
    render(<TagPanel tagId="dev" />);
    fireEvent.click(screen.getByRole("button", {
      name: "Edit",
    }));
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Save",
    })).toBeInTheDocument();
  });

  it("re-targets the panel at a child when its row is clicked", () => {
    render(<TagPanel tagId="dev" />);
    fireEvent.click(screen.getByText("tools"));
    expect(openTag).toHaveBeenCalledWith("tools");
  });

  it("renders the create form for the new sentinel", () => {
    render(<TagPanel tagId="new" />);
    expect(screen.getByRole("button", {
      name: "Add tag",
    })).toBeInTheDocument();
  });
});
