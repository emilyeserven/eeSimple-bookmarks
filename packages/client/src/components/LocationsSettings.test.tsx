import type { PlaceTypeLevelGroupConfig } from "@eesimple/types";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocationsSettings } from "./LocationsSettings";

// Stable query data — the real `useLocationLevels` (with its memoization) runs on top of this. A
// fresh array each call here would still be fine because the hook memoizes on the returned reference,
// so we return a constant module-level value to mirror a settled react-query cache.
const GROUPS: PlaceTypeLevelGroupConfig = [
  {
    id: "g1",
    name: "Country",
    placeTypes: ["country"],
    displayMode: "area",
    visible: true,
    sortOrder: 0,
  },
];
const LOCATIONS = [{
  placeType: "country",
}, {
  placeType: "city",
}];

vi.mock("../hooks/useAppSettings", () => ({
  useLocationLevelGroups: () => GROUPS,
  useUpdateLocationLevelGroups: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useLocationPlaceTypeIcons: () => ({}),
  useUpdatePlaceTypeIcons: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("../hooks/useLocations", () => ({
  useLocations: () => ({
    data: LOCATIONS,
    isLoading: false,
  }),
}));

describe("LocationsSettings", () => {
  it("renders without an infinite render loop and opens the place-types combobox", () => {
    render(<LocationsSettings />);
    // The Country group has displayMode "area", so it lives in the Area tab.
    const levelGroupTabs = screen.getByRole("navigation", {
      name: "Level group display mode",
    });
    fireEvent.click(within(levelGroupTabs).getByRole("button", {
      name: "Area",
    }));
    const trigger = screen.getByRole("combobox", {
      name: /Place types for Country/,
    });
    fireEvent.click(trigger);
    expect(screen.getByPlaceholderText("Search place types…")).toBeInTheDocument();
    // City is discovered from locations and offered as an assignable option.
    expect(screen.getByRole("option", {
      name: /City/,
    })).toBeInTheDocument();
  });

  it("renders a Place Type Icons picker per discovered place type", () => {
    render(<LocationsSettings />);
    // Navigate to the Pin Icons outer tab to reveal PlaceTypeIconsCard.
    fireEvent.click(screen.getByRole("button", {
      name: "Pin Icons",
    }));
    expect(screen.getByText("Place Type Icons")).toBeInTheDocument();
    // Country is in an area-mode group; City is unassigned (defaults to area). Both live in "Area" tab.
    const iconTabs = screen.getByRole("navigation", {
      name: "Place type icon tabs",
    });
    fireEvent.click(within(iconTabs).getByRole("button", {
      name: "Area",
    }));
    expect(screen.getByRole("combobox", {
      name: /Icon for Country/,
    })).toBeInTheDocument();
    expect(screen.getByRole("combobox", {
      name: /Icon for City/,
    })).toBeInTheDocument();
  });
});
