import { defaultCardZoneLayouts } from "@eesimple/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CardZoneLayoutControls } from "./CardZoneLayoutControls";

describe("CardZoneLayoutControls", () => {
  it("renders the three configurable body zones (Table is excluded)", () => {
    render(
      <CardZoneLayoutControls
        value={defaultCardZoneLayouts()}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Single column top")).toBeInTheDocument();
    expect(screen.getByText("Labels")).toBeInTheDocument();
    expect(screen.getByText("Single column bottom")).toBeInTheDocument();
    expect(screen.queryByText("Table")).not.toBeInTheDocument();
  });

  it("exposes the icon-only alignment/direction toggles by their accessible names", () => {
    render(
      <CardZoneLayoutControls
        value={defaultCardZoneLayouts()}
        onChange={vi.fn()}
      />,
    );
    // Three flex zones, each with a Direction group → three "Row"/"Column" buttons.
    expect(screen.getAllByRole("radio", {
      name: "Row",
    })).toHaveLength(3);
    expect(screen.getAllByRole("radio", {
      name: "Column",
    })).toHaveLength(3);
    expect(screen.getAllByRole("radio", {
      name: "Wrap",
    })).toHaveLength(3);
    expect(screen.getAllByRole("radio", {
      name: "Between",
    })).toHaveLength(3);
  });

  it("renders the example-count preview toggle (2 or 3)", () => {
    render(
      <CardZoneLayoutControls
        value={defaultCardZoneLayouts()}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("radio", {
      name: "2",
    })).toBeInTheDocument();
    expect(screen.getByRole("radio", {
      name: "3",
    })).toBeInTheDocument();
  });

  it("patches a zone's layout when a toggle is clicked", () => {
    const onChange = vi.fn();
    render(
      <CardZoneLayoutControls
        value={defaultCardZoneLayouts()}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getAllByRole("radio", {
      name: "Column",
    })[0]);
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0];
    // Exactly one zone flipped to direction: column.
    const changed = Object.values(next).filter(layout => (layout as { direction?: string }).direction === "column");
    expect(changed).toHaveLength(1);
  });
});
