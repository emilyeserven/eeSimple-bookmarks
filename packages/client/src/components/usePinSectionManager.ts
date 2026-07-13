import type { PinnedSidebarItem } from "@eesimple/types";

import {
  useCreatePinnedSection,
  useDeletePinnedSection,
  useReorderPinnedSections,
  usePinnedSections,
  useUpdatePinnedSection,
} from "../hooks/usePinnedSections";
import { useReorderPinnedSidebarItems, useUpdatePinnedSidebarItem } from "../hooks/usePinnedSidebarItems";

/**
 * Section state + mutation handlers for {@link PinManager} — create / rename / delete / reorder
 * sections, and assign a pin to a section (or back to ungrouped). Kept separate from
 * `usePinManagerData` so neither hook trips the complexity cap.
 */
export function usePinSectionManager() {
  const {
    data: sections = [],
  } = usePinnedSections();
  const createSection = useCreatePinnedSection();
  const updateSection = useUpdatePinnedSection();
  const deleteSection = useDeletePinnedSection();
  const reorderSections = useReorderPinnedSections();
  const updatePin = useUpdatePinnedSidebarItem();
  const reorderPins = useReorderPinnedSidebarItems();

  /** Move a section one slot up (-1) or down (+1), persisting the new order. */
  function moveSection(id: string, delta: number): void {
    const ids = sections.map(s => s.id);
    const index = ids.indexOf(id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderSections.mutate(ids);
  }

  /**
   * Move a pin one slot up (-1) or down (+1) among the pins that share its section (or the ungrouped
   * bucket), persisting the whole global order. `pins` is the current sortOrder-ordered list.
   */
  function movePin(pinId: string, delta: number, pins: PinnedSidebarItem[]): void {
    const index = pins.findIndex(p => p.id === pinId);
    if (index < 0) return;
    const sectionId = pins[index].sectionId;
    // Find the nearest neighbor in the same section in the move direction (they need not be adjacent
    // in the global list, since other sections' pins can be interleaved by sortOrder).
    let target = index + delta;
    while (target >= 0 && target < pins.length && pins[target].sectionId !== sectionId) {
      target += delta;
    }
    if (target < 0 || target >= pins.length || pins[target].sectionId !== sectionId) return;
    const ids = pins.map(p => p.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderPins.mutate(ids);
  }

  return {
    sections,
    createSection: (name: string) => createSection.mutate({
      name,
    }),
    renameSection: (id: string, name: string) => updateSection.mutate({
      id,
      input: {
        name,
      },
    }),
    deleteSection: (id: string) => deleteSection.mutate(id),
    moveSection,
    movePin,
    assignPin: (pinId: string, sectionId: string | null) => updatePin.mutate({
      id: pinId,
      input: {
        sectionId,
      },
    }),
  };
}
