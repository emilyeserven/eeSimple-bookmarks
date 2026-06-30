import type { PlaceTypeLevelGroupConfig } from "@eesimple/types";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocationLevelGroupsSettings } from "./LocationLevelGroupsSettings";

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
  useLocationPlaceTypeColors: () => ({}),
  useUpdatePlaceTypeColors: () => ({
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

describe("LocationLevelGroupsSettings", () => {
  it("renders without an infinite render loop and opens the place-types combobox", () => {
    render(<LocationLevelGroupsSettings />);
    // Rows default to view mode — click Edit to reveal the place-types combobox.
    fireEvent.click(screen.getByRole("button", {
      name: "Edit",
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
});
