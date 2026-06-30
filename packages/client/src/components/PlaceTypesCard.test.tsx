import type { PlaceType, PlaceTypeLevelGroup } from "@eesimple/types";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlaceTypesCard } from "./PlaceTypesCard";

const PLACE_TYPES: PlaceType[] = [
  {
    id: "pt1",
    name: "Country",
    slug: "country",
    sortOrder: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    locationCount: 2,
  },
  {
    id: "pt2",
    name: "City",
    slug: "city",
    sortOrder: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    locationCount: 3,
  },
];

vi.mock("../hooks/usePlaceTypes", () => ({
  usePlaceTypes: () => ({
    data: PLACE_TYPES,
    isLoading: false,
  }),
  useCreatePlaceType: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdatePlaceType: () => ({
    mutate: vi.fn(),
  }),
  useDeletePlaceType: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe("PlaceTypesCard", () => {
  it("flags a place type not assigned to any level group", () => {
    const groups: PlaceTypeLevelGroup[] = [
      {
        id: "g1",
        name: "Country level",
        placeTypes: ["country"],
        displayMode: "area",
        visible: true,
        sortOrder: 0,
      },
    ];
    render(<PlaceTypesCard groups={groups} />);
    expect(screen.getByTitle("City isn’t assigned to any level")).toBeInTheDocument();
    expect(screen.queryByTitle("Country isn’t assigned to any level")).not.toBeInTheDocument();
  });

  it("flags every place type when no level groups exist", () => {
    render(<PlaceTypesCard groups={[]} />);
    expect(screen.getByTitle("Country isn’t assigned to any level")).toBeInTheDocument();
    expect(screen.getByTitle("City isn’t assigned to any level")).toBeInTheDocument();
  });
});
