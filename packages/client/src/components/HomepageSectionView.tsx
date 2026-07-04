import type { SectionDisplayValue } from "./SectionDisplaySettings";
import type { HomepageSection, UpdateHomepageSectionInput } from "@eesimple/types";

import { defaultCardZoneLayouts } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { conditionsBreakdown, conditionsSummaryLabel } from "./conditions/summarizeConditions";
import { SectionDisplaySettings } from "./SectionDisplaySettings";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useDefaultFieldZones } from "../lib/bookmarkCardFields";
import { defaultCardFieldZones } from "../lib/bookmarkCardValues";
import { sectionDisplayPreview } from "../lib/sectionDisplayPreview";

import { Separator } from "@/components/ui/separator";

interface HomepageSectionViewProps {
  section: HomepageSection;
  onPatchDisplay: (input: UpdateHomepageSectionInput) => void;
}

/** Read-only display of a homepage section's Display + Filter settings (shown when not editing). */
export function HomepageSectionView({
  section, onPatchDisplay,
}: HomepageSectionViewProps) {
  const {
    t,
  } = useTranslation();
  const breakdown = conditionsBreakdown(section.conditions);
  const {
    data: properties,
  } = useCustomProperties();
  const defaultZones = useDefaultFieldZones();

  const display: SectionDisplayValue = {
    viewMode: section.viewMode,
    columns: section.columns,
    imageMode: section.imageMode,
    imageVisibility: section.imageVisibility,
    imageLayout: section.imageLayout,
    fieldZones: section.fieldZones ?? defaultZones ?? defaultCardFieldZones(properties ?? []),
    cardZoneLayouts: section.cardZoneLayouts ?? defaultCardZoneLayouts(),
    hideWebsiteForYouTube: section.hideWebsiteForYouTube,
    bookmarkLimit: section.bookmarkLimit,
  };

  return (
    <>
      {section.description
        ? <p className="text-sm text-muted-foreground">{section.description}</p>
        : null}

      <CollapsibleFormSection
        title={t("Display")}
        description={t("How this section's bookmarks are laid out on the homepage.")}
        preview={sectionDisplayPreview(display)}
      >
        <SectionDisplaySettings
          idPrefix={`view-${section.id}`}
          value={display}
          onChange={onPatchDisplay}
          properties={properties ?? []}
        />
      </CollapsibleFormSection>

      <Separator />

      <CollapsibleFormSection
        title={t("Filter")}
        description={t("The bookmarks shown in this section — use Edit to change them.")}
        preview={conditionsSummaryLabel(section.conditions)}
      >
        {breakdown.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              {t("No conditions yet — use Edit to choose which bookmarks appear here.")}
            </p>
          )
          : (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {breakdown.map(line => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
      </CollapsibleFormSection>
    </>
  );
}
