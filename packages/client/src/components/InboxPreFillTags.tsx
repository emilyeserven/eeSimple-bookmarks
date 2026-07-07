import type { InboxPreFillDefaults, TagNode } from "@eesimple/types";

import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { TagPickerWithCreate } from "./TagPickerWithCreate";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

/**
 * The full-width Tags pre-fill field: removable badges for the selected tags above a
 * `TagPickerWithCreate`. Full-width because the tree picker is wider than the other defaults.
 */
export function InboxPreFillTags({
  tree,
  preFill,
  setPreFill,
  selectedTagNames,
}: {
  tree: TagNode[];
  preFill: InboxPreFillDefaults;
  setPreFill: (preFill: InboxPreFillDefaults) => void;
  selectedTagNames: string[];
}) {
  const {
    t,
  } = useTranslation();
  const selectedTagIds = preFill.tagIds ?? [];

  return (
    <div className="space-y-1">
      <Label className="text-sm">{t("Tags")}</Label>
      {selectedTagNames.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {selectedTagNames.map((name, i) => (
            <Badge
              key={selectedTagIds[i]}
              variant="secondary"
              className="gap-1 text-xs"
            >
              {name}
              <button
                type="button"
                aria-label={t("Remove tag {{name}}", {
                  name,
                })}
                className="
                  ml-0.5 rounded-sm
                  hover:text-destructive
                "
                onClick={() =>
                  setPreFill({
                    ...preFill,
                    tagIds: selectedTagIds.filter(id => id !== selectedTagIds[i]),
                  })}
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <TagPickerWithCreate
        tree={tree}
        selectedIds={selectedTagIds}
        onToggle={(id) => {
          const next = selectedTagIds.includes(id)
            ? selectedTagIds.filter(t => t !== id)
            : [...selectedTagIds, id];
          setPreFill({
            ...preFill,
            tagIds: next,
          });
        }}
      />
    </div>
  );
}
