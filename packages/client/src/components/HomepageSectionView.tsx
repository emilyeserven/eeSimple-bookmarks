import type { HomepageSection, HomepageSectionImageLayout } from "@eesimple/types";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { conditionsBreakdown, conditionsSummaryLabel } from "./conditions/summarizeConditions";
import { SectionDisplayControls } from "./SectionDisplayControls";

import { Separator } from "@/components/ui/separator";

function displayPreview(section: HomepageSection): string {
  const parts = [
    `${section.columns} ${section.columns === 1 ? "column" : "columns"}`,
    section.imageMode ? "Natural" : "Cropped",
  ];
  if (section.columns === 2) parts.push(section.imageLayout === "side" ? "Side" : "Above");
  return parts.join(" · ");
}

interface HomepageSectionViewProps {
  section: HomepageSection;
  onPatchDisplay: (input: {
    columns?: number;
    imageMode?: boolean;
    imageLayout?: HomepageSectionImageLayout;
  }) => void;
}

/** Read-only display of a homepage section's Display + Filter settings (shown when not editing). */
export function HomepageSectionView({
  section, onPatchDisplay,
}: HomepageSectionViewProps) {
  const breakdown = conditionsBreakdown(section.conditions);

  return (
    <>
      {section.description
        ? <p className="text-sm text-muted-foreground">{section.description}</p>
        : null}

      <CollapsibleFormSection
        title="Display"
        description="How this section's bookmarks are laid out on the homepage."
        preview={displayPreview(section)}
      >
        <SectionDisplayControls
          idPrefix={`view-${section.id}`}
          columns={section.columns}
          imageMode={section.imageMode}
          imageLayout={section.imageLayout}
          onColumnsChange={columns => onPatchDisplay({
            columns,
          })}
          onImageModeChange={imageMode => onPatchDisplay({
            imageMode,
          })}
          onImageLayoutChange={imageLayout => onPatchDisplay({
            imageLayout,
          })}
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
