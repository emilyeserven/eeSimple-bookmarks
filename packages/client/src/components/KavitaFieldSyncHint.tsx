import type { ReactElement } from "react";

import { TriangleAlert } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import i18n from "@/i18n";

/**
 * Small inline warning icon for a form field whose value has drifted from what's currently on the
 * linked Kavita series. eeSimple Bookmarks has no write path to Kavita, so this is purely
 * informational — the tooltip names Kavita's current value so the user can update it there manually
 * if they want the two back in sync. Returns `null` while loading, on fetch failure, or when the
 * values already match, so it can be dropped straight into a field's `action` prop without an empty
 * wrapper affecting layout. Written as a function (not a component) so callers can call it directly.
 */
export function renderKavitaFieldSyncHint(
  /** Field name shown in the tooltip, e.g. "name" or "release year". */
  label: string,
  /** The book's current local value for this field. */
  localValue: string | number | null,
  /** The series' current live value on Kavita, or `undefined`/`null` while loading/unavailable. */
  kavitaValue: string | number | null | undefined,
): ReactElement | null {
  if (kavitaValue == null || kavitaValue === localValue) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={i18n.t("Out of sync with Kavita {{label}}", {
            label,
          })}
          className="
            shrink-0 text-amber-600
            dark:text-amber-500
          "
        >
          <TriangleAlert className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {i18n.t(
          "Kavita has {{label}}: {{value}}. eeSimple Bookmarks can't write to Kavita — update it there manually if this should change.",
          {
            label,
            value: kavitaValue,
          },
        )}
      </TooltipContent>
    </Tooltip>
  );
}
