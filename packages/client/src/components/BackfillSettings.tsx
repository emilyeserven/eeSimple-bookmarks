import { BookmarkImageBackfillCard, ChannelImageBackfillCard } from "./ImageBackfillCards";
import { TitleLocationBackfillCard, TitleTagBackfillCard } from "./TitleBackfillCards";

/**
 * Settings → Automations → Backfill: one-off scans over existing bookmarks/channels, grouped
 * separately from the live auto-apply toggles on the Global tab. Each card is its own component
 * (rather than one large function) to keep hook density under fallow's cognitive-complexity cap —
 * see CLAUDE.md's "Large-form / over-cap decomposition".
 */
export function BackfillSettings() {
  return (
    <>
      <TitleTagBackfillCard />
      <TitleLocationBackfillCard />
      <ChannelImageBackfillCard />
      <BookmarkImageBackfillCard />
    </>
  );
}
