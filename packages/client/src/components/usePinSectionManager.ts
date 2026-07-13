import {
  useCreatePinnedSection,
  useDeletePinnedSection,
  useReorderPinnedSections,
  usePinnedSections,
  useUpdatePinnedSection,
} from "../hooks/usePinnedSections";
import { useUpdatePinnedSidebarItem } from "../hooks/usePinnedSidebarItems";

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

  /** Move a section one slot up (-1) or down (+1), persisting the new order. */
  function moveSection(id: string, delta: number): void {
    const ids = sections.map(s => s.id);
    const index = ids.indexOf(id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderSections.mutate(ids);
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
    assignPin: (pinId: string, sectionId: string | null) => updatePin.mutate({
      id: pinId,
      input: {
        sectionId,
      },
    }),
  };
}
