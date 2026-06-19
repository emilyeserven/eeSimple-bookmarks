import type { ComboboxOption } from "./Combobox";
import type { BookmarkUrlSummary } from "@eesimple/types";

import { useState } from "react";

import { MultiCombobox } from "./MultiCombobox";

import { LabeledSection } from "@/components/LabeledSection";
import { Button } from "@/components/ui/button";
import { useUpdateBookmarkRelationships, useBookmarks } from "@/hooks/useBookmarks";

interface BookmarkRelationshipsEditorProps {
  bookmarkId: string;
  initialRelated: BookmarkUrlSummary[];
  onDone: () => void;
}

export function BookmarkRelationshipsEditor({
  bookmarkId,
  initialRelated,
  onDone,
}: BookmarkRelationshipsEditorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialRelated.map(b => b.id),
  );
  const {
    data: allBookmarks,
  } = useBookmarks();
  const updateRelationships = useUpdateBookmarkRelationships();

  const options: ComboboxOption[] = (allBookmarks ?? [])
    .filter(b => b.id !== bookmarkId)
    .map(b => ({
      value: b.id,
      label: b.title,
    }));

  function handleSave() {
    updateRelationships.mutate(
      {
        id: bookmarkId,
        input: {
          relatedBookmarkIds: selectedIds,
        },
      },
      {
        onSuccess: onDone,
      },
    );
  }

  return (
    <div className="space-y-6">
      <LabeledSection
        title="Related bookmarks"
        description="Select bookmarks that are related to this one. Relationships are bidirectional."
      >
        <MultiCombobox
          options={options}
          values={selectedIds}
          onValuesChange={setSelectedIds}
          placeholder="Select related bookmarks…"
          searchPlaceholder="Search bookmarks…"
          emptyText="No other bookmarks found."
        />
      </LabeledSection>

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={updateRelationships.isPending}
        >
          {updateRelationships.isPending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={updateRelationships.isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
