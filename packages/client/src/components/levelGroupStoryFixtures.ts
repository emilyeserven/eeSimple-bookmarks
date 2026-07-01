import type { GroupRowProps, SortableHandle } from "./levelGroupRowTypes";
import type { PlaceTypeLevelGroup } from "@eesimple/types";

/** A representative level group for the LevelGroup* stories. */
export function makeStoryGroup(overrides: Partial<PlaceTypeLevelGroup> = {}): PlaceTypeLevelGroup {
  return {
    id: "g1",
    name: "Region",
    placeTypes: ["state", "province"],
    displayMode: "area",
    visible: true,
    showOnMainMap: true,
    sortOrder: 0,
    color: null,
    ...overrides,
  };
}

/** No-op sortable handle props (stories aren't wired into a real drag context). */
export const storySortableHandle: SortableHandle = {
  attributes: {} as SortableHandle["attributes"],
  listeners: undefined,
};

const noop = (): void => undefined;

/** The full set of `GroupRowProps` handlers, all no-ops, for the LevelGroup* stories. */
export const storyGroupRowProps: Omit<GroupRowProps, "group"> = {
  options: [
    {
      key: "country",
      label: "Country",
    },
    {
      key: "state",
      label: "State",
    },
    {
      key: "province",
      label: "Province",
    },
    {
      key: "city",
      label: "City",
    },
  ],
  takenPlaceTypes: new Set(["country"]),
  renameGroup: noop,
  setGroupShowOnMainMap: noop,
  setGroupDisplayMode: noop,
  setGroupPlaceTypes: noop,
  setGroupColor: noop,
  removeGroup: noop,
};
