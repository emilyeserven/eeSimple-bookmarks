import type { Bookmark, BookmarkTag, Category, CustomProperty, MediaType } from "@eesimple/types";

import { useEffect, useState } from "react";

import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { DateTimePicker } from "./DateTimePicker";
import { useEditPanelClick } from "./panel/useEditPanelClick";
import { StarRating } from "./StarRating";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";

const IMAGE_GRAB_ERROR_LABELS: Record<string, string> = {
  no_image: "No preview image on this page",
  bad_image: "Preview image couldn't be loaded",
  blocked: "Access to this page was blocked",
  server_error: "Site returned a server error",
  fetch_error: "Page couldn't be reached",
};

interface CardNumberPropertyEditorProps {
  property: CustomProperty;
  inputId: string;
  /** The bookmark's current value for this property, or `undefined` when unset. */
  current: number | undefined;
  /** Commit a new numeric value (called on blur / Enter, only when it changed). */
  onCommit: (value: number) => void;
}

/** A labelled number input rendered inside the card's "More" menu (keystrokes stay out of the menu). */
function CardNumberPropertyEditor({
  property, inputId, current, onCommit,
}: CardNumberPropertyEditorProps) {
  const [draft, setDraft] = useState(current === undefined ? "" : String(current));

  // Re-seed when the saved value changes (e.g. after a successful save or external update).
  useEffect(() => {
    setDraft(current === undefined ? "" : String(current));
  }, [current]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed === "") return;
    const next = Number(trimmed);
    if (Number.isNaN(next) || next === current) return;
    onCommit(next);
  }

  return (
    <div className="px-2 py-1.5">
      <Label
        htmlFor={inputId}
        className="text-xs text-muted-foreground"
      >
        {property.name}
        {property.unitPlural ? ` (${property.unitPlural})` : ""}
      </Label>
      <Input
        id={inputId}
        type="number"
        className="mt-1 h-8"
        value={draft}
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        // Keep typing (digits, space, arrows) from reaching the menu's typeahead/navigation.
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
      />
    </div>
  );
}

interface BookmarkCardMenuProps {
  bookmark: Bookmark;
  /** Properties opted into inline editing that apply to the bookmark's category. */
  editableProperties: CustomProperty[];
  /** Tags opted into inline toggle from the card's "More" menu. */
  editableTags: BookmarkTag[];
  /** Categories marked as quick-select options from the card's "More" menu. */
  editableCategories: Category[];
  /** Media types marked as quick-select options from the card's "More" menu. */
  editableMediaTypes: MediaType[];
  autoImagePending: boolean;
  onAutoImage: () => void;
  onSaveNumber: (propertyId: string, value: number) => void;
  onSaveBoolean: (propertyId: string, value: boolean) => void;
  onSaveDateTime: (propertyId: string, value: string) => void;
  onSaveChoices: (propertyId: string, values: string[]) => void;
  onSaveTags: (tagIds: string[]) => void;
  onSaveCategory: (categoryId: string) => void;
  onSaveMediaType: (mediaTypeId: string | null) => void;
  onDelete?: (id: string) => void;
}

/** The dropdown menu content for a bookmark card: edit link, quick-edit properties, image grab, delete. */
export function BookmarkCardMenu({
  bookmark, editableProperties, editableTags, editableCategories, editableMediaTypes,
  autoImagePending, onAutoImage,
  onSaveNumber, onSaveBoolean, onSaveDateTime, onSaveChoices, onSaveTags,
  onSaveCategory, onSaveMediaType, onDelete,
}: BookmarkCardMenuProps) {
  const editClick = useEditPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuItem asChild>
        <Link
          to="/bookmarks/$bookmarkId/edit"
          params={{
            bookmarkId: bookmark.id,
          }}
          title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
          onClick={event => editClick(event, "bookmark", bookmark.id)}
        >
          Edit
        </Link>
      </DropdownMenuItem>
      {(editableCategories.length > 0 || editableMediaTypes.length > 0
        || editableTags.length > 0 || editableProperties.length > 0)
        ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Quick edit
            </DropdownMenuLabel>
            {editableCategories.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span className="flex min-w-0 flex-col">
                    <span>Category</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {editableCategories.find(c => c.id === bookmark.categoryId)?.name ?? "–"}
                    </span>
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={bookmark.categoryId}
                    onValueChange={onSaveCategory}
                  >
                    {editableCategories.map(c => (
                      <DropdownMenuRadioItem
                        key={c.id}
                        value={c.id}
                      >
                        {c.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {editableMediaTypes.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span className="flex min-w-0 flex-col">
                    <span>Media type</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {editableMediaTypes.find(m => m.id === bookmark.mediaType?.id)?.name ?? "–"}
                    </span>
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={bookmark.mediaType?.id ?? ""}
                    onValueChange={value => onSaveMediaType(value || null)}
                  >
                    {editableMediaTypes.map(m => (
                      <DropdownMenuRadioItem
                        key={m.id}
                        value={m.id}
                      >
                        {m.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {editableTags.map((tag) => {
              const checked = bookmark.tags.some(t => t.id === tag.id);
              return (
                <DropdownMenuCheckboxItem
                  key={tag.id}
                  checked={checked}
                  onSelect={event => event.preventDefault()}
                  onCheckedChange={(next) => {
                    const newTagIds = next
                      ? [...bookmark.tags.map(t => t.id), tag.id]
                      : bookmark.tags.filter(t => t.id !== tag.id).map(t => t.id);
                    onSaveTags(newTagIds);
                  }}
                >
                  {tag.name}
                </DropdownMenuCheckboxItem>
              );
            })}
            {editableProperties.map((property) => {
              if (property.type === "choices") {
                const current
                  = bookmark.choicesValues.find(entry => entry.propertyId === property.id)?.values
                    ?? [];
                const selectedLabels = current
                  .map(v => property.choicesItems.find(item => item.value === v)?.label)
                  .filter((l): l is string => l !== undefined);
                const triggerHint = selectedLabels.length > 0
                  ? selectedLabels.join(", ")
                  : "None";
                if (property.choicesMultiple) {
                  return (
                    <DropdownMenuSub key={property.id}>
                      <DropdownMenuSubTrigger>
                        <span className="flex min-w-0 flex-col">
                          <span>{property.name}</span>
                          <span
                            className="truncate text-xs text-muted-foreground"
                          >{triggerHint}
                          </span>
                        </span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {property.choicesItems.map(item => (
                          <DropdownMenuCheckboxItem
                            key={item.value}
                            checked={current.includes(item.value)}
                            onSelect={event => event.preventDefault()}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...current, item.value]
                                : current.filter(v => v !== item.value);
                              onSaveChoices(property.id, next);
                            }}
                          >
                            {item.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                }
                return (
                  <DropdownMenuSub key={property.id}>
                    <DropdownMenuSubTrigger>
                      <span className="flex min-w-0 flex-col">
                        <span>{property.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{triggerHint}</span>
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup
                        value={current[0] ?? ""}
                        onValueChange={value => onSaveChoices(property.id, value ? [value] : [])}
                      >
                        {property.choicesItems.map(item => (
                          <DropdownMenuRadioItem
                            key={item.value}
                            value={item.value}
                          >
                            {item.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                );
              }
              if (property.type === "boolean") {
                const checked
                  = bookmark.booleanValues.find(entry => entry.propertyId === property.id)?.value
                    ?? false;
                return (
                  <DropdownMenuCheckboxItem
                    key={property.id}
                    checked={checked}
                    // Keep the menu open so several values can be edited in one go.
                    onSelect={event => event.preventDefault()}
                    onCheckedChange={value => onSaveBoolean(property.id, value === true)}
                  >
                    {property.name}
                  </DropdownMenuCheckboxItem>
                );
              }
              if (property.type === "datetime") {
                const current
                  = bookmark.dateTimeValues.find(entry => entry.propertyId === property.id)?.value
                    ?? null;
                return (
                  <div
                    key={property.id}
                    className="px-2 py-1.5"
                    // Keep keystrokes/clicks inside the picker from reaching the menu.
                    onKeyDown={event => event.stopPropagation()}
                  >
                    <Label className="text-xs text-muted-foreground">{property.name}</Label>
                    <div className="mt-1">
                      <DateTimePicker
                        format={property.dateTimeFormat ?? "date"}
                        value={current}
                        onChange={value => onSaveDateTime(property.id, value ?? "")}
                      />
                    </div>
                  </div>
                );
              }
              if (property.type === "ratingScale") {
                const current
                  = bookmark.numberValues.find(entry => entry.propertyId === property.id)?.value ?? 0;
                return (
                  <div
                    key={property.id}
                    className="px-2 py-1.5"
                    // Keep clicks/keystrokes on the stars from reaching the menu (which would close it).
                    onKeyDown={event => event.stopPropagation()}
                    onClick={event => event.stopPropagation()}
                  >
                    <Label className="text-xs text-muted-foreground">{property.name}</Label>
                    <div className="mt-1">
                      <StarRating
                        value={current}
                        max={property.ratingMax ?? 5}
                        allowHalf={property.ratingAllowHalf}
                        allowZero={property.ratingAllowZero}
                        onChange={value => onSaveNumber(property.id, value)}
                      />
                    </div>
                  </div>
                );
              }
              return (
                <CardNumberPropertyEditor
                  key={property.id}
                  property={property}
                  inputId={`card-${bookmark.id}-property-${property.id}`}
                  current={
                    bookmark.numberValues.find(entry => entry.propertyId === property.id)?.value
                  }
                  onCommit={value => onSaveNumber(property.id, value)}
                />
              );
            })}
          </>
        )
        : null}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        disabled={autoImagePending || bookmark.imageAutoGrabError !== null}
        onClick={onAutoImage}
      >
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center">
            <Sparkles className="mr-2 size-4" />
            Get page image
          </span>
          {bookmark.imageAutoGrabError && (
            <span className="ml-6 text-xs text-muted-foreground">
              {IMAGE_GRAB_ERROR_LABELS[bookmark.imageAutoGrabError] ?? "Could not fetch a preview image"}
            </span>
          )}
        </div>
      </DropdownMenuItem>
      {onDelete
        ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="
                text-destructive
                focus:text-destructive
              "
              onClick={() => onDelete(bookmark.id)}
            >
              Delete
            </DropdownMenuItem>
          </>
        )
        : null}
    </DropdownMenuContent>
  );
}
