import type { ImportItemStatus, ImportSummary } from "@eesimple/types";

import { Link, createFileRoute } from "@tanstack/react-router";
import { Mail, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { StandardListingCard } from "../components/StandardListingCard";
import { useDeleteImport, useNewsletterIssues } from "../hooks/useImports";
import { useNewsletterBySlug } from "../hooks/useNewsletters";
import { notifySuccess } from "../lib/notifications";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/newsletters/$newsletterSlug/_hub/")({
  component: NewsletterIssuesPage,
});

const STATUS_LABELS: Partial<Record<ImportItemStatus, string>> = {
  pending: "pending",
  approved: "added",
  duplicate: "duplicate",
  rejected: "rejected",
  error: "error",
  blocked: "blocked",
};

/** A short "8 pending · 3 added" summary from an import group's per-status counts. */
function summaryLine(summary: ImportSummary): string {
  const parts = (Object.keys(STATUS_LABELS) as ImportItemStatus[])
    .filter(status => summary.statusCounts[status] > 0)
    .map(status => `${summary.statusCounts[status]} ${STATUS_LABELS[status]}`);
  return parts.length > 0 ? parts.join(" · ") : "No links extracted";
}

/**
 * A persistent URL disposition line showing how URLs were ultimately handled (survives item purges).
 * Pending comes from live items; allowed/blocked/rejected are stored on the import row.
 */
function urlDispositionLine(summary: ImportSummary): string {
  const parts: string[] = [
    summary.allowedUrls.length > 0 ? `${summary.allowedUrls.length} allowed` : "",
    summary.blockedUrls.length > 0 ? `${summary.blockedUrls.length} blocked` : "",
    summary.rejectedUrls.length > 0 ? `${summary.rejectedUrls.length} rejected` : "",
    summary.pendingUrls.length > 0 ? `${summary.pendingUrls.length} pending` : "",
  ].filter(Boolean);
  return parts.join(" · ");
}

function NewsletterIssuesPage() {
  const {
    t,
  } = useTranslation();
  const {
    newsletterSlug,
  } = Route.useParams();
  const {
    newsletter, isLoading: newsletterLoading,
  } = useNewsletterBySlug(newsletterSlug);
  const {
    data: issues, isLoading: issuesLoading,
  } = useNewsletterIssues(newsletter?.id ?? "");
  const removeIssue = useDeleteImport();
  const setAddImportModalOpen = useUiStore(s => s.setAddImportModalOpen);
  const setImportModalInitialNewsletterId = useUiStore(s => s.setImportModalInitialNewsletterId);

  if (newsletterLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!newsletter) return <p className="text-destructive">Import not found.</p>;

  const newsletterId = newsletter.id;

  function openImportModal() {
    setImportModalInitialNewsletterId(newsletterId);
    setAddImportModalOpen(true);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Import groups for this import. Open an import group to see its bookmarks.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={openImportModal}
        >
          Add import group
        </Button>
      </div>

      {issuesLoading
        ? <p className="text-sm text-muted-foreground">Loading import groups…</p>
        : !issues || issues.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              No import groups yet. Use &ldquo;Add import group&rdquo; to paste, fetch, or upload content.
            </p>
          )
          : (
            <ul className="space-y-2">
              {issues.map(issue => (
                <li key={issue.id}>
                  <StandardListingCard
                    icon={<Mail className="size-4 text-muted-foreground" />}
                    title={issue.title || new Date(issue.createdAt).toLocaleDateString()}
                    subtitle={[summaryLine(issue), urlDispositionLine(issue)].filter(Boolean).join(" | ")}
                    count={issue.statusCounts.approved}
                    renderPrimaryLink={(className, children) => (
                      <Link
                        to="/taxonomies/newsletters/$newsletterSlug/issues/$issueId"
                        params={{
                          newsletterSlug,
                          issueId: issue.id,
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
                        onClick={() => removeIssue.mutate(issue.id, {
                          onSuccess: () => notifySuccess(t("Import group deleted")),
                        })}
                        aria-label="Delete import group"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  />
                </li>
              ))}
            </ul>
          )}
    </section>
  );
}
