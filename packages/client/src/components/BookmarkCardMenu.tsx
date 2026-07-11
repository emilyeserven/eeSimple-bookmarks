import type { Bookmark, BookmarkTag, ChoicesDisplayType, CustomProperty } from "@eesimple/types";

import { CHOICES_DISPLAY_LABELS, CHOICES_DISPLAY_TYPES } from "@eesimple/types";
import { Camera, ShoppingBasket, SlidersHorizontal, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BookmarkCardEditMenuItem } from "./BookmarkCardEditMenuItem";
import { CardNumberPropertyEditor } from "./CardNumberPropertyEditor";
import { DateTimePicker } from "./DateTimePicker";
import { StarRating } from "./StarRating";
import { useBasketStore } from "../stores/basketStore";

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
import { Label } from "@/components/ui/label";
import { useTranslatedLabel } from "@/hooks/useTranslatedLabel";

/** Translates a raw `imageAutoGrabError` code's English label. Each key is a literal `t()` call so
 * `pnpm i18n:extract` can find it statically. */
function imageGrabErrorLabel(t: (key: string) => string, code: string): string {
  switch (code) {
    case "no_image":
      return t("No preview image on this page");
    case "bad_image":
      return t("Preview image couldn't be loaded");
    case "blocked":
      return t("Access to this page was blocked");
    case "server_error":
      return t("Site returned a server error");
    case "fetch_error":
      return t("Page couldn't be reached");
    default:
      return t("Could not fetch a preview image");
  }
}

interface BookmarkCardMenuProps {
  bookmark: Bookmark;
  /** Properties opted into inline editing that apply to the bookmark's category. */
  editableProperties: CustomProperty[];
  /** Tags opted into inline toggle from the card's "More" menu. */
  editableTags: BookmarkTag[];
  autoImagePending: boolean;
  onAutoImage: () => void;
  screenshotPending: boolean;
  onScreenshot: () => void;
  onSaveNumber: (propertyId: string, value: number) => void;
  onSaveBoolean: (propertyId: string, value: boolean) => void;
  onSaveDateTime: (propertyId: string, value: string) => void;
  onSaveChoices: (propertyId: string, values: string[]) => void;
  onSaveTags: (tagIds: string[]) => void;
  onChangeChoicesDisplay: (propertyId: string, display: ChoicesDisplayType) => void;
  onDelete?: (id: string) => void;
}

/** The dropdown menu content for a bookmark card: edit link, quick-edit properties, image grab, delete. */
export function BookmarkCardMenu({
  bookmark, editableProperties, editableTags, autoImagePending, onAutoImage, screenshotPending, onScreenshot,
  onSaveNumber, onSaveBoolean, onSaveDateTime, onSaveChoices, onSaveTags,
  onChangeChoicesDisplay, onDelete,
}: BookmarkCardMenuProps) {
  const tLabel = useTranslatedLabel();
  const {
    t,
  } = useTranslation();
  const inBasket = useBasketStore(s => s.bookmarkIds.includes(bookmark.id));
  const toggleBasket = useBasketStore(s => s.toggle);
  return (
    <DropdownMenuContent align="end">
      <BookmarkCardEditMenuItem bookmarkId={bookmark.id} />
      <DropdownMenuItem onClick={() => toggleBasket(bookmark.id)}>
        <ShoppingBasket className="mr-2 size-4" />
        {inBasket ? t("Remove from Basket") : t("Add to Basket")}
      </DropdownMenuItem>
      {(editableTags.length > 0 || editableProperties.length > 0)
        ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("Quick edit")}
            </DropdownMenuLabel>
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
                  : t("None");
                const displaySubmenu = (
                  <>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <SlidersHorizontal
                          className="mr-2 size-3.5 text-muted-foreground"
                        />
                        <span className="text-xs text-muted-foreground">
                          {t("Display as:")}
                          {" "}
                          {tLabel(CHOICES_DISPLAY_LABELS[property.choicesDisplay ?? "checkbox"])}
                        </span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                          value={property.choicesDisplay ?? "checkbox"}
                          onValueChange={value =>
                            onChangeChoicesDisplay(property.id, value as ChoicesDisplayType)}
                        >
                          {CHOICES_DISPLAY_TYPES.map(dt => (
                            <DropdownMenuRadioItem
                              key={dt}
                              value={dt}
                            >
                              {tLabel(CHOICES_DISPLAY_LABELS[dt])}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                  </>
                );
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
                        {displaySubmenu}
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
                      {displaySubmenu}
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
            {t("Get page image")}
          </span>
          {bookmark.imageAutoGrabError && (
            <span className="ml-6 text-xs text-muted-foreground">
              {imageGrabErrorLabel(t, bookmark.imageAutoGrabError)}
            </span>
          )}
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={screenshotPending}
        onClick={onScreenshot}
      >
        <Camera className="mr-2 size-4" />
        {t("Generate screenshot")}
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
              {t("Delete")}
            </DropdownMenuItem>
          </>
        )
        : null}
    </DropdownMenuContent>
  );
}
