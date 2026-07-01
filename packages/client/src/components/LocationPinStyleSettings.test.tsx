import type { PlaceTypeLevelGroupConfig } from "@eesimple/types";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocationPinStyleSettings } from "./LocationPinStyleSettings";

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
  useMapPinScale: () => 1,
  useDisplayPreferenceSettings: () => ({
    data: undefined,
  }),
  useUpdateDisplayPreferenceSettings: () => ({
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

describe("LocationPinStyleSettings", () => {
  it("renders an icon picker and color control per discovered place type, flagging the unassigned one", () => {
    render(<LocationPinStyleSettings />);
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
    // Each row also exposes a per-place-type color control (native color input, aria-labelled).
    expect(screen.getByLabelText("Country map color")).toBeInTheDocument();
    expect(screen.getByLabelText("City map color")).toBeInTheDocument();
    // City has no level group, so it's flagged with a "no level" indicator; Country isn't.
    expect(screen.getByTitle("City isn’t assigned to any level")).toBeInTheDocument();
    expect(screen.queryByTitle("Country isn’t assigned to any level")).not.toBeInTheDocument();
  });
});
