import type { NewsletterImportItemStatus, NewsletterImportSummary } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

import { StandardListingCard } from "./StandardListingCard";
import { useDeleteNewsletterImport, useNewsletterImports } from "../hooks/useNewsletterImports";
import { notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";

const SOURCE_LABELS: Record<NewsletterImportSummary["source"], string> = {
  paste: "Pasted content",
  url: "Fetched URL",
  upload: "Uploaded file",
};

const STATUS_LABELS: Partial<Record<NewsletterImportItemStatus, string>> = {
  pending: "pending",
  approved: "added",
  duplicate: "duplicate",
  rejected: "rejected",
  error: "error",
};

/** A short "8 pending · 3 added · 1 duplicate" summary from an import's per-status counts. */
function summaryLine(summary: NewsletterImportSummary): string {
  const parts = (Object.keys(STATUS_LABELS) as NewsletterImportItemStatus[])
    .filter(status => summary.statusCounts[status] > 0)
    .map(status => `${summary.statusCounts[status]} ${STATUS_LABELS[status]}`);
  return parts.length > 0 ? parts.join(" · ") : "No links extracted";
}

/** Listing of past newsletter imports, each linking to its review queue. */
export function NewsletterImportList() {
  const {
    data: imports, isLoading, error,
  } = useNewsletterImports();
  const remove = useDeleteNewsletterImport();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading imports…</p>;
  if (error) return <p className="text-sm text-destructive">Couldn&apos;t load newsletter imports.</p>;
  if (!imports || imports.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No imports yet. Use the &ldquo;New&rdquo; button to paste, fetch, or upload a newsletter.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {imports.map(summary => (
        <li key={summary.id}>
          <StandardListingCard
            title={summary.title || SOURCE_LABELS[summary.source]}
            subtitle={summaryLine(summary)}
            count={summary.itemCount}
            renderPrimaryLink={(className, children) => (
              <Link
                to="/newsletters/$importId"
                params={{
                  importId: summary.id,
                }}
                className={className}
              >
                {children}
              </Link>
            )}
            renderEdit={() => (
              <Button
                variant="ghost"
                size="icon"
                className="
                  shrink-0 opacity-0 transition-opacity
                  group-hover:opacity-100
                  focus-visible:opacity-100
                "
                onClick={() =>
                  remove.mutate(summary.id, {
                    onSuccess: () => notifySuccess("Import deleted"),
                  })}
                aria-label="Delete import"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          />
        </li>
      ))}
    </ul>
  );
}
