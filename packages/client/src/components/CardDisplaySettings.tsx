import type { CardImageDisplayValue } from "./CardDisplayImageControls";
import type { CardDisplayFields } from "../lib/cardDisplaySectionMutations";
import type { CardDisplayConfig } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { CardDisplayImageControls } from "./CardDisplayImageControls";
import { CardDisplayPreview } from "./CardDisplayPreview";
import { CardDisplaySectionBoard } from "./CardDisplaySectionBoard";
import { ErrorBoundaryBox } from "./ErrorBoundaryBox";
import { useCardDisplaySettingsPage } from "../hooks/useCardDisplaySettingsPage";
import { useCustomProperties } from "../hooks/useCustomProperties";

import { Separator } from "@/components/ui/separator";

/** The label a single image-attribute change reports in its save toast. */
const IMAGE_ATTR_LABELS: Record<keyof CardImageDisplayValue, string> = {
  imageVisibility: "Images",
  imageMode: "Aspect",
  imageLayout: "Layout",
  hideWebsiteForYouTube: "Hide website for YouTube",
};

/**
 * Settings → Display → Card Display: the single card-display configuration governing every listing
 * card. A 60/40 split — the form (image presentation + the dynamic section board) on the left, a live
 * preview card on the right. Every control auto-saves (there is no Save button).
 */
export function CardDisplaySettings() {
  const {
    t,
  } = useTranslation();
  const {
    data: properties = [],
  } = useCustomProperties();
  const {
    draft, persist,
  } = useCardDisplaySettingsPage();

  if (!draft) {
    return <p className="text-sm text-muted-foreground">{t("Loading…")}</p>;
  }

  const imageValue: CardImageDisplayValue = {
    imageMode: draft.imageMode,
    imageVisibility: draft.imageVisibility,
    imageLayout: draft.imageLayout,
    hideWebsiteForYouTube: draft.hideWebsiteForYouTube,
  };

  const boardValue: CardDisplayFields = {
    sections: draft.sections,
    imageCorners: draft.imageCorners,
  };

  return (
    <div
      className="
        grid grid-cols-1 gap-6
        md:grid-cols-[3fr_2fr]
      "
    >
      <div className="min-w-0 space-y-4">
        <CardDisplayImageControls
          value={imageValue}
          isDefault
          idPrefix="card-display"
          onChange={(patch) => {
            const [key, val] = Object.entries(patch)[0] as [keyof CardImageDisplayValue, unknown];
            // `isDefault` renders concrete controls, so a change is never a null "inherit" value.
            if (val === null || val === undefined) return;
            persist({
              [key]: val,
            } as Partial<CardDisplayConfig>, t(IMAGE_ATTR_LABELS[key]));
          }}
        />

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">{t("Card fields")}</p>
          <p className="text-xs text-muted-foreground">
            {t("Arrange the fields shown on each card into sections. Give each section its own layout and, optionally, a condition so it only shows on matching bookmarks.")}
          </p>
          <ErrorBoundaryBox
            resetKey="card-display-board"
            fallback={(
              <p className="text-sm text-muted-foreground">
                {t("These controls hit an error. Reload the page to try again.")}
              </p>
            )}
          >
            <CardDisplaySectionBoard
              value={boardValue}
              properties={properties}
              idPrefix="card-display"
              onChange={next => persist({
                sections: next.sections,
                imageCorners: next.imageCorners,
              }, t("Card fields"))}
            />
          </ErrorBoundaryBox>
        </div>
      </div>

      <div className="min-w-0">
        <div className="sticky top-4 space-y-2">
          <p className="text-sm font-medium">{t("Preview")}</p>
          <ErrorBoundaryBox
            resetKey="card-display-preview"
            fallback={(
              <p className="text-sm text-muted-foreground">
                {t("Couldn't render this preview.")}
              </p>
            )}
          >
            <CardDisplayPreview config={draft} />
          </ErrorBoundaryBox>
        </div>
      </div>
    </div>
  );
}
