import type { AiUpdateReviewRow } from "../lib/bookmarkAiUpdateReview";

import { useTranslation } from "react-i18next";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslatedLabel } from "@/hooks/useTranslatedLabel";

interface Props {
  rows: AiUpdateReviewRow[];
  /** Row keys the user unchecked — everything changed is applied unless excluded. */
  excluded: ReadonlySet<string>;
  onToggle: (key: string) => void;
  /** Keys present in the pasted JSON that were not checked / not recognized (surfaced muted). */
  ignoredKeys: string[];
}

/** One changed row: checkbox + label + `current → proposed`, with a created/dropped note. */
function ChangedRow({
  row, excluded, onToggle,
}: {
  row: AiUpdateReviewRow;
  excluded: ReadonlySet<string>;
  onToggle: (key: string) => void;
}) {
  const {
    t,
  } = useTranslation();
  const tLabel = useTranslatedLabel();
  const checkboxId = `ai-update-${row.key}`;
  return (
    <div className="flex items-start gap-1.5">
      <Checkbox
        id={checkboxId}
        className="mt-0.5"
        checked={!excluded.has(row.key)}
        onCheckedChange={() => onToggle(row.key)}
      />
      <Label
        htmlFor={checkboxId}
        className="text-sm font-normal"
      >
        <span className="font-medium">{tLabel(row.label)}</span>
        {": "}
        {row.current && (
          <>
            <span className="text-muted-foreground line-through">{row.current}</span>
            {" → "}
          </>
        )}
        <span>{row.proposed}</span>
        {row.creates && (
          <span className="text-xs text-muted-foreground">
            {" "}
            {t("(will be created)")}
          </span>
        )}
        {row.droppedOptions && row.droppedOptions.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {" "}
            {t("Ignored:")}
            {" "}
            {row.droppedOptions.join(", ")}
          </span>
        )}
      </Label>
    </div>
  );
}

/**
 * The Review list of the bookmark "AI" tab (the ReparentReviewList analogue): each changed field is
 * a checkbox row (kept unless unchecked), unchanged fields render muted with no checkbox, and
 * malformed values render their reason. Presentational — state lives in `useBookmarkAiUpdate`.
 */
export function BookmarkAiUpdateReviewList({
  rows, excluded, onToggle, ignoredKeys,
}: Props) {
  const {
    t,
  } = useTranslation();
  const tLabel = useTranslatedLabel();
  const changed = rows.filter(row => row.status === "changed");
  const same = rows.filter(row => row.status === "same");
  const invalid = rows.filter(row => row.status === "invalid");
  if (rows.length === 0 && ignoredKeys.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("No proposed changes found in the reply.")}</p>;
  }
  return (
    <div className="space-y-4 rounded-lg border p-3">
      {changed.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t("Proposed changes")}</p>
          {changed.map(row => (
            <ChangedRow
              key={row.key}
              row={row}
              excluded={excluded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
      {invalid.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t("Could not be applied")}</p>
          {invalid.map((row, index) => (
            <p
              key={`${row.key}-${index}`}
              className="text-sm text-destructive"
            >
              <span className="font-medium">{tLabel(row.label)}</span>
              {row.current ? ` (${row.current})` : ""}
              {": "}
              {row.invalidReason ? tLabel(row.invalidReason) : t("Invalid value")}
            </p>
          ))}
        </div>
      )}
      {same.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{t("Already up to date")}</p>
          {same.map(row => (
            <p
              key={row.key}
              className="text-sm text-muted-foreground"
            >
              <span className="font-medium">{tLabel(row.label)}</span>
              {": "}
              {row.proposed}
            </p>
          ))}
        </div>
      )}
      {ignoredKeys.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("Ignored keys:")}
          {" "}
          {ignoredKeys.join(", ")}
        </p>
      )}
    </div>
  );
}
