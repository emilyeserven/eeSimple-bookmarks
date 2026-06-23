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
  it("renders the title, description, and one checkbox per item", () => {
    render(
      <SidebarItemsCard
        title="Taxonomies"
        description="Pick which browsers show."
        items={items}
        hiddenItems={[]}
        onToggle={vi.fn()}
        idPrefix="taxonomy"
      />,
    );
    expect(screen.getByText("Taxonomies")).toBeInTheDocument();
    expect(screen.getByText("Pick which browsers show.")).toBeInTheDocument();
    expect(screen.getByLabelText("Tags")).toBeInTheDocument();
    expect(screen.getByLabelText("Websites")).toBeInTheDocument();
  });

  it("checks items that are NOT in hiddenItems and unchecks the hidden ones", () => {
    render(
      <SidebarItemsCard
        title="Taxonomies"
        description="d"
        items={items}
        hiddenItems={["websites"]}
        onToggle={vi.fn()}
        idPrefix="taxonomy"
      />,
    );
    expect(screen.getByLabelText("Tags")).toBeChecked();
    expect(screen.getByLabelText("Websites")).not.toBeChecked();
  });

  it("calls onToggle with the item key when a checkbox is clicked", () => {
    const onToggle = vi.fn();
    render(
      <SidebarItemsCard
        title="Taxonomies"
        description="d"
        items={items}
        hiddenItems={[]}
        onToggle={onToggle}
        idPrefix="taxonomy"
      />,
    );
    fireEvent.click(screen.getByLabelText("Websites"));
    expect(onToggle).toHaveBeenCalledWith("websites");
  });

  it("namespaces checkbox ids by idPrefix", () => {
    render(
      <SidebarItemsCard
        title="Management"
        description="d"
        items={[{
          key: "tags",
          label: "Tags",
        }]}
        hiddenItems={[]}
        onToggle={vi.fn()}
        idPrefix="management"
      />,
    );
    expect(screen.getByLabelText("Tags")).toHaveAttribute("id", "show-management-tags");
  });
});
