import type { InboxItem } from "@eesimple/types";

import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ImportItemAdvancedEditFields } from "./ImportItemAdvancedEditFields";
import { ImportItemAdvancedEditModals } from "./ImportItemAdvancedEditModals";
import { useImportItemAdvancedEdit } from "./useImportItemAdvancedEdit";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ImportItemAdvancedEditProps {
  item: InboxItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string | undefined;
  mediaTypeId: string | undefined;
  tagIds: string[];
  locationIds: string[];
  personIds: string[];
  groupId: string | undefined;
  onCategoryChange: (id: string | undefined) => void;
  onMediaTypeChange: (id: string | undefined) => void;
  onTagsChange: (ids: string[]) => void;
  onLocationsChange: (ids: string[]) => void;
  onPeopleChange: (ids: string[]) => void;
  onGroupChange: (id: string | undefined) => void;
}

/**
 * "Advanced" collapsible for a single pending inbox item. Lets users pre-set the taxonomy fields
 * that will be applied when the item is approved — values live in local state (in the parent
 * ReviewRow) and are merged into the preFill sent to the approve endpoint.
 *
 * `open`/`onOpenChange` are controlled by the parent so the mobile swipe gesture can be disabled
 * while the collapsible is open.
 */
export function ImportItemAdvancedEdit({
  item,
  open,
  onOpenChange,
  categoryId,
  mediaTypeId,
  tagIds,
  locationIds,
  personIds,
  groupId,
  onCategoryChange,
  onMediaTypeChange,
  onTagsChange,
  onLocationsChange,
  onPeopleChange,
  onGroupChange,
}: ImportItemAdvancedEditProps) {
  const {
    t,
  } = useTranslation();
  const state = useImportItemAdvancedEdit({
    item,
    tagIds,
    locationIds,
    onTagsChange,
    onLocationsChange,
    onCategoryChange,
    onMediaTypeChange,
    onGroupChange,
  });

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
    >
      <CollapsibleTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="-ml-2 h-auto gap-1 px-2 py-1 text-xs text-muted-foreground"
        >
          <ChevronDown
            className={`
              size-3 transition-transform
              ${open ? "rotate-180" : ""}
            `}
          />
          {t("Advanced")}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-3">
        <ImportItemAdvancedEditFields
          state={state}
          categoryId={categoryId}
          mediaTypeId={mediaTypeId}
          tagIds={tagIds}
          locationIds={locationIds}
          personIds={personIds}
          groupId={groupId}
          onCategoryChange={onCategoryChange}
          onMediaTypeChange={onMediaTypeChange}
          onPeopleChange={onPeopleChange}
          onGroupChange={onGroupChange}
        />
      </CollapsibleContent>

      <ImportItemAdvancedEditModals
        state={state}
        tagIds={tagIds}
        personIds={personIds}
        onTagsChange={onTagsChange}
        onPeopleChange={onPeopleChange}
      />
    </Collapsible>
  );
}
