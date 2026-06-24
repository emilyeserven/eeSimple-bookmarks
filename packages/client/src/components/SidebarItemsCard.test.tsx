import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SidebarItemsCard } from "./SidebarItemsCard";

const items = [
  {
    key: "tags",
    label: "Tags",
  },
  {
    key: "websites",
    label: "Websites",
  },
];

describe("SidebarItemsCard", () => {
  it("renders the title, description, and item labels", () => {
    render(
      <SidebarItemsCard
        title="Taxonomies"
        description="Pick which browsers show."
        items={items}
        hiddenItems={[]}
        onSetMode={vi.fn()}
      />,
    );
    expect(screen.getByText("Taxonomies")).toBeInTheDocument();
    expect(screen.getByText("Pick which browsers show.")).toBeInTheDocument();
    expect(screen.getByText("Tags")).toBeInTheDocument();
    expect(screen.getByText("Websites")).toBeInTheDocument();
  });

  it("shows Default/Listing only options without seeMoreItems (2-state)", () => {
    render(
      <SidebarItemsCard
        title="Management"
        description="d"
        items={[{
          key: "tags",
          label: "Tags",
        }]}
        hiddenItems={[]}
        onSetMode={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("button", {
      name: "Default",
    })).toHaveLength(1);
    expect(screen.queryByRole("button", {
      name: "See More",
    })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", {
      name: "Listing only",
    })).toHaveLength(1);
  });

  it("shows Default/See More/Listing only options when seeMoreItems is provided (3-state)", () => {
    render(
      <SidebarItemsCard
        title="Taxonomies"
        description="d"
        items={[{
          key: "tags",
          label: "Tags",
        }]}
        hiddenItems={[]}
        seeMoreItems={[]}
        onSetMode={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", {
      name: "Default",
    })).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "See More",
    })).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Listing only",
    })).toBeInTheDocument();
  });

  it("activates 'Listing only' for items in hiddenItems", () => {
    render(
      <SidebarItemsCard
        title="Taxonomies"
        description="d"
        items={items}
        hiddenItems={["websites"]}
        seeMoreItems={[]}
        onSetMode={vi.fn()}
      />,
    );
    const listingOnlyButtons = screen.getAllByRole("button", {
      name: "Listing only",
    });
    expect(listingOnlyButtons[1]).toHaveAttribute("data-state", "on");
    const defaultButtons = screen.getAllByRole("button", {
      name: "Default",
    });
    expect(defaultButtons[0]).toHaveAttribute("data-state", "on");
  });

  it("calls onSetMode with the item key and mode when a toggle is clicked", () => {
    const onSetMode = vi.fn();
    render(
      <SidebarItemsCard
        title="Taxonomies"
        description="d"
        items={[{
          key: "websites",
          label: "Websites",
        }]}
        hiddenItems={[]}
        seeMoreItems={[]}
        onSetMode={onSetMode}
      />,
    );
    fireEvent.click(screen.getByRole("button", {
      name: "Listing only",
    }));
    expect(onSetMode).toHaveBeenCalledWith("websites", "hidden");
  });
});
