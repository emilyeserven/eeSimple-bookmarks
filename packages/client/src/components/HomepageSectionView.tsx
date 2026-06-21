import type { SectionDisplayValue } from "./SectionDisplaySettings";
import type { HomepageSection, UpdateHomepageSectionInput } from "@eesimple/types";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { conditionsBreakdown, conditionsSummaryLabel } from "./conditions/summarizeConditions";
import { SectionDisplaySettings } from "./SectionDisplaySettings";
import { useCustomProperties } from "../hooks/useCustomProperties";
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
  const breakdown = conditionsBreakdown(section.conditions);
  const {
    data: properties,
  } = useCustomProperties();

  const display: SectionDisplayValue = {
    viewMode: section.viewMode,
    columns: section.columns,
    imageMode: section.imageMode,
    imageVisibility: section.imageVisibility,
    imageLayout: section.imageLayout,
    hiddenCardFields: section.hiddenCardFields,
    cornerOverlays: section.cornerOverlays,
    hideWebsiteForYouTube: section.hideWebsiteForYouTube,
  };

  return (
    <>
      {section.description
        ? <p className="text-sm text-muted-foreground">{section.description}</p>
        : null}

      <CollapsibleFormSection
        title="Display"
        description="How this section's bookmarks are laid out on the homepage."
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
        title="Filter"
        description="The bookmarks shown in this section — use Edit to change them."
        preview={conditionsSummaryLabel(section.conditions)}
      >
        {breakdown.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              No conditions yet — use Edit to choose which bookmarks appear here.
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
