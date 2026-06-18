import type { Website } from "@eesimple/types";

import { LabeledSection } from "./LabeledSection";
import { LinkPreview } from "./LinkPreview";

/** Live link-cleanup preview for a website built from the current (possibly unsaved) edits. */
export function WebsitePreviewSection({
  website,
}: { website: Website }) {
  return (
    <LabeledSection
      title="Preview"
      description="Uses the edits above."
    >
      <LinkPreview
        websites={[website]}
        ignoreList={[]}
        label=""
        placeholder="Paste a link on this site…"
      />
    </LabeledSection>
  );
}
