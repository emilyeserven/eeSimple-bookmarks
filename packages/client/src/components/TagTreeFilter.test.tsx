import type { TagNode } from "@eesimple/types";
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TagTreeFilter } from "./TagTreeFilter";
import { makeTag } from "../test-utils/factories";

/** Render under a QueryClient so the component's display-preference query (sort toggle) resolves. */
function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

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

describe("TagTreeFilter", () => {
  it("calls onSelect with a tag id when a tag is clicked", () => {
    const onSelect = vi.fn();
    renderWithClient(
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
    renderWithClient(
      <TagTreeFilter
        tree={tree}
        activeId="dev"
        onSelect={onSelect}
      />,
    );
    screen.getByRole("button", {
      name: "All tags",
    }).click();
    expect(onSelect).toHaveBeenCalledWith(undefined);
  });

  it("renders nothing when the tree is empty", () => {
    const {
      container,
    } = renderWithClient(
      <TagTreeFilter
        tree={[]}
        onSelect={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
