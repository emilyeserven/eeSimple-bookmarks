import type { useLocationLevels } from "../hooks/useLocationLevels";
import type { useSortable } from "@dnd-kit/sortable";
import type { PlaceTypeLevelGroup } from "@eesimple/types";

type Levels = ReturnType<typeof useLocationLevels>;

/** The drag-handle attributes/listeners produced by `useSortable`. */
export type SortableHandle = Pick<ReturnType<typeof useSortable>, "attributes" | "listeners">;

/** Props shared by the level-group row wrapper and its content. */
export interface GroupRowProps {
  group: PlaceTypeLevelGroup;
  options: Levels["placeTypeOptions"];
  renameGroup: Levels["renameGroup"];
  setGroupVisible: Levels["setGroupVisible"];
  setGroupDisplayMode: Levels["setGroupDisplayMode"];
  setGroupPlaceTypes: Levels["setGroupPlaceTypes"];
  setGroupColor: Levels["setGroupColor"];
  removeGroup: Levels["removeGroup"];
}
