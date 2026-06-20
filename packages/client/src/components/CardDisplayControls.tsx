import type { CustomProperty } from "@eesimple/types";

import { STANDARD_CARD_FIELDS } from "../lib/bookmarkCardFields";
import { useUiStore } from "../stores/uiStore";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CardDisplayControlsBaseProps {
  /** Field keys currently hidden (standard field key or custom-property id). */
  hidden: string[];
  /** Toggle a field key on/off. */
  onToggle: (fieldKey: string) => void;
  /** Custom properties the surface can show, used to extend the standard field list. */
  properties: CustomProperty[];
  /** Stable id prefix so checkbox/label pairs stay unique when multiple instances share a page. */
  idPrefix?: string;
  /** When true, the website pill is hidden on bookmarks that also have a YouTube channel. */
  hideWebsiteForYoutube?: boolean;
  /** Toggle the hideWebsiteForYoutube option. When absent, the sub-option is not rendered. */
  onToggleHideWebsiteForYoutube?: () => void;
}

/**
 * Controlled toggles for which fields appear on bookmark cards: the standard fields plus each custom
 * property the surface can show. Presentational — callers supply `hidden`/`onToggle`/`properties`.
 * Reused by the uiStore-backed `CardDisplayControls` (listings) and the homepage section form.
 */
export function CardDisplayControlsBase({
  hidden, onToggle, properties, idPrefix = "card-field",
  hideWebsiteForYoutube, onToggleHideWebsiteForYoutube,
}: CardDisplayControlsBaseProps) {
  const customFields = properties
    .filter(property =>
      property.showInListings
      && property.type !== "calculate"
      && (property.allCategories || property.categoryIds.length > 0))
    .map(property => ({
      key: property.id,
      label: property.name,
    }));

  const fields = [...STANDARD_CARD_FIELDS, ...customFields];

  return (
    <div className="flex flex-col gap-2">
      {fields.map(field => (
        <div key={field.key}>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${idPrefix}-${field.key}`}
              checked={!hidden.includes(field.key)}
              onCheckedChange={() => onToggle(field.key)}
            />
            <Label htmlFor={`${idPrefix}-${field.key}`}>{field.label}</Label>
          </div>
          {field.key === "website" && !hidden.includes("website") && onToggleHideWebsiteForYoutube
            ? (
              <div className="mt-1 ml-6 flex items-center gap-2">
                <Checkbox
                  id={`${idPrefix}-hide-youtube-website`}
                  checked={hideWebsiteForYoutube ?? false}
                  onCheckedChange={() => onToggleHideWebsiteForYoutube()}
                />
                <Label
                  htmlFor={`${idPrefix}-hide-youtube-website`}
                  className="text-muted-foreground"
                >
                  Hide when YouTube channel present
                </Label>
              </div>
            )
            : null}
        </div>
      ))}
    </div>
  );
}

interface CardDisplayControlsProps {
  pageKey: string;
}

/**
 * Per-listing toggles for which fields appear on bookmark cards, backed by uiStore. Filters card
 * display on top of each property's global `showInListings` flag without changing it.
 */
export function CardDisplayControls({
  pageKey,
}: CardDisplayControlsProps) {
  const hidden = useUiStore(state => state.hiddenCardFields[pageKey]) ?? [];
  const toggleCardField = useUiStore(state => state.toggleCardField);
  const hideWebsiteForYoutube = useUiStore(state => state.hideWebsiteForYouTube[pageKey] ?? false);
  const toggleHideWebsiteForYouTube = useUiStore(state => state.toggleHideWebsiteForYouTube);
  const properties = useUiStore(state => state.filterContext?.properties) ?? [];

  return (
    <CardDisplayControlsBase
      hidden={hidden}
      onToggle={fieldKey => toggleCardField(pageKey, fieldKey)}
      hideWebsiteForYoutube={hideWebsiteForYoutube}
      onToggleHideWebsiteForYoutube={() => toggleHideWebsiteForYouTube(pageKey)}
      properties={properties}
    />
  );
}
