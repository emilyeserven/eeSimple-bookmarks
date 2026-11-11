import type { MymindImportSummary } from "../lib/mymindImportRunner";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

/** Outcome of a finished mymind import: the counts plus every card that failed, with its reason. */
export function MymindImportResults({
  summary,
}: { summary: MymindImportSummary }) {
  const {
    t,
  } = useTranslation();
  const failures = summary.results.filter(result => result.outcome === "failed");
  return (
    <div className="space-y-2 rounded-md border p-3 text-sm">
      <p className="font-medium">
        {t("{{created}} bookmarks created, {{duplicates}} already saved, {{failed}} failed, {{tags}} new tags.", {
          created: summary.created,
          duplicates: summary.duplicates,
          failed: summary.failed,
          tags: summary.createdTagCount,
        })}
      </p>
      {summary.created > 0 && (
        <Link
          to="/bookmarks"
          className="underline"
        >
          {t("View bookmarks")}
        </Link>
      )}
      {failures.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {failures.map((failure, index) => (
            <li key={`${failure.title}-${index}`}>
              <span className="text-foreground">{failure.title}</span>
              {failure.url ? ` (${failure.url})` : ""}
              {failure.error ? ` — ${failure.error}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
