import type { FillRead } from "../fill/fillExtract";

/*
 * The picker → popup handoff. The in-page picker can't talk to the popup (an MV3 action popup closes
 * the moment the page takes focus), so it writes its result to `storage.local` under this key and the
 * next popup open picks it up.
 */

export const PENDING_SELECTOR_KEY = "eesimple:pendingSelector";

/** The picker's interaction mode. */
export type PickerMode = "single" | "list" | "section" | "generalize";

/** The selectors a Section pick collects (item, name, link, group header). */
export interface PickedSection {
  itemSelector: string;
  container: string;
  itemName: string;
  itemUrl: string;
  resolveItemUrl: boolean;
  sectionHeaderSelector: string;
}

/** What the picker stores for the popup. */
export interface PendingSelector {
  mode: PickerMode;
  selector: string;
  label: string;
  read?: FillRead | null;
  sampleValue?: string;
  matchCount?: number;
  section?: PickedSection;
  /** Set when stored: the pick time (for the TTL) and the page it was made on. */
  ts?: number;
  url?: string;
}
