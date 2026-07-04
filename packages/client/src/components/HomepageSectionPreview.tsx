import type { ConditionTree } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { LabeledSection } from "./LabeledSection";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";

interface HomepageSectionPreviewProps {
  conditions: ConditionTree;
}

export function HomepageSectionPreview({
  conditions,
}: HomepageSectionPreviewProps) {
  const {
    t,
  } = useTranslation();

  return (
    <LabeledSection
      title={t("Preview Bookmarks")}
      description={t("Test which existing bookmarks match the filter above.")}
    >
      <PreviewBookmarksSection
        conditions={conditions}
      />
    </LabeledSection>
  );
}
