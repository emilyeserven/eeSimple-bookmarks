import type { EntityLayoutRecord } from "@eesimple/types";

/**
 * Format one invalid entity-layout row as a prompt-ready debug blob for the "Copy debug info" button
 * on Settings → Advanced → Layout Issues. Pure and stable so a test can pin the exact output — the
 * user pastes this straight into a prompt to get the corrupted layout fixed.
 */
export function formatLayoutIssueDebug(record: EntityLayoutRecord): string {
  const issues = record.issues ?? [];
  const issueLines = issues.length > 0 ? issues.map(issue => `- ${issue}`).join("\n") : "- (none reported)";
  const rawLayout = JSON.stringify(record.rawLayout ?? null, null, 2);
  return [
    "Entity layout issue",
    `Kind: ${record.entityKind}`,
    `Saved at: ${record.updatedAt}`,
    "Issues:",
    issueLines,
    "Raw stored layout:",
    rawLayout,
  ].join("\n");
}
