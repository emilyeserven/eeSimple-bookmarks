import type { ConditionTree } from "@eesimple/types";

import { LabeledSection } from "./LabeledSection";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";

interface HomepageSectionPreviewProps {
  conditions: ConditionTree;
}

export function HomepageSectionPreview({
  conditions,
}: HomepageSectionPreviewProps) {
  return (
    <LabeledSection
      title="Preview Bookmarks"
      description="Test which existing bookmarks match the filter above."
    >
      <PreviewBookmarksSection
        conditions={conditions}
      />
    </LabeledSection>
  );
}
