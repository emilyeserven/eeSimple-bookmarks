import type { TagNode } from "@eesimple/types";
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TagDrawer } from "./TagDrawer";

import { Button } from "@/components/ui/button";

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

function withClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

const parent = tree[0];

describe("TagDrawer", () => {
  it("opens in view mode and shows read-only tag info", () => {
    render(
      withClient(
        <TagDrawer
          node={parent}
          allTags={tree}
        >
          <Button>Open</Button>
        </TagDrawer>,
      ),
    );

    fireEvent.click(screen.getByRole("button", {
      name: "Open",
    }));

    // View mode exposes an Edit button, not form controls.
    expect(screen.getByRole("button", {
      name: "Edit",
    })).toBeInTheDocument();
    expect(screen.queryByLabelText("Parent")).not.toBeInTheDocument();
  });

  it("swaps to an edit form when Edit is clicked", () => {
    render(
      withClient(
        <TagDrawer
          node={parent}
          allTags={tree}
        >
          <Button>Open</Button>
        </TagDrawer>,
      ),
    );

    fireEvent.click(screen.getByRole("button", {
      name: "Open",
    }));
    fireEvent.click(screen.getByRole("button", {
      name: "Edit",
    }));

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Parent")).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Save",
    })).toBeInTheDocument();
  });

  it("lists children in a table and opens a nested drawer for a child", () => {
    render(
      withClient(
        <TagDrawer
          node={parent}
          allTags={tree}
        >
          <Button>Open</Button>
        </TagDrawer>,
      ),
    );

    fireEvent.click(screen.getByRole("button", {
      name: "Open",
    }));

    const childCell = screen.getByRole("cell", {
      name: "tools",
    });
    fireEvent.click(childCell);

    // The nested drawer renders the child as its own title (in addition to the row).
    expect(screen.getAllByText("tools").length).toBeGreaterThan(1);
  });
});
