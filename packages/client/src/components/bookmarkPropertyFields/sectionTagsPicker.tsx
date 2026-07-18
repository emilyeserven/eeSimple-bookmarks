import { useTranslation } from "react-i18next";

import { TagPicker } from "../TagPicker";

import { useTagTree } from "@/hooks/useTags";

/**
 * Compact per-section tag multi-picker for the Sections editor rows. Self-contained (fetches the
 * tag tree itself) so hosting it adds no hooks to `SectionRow`. Emits `undefined` when the last tag
 * is removed so the persisted jsonb stays lean.
 */
export function SectionTagsPicker({
  tagIds, onChange,
}: {
  tagIds: string[] | undefined;
  onChange: (tagIds: string[] | undefined) => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: tree,
  } = useTagTree();
  const selected = tagIds ?? [];
  function toggle(id: string): void {
    const next = selected.includes(id)
      ? selected.filter(existing => existing !== id)
      : [...selected, id];
    onChange(next.length > 0 ? next : undefined);
  }
  return (
    <div className="flex max-w-72 min-w-48 items-center gap-2">
      <span className="text-xs text-muted-foreground">{t("Tags")}</span>
      <TagPicker
        tree={tree ?? []}
        selectedIds={selected}
        onToggle={toggle}
      />
    </div>
  );
}
