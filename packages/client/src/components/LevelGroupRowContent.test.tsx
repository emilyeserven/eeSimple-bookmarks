import type { PlaceTypeLevelGroup } from "@eesimple/types";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LevelGroupRowContent } from "./LevelGroupRowContent";

const options = [
  {
    key: "country",
    label: "Country",
  },
  {
    key: "region",
    label: "Region",
  },
];

const attributes = {
  "role": "button",
  "tabIndex": 0,
  "aria-disabled": false,
  "aria-pressed": undefined,
  "aria-roledescription": "sortable",
  "aria-describedby": "DndDescribedBy-0",
} as const;

function makeGroup(overrides: Partial<PlaceTypeLevelGroup> = {}): PlaceTypeLevelGroup {
  return {
    id: "g1",
    name: "Country",
    placeTypes: ["country", "region"],
    displayMode: "area",
    visible: true,
    sortOrder: 0,
    ...overrides,
  };
}

describe("LevelGroupRowContent", () => {
  it("renders a place type also assigned to another level as clickable, and clicking removes it from this level", () => {
    const setGroupPlaceTypes = vi.fn();
    const group = makeGroup();

    render(
      <LevelGroupRowContent
        group={group}
        options={options}
        takenPlaceTypes={new Set(["region"])}
        renameGroup={vi.fn()}
        setGroupVisible={vi.fn()}
        setGroupShowOnMainMap={vi.fn()}
        setGroupDisplayMode={vi.fn()}
        setGroupLevelMode={vi.fn()}
        setGroupPlaceTypes={setGroupPlaceTypes}
        setGroupColor={vi.fn()}
        removeGroup={vi.fn()}
        attributes={attributes}
        listeners={{}}
      />,
    );

    // "country" isn't duplicated, so it's plain text; "region" is duplicated and clickable.
    expect(screen.queryByRole("button", {
      name: /country/,
    })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {
      name: /region/,
    }));
    expect(setGroupPlaceTypes).toHaveBeenCalledWith("g1", ["country"]);
  });

  it("does not disable an already-selected duplicate in the place-type picker", () => {
    const group = makeGroup();

    render(
      <LevelGroupRowContent
        group={group}
        options={options}
        takenPlaceTypes={new Set(["region"])}
        renameGroup={vi.fn()}
        setGroupVisible={vi.fn()}
        setGroupShowOnMainMap={vi.fn()}
        setGroupDisplayMode={vi.fn()}
        setGroupLevelMode={vi.fn()}
        setGroupPlaceTypes={vi.fn()}
        setGroupColor={vi.fn()}
        removeGroup={vi.fn()}
        attributes={attributes}
        listeners={{}}
      />,
    );

    fireEvent.click(screen.getByRole("button", {
      name: "Edit",
    }));
    fireEvent.click(screen.getByRole("combobox", {
      name: /Place types for Country/,
    }));
    expect(screen.getByRole("option", {
      name: /Region/,
    })).toHaveAttribute("aria-disabled", "false");
  });
});
