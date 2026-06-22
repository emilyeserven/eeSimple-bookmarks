import type { ImportItemStatus, ImportSummary } from "@eesimple/types";

import { Link, createFileRoute } from "@tanstack/react-router";
import { Mail, Trash2 } from "lucide-react";

import { StandardListingCard } from "../components/StandardListingCard";
import { useDeleteImport, useNewsletterIssues } from "../hooks/useImports";
import { useNewsletterBySlug } from "../hooks/useNewsletters";
import { notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/newsletters/$newsletterSlug/")({
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

/** A short "8 pending · 3 added" summary from an issue's per-status counts. */
function summaryLine(summary: ImportSummary): string {
  const parts = (Object.keys(STATUS_LABELS) as ImportItemStatus[])
    .filter(status => summary.statusCounts[status] > 0)
    .map(status => `${summary.statusCounts[status]} ${STATUS_LABELS[status]}`);
  return parts.length > 0 ? parts.join(" · ") : "No links extracted";
}

function NewsletterIssuesPage() {
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

  if (newsletterLoading) return <p className="text-muted-foreground">Loading newsletter…</p>;
  if (!newsletter) return <p className="text-destructive">Newsletter not found.</p>;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <Link
          to="/taxonomies/newsletters"
          className="
            inline-block text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          ← Back to newsletters
        </Link>
        <div className="flex items-start justify-between gap-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Mail className="size-6 shrink-0" />
            {newsletter.name}
          </h1>
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link
              to="/inbox/new"
              search={{
                newsletterId: newsletter.id,
              }}
            >
              Import an issue
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Issues imported for this newsletter. Open an issue to see its bookmarks.
        </p>
      </div>

      {issuesLoading
        ? <p className="text-sm text-muted-foreground">Loading issues…</p>
        : !issues || issues.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              No issues yet. Use “Import an issue” to paste, fetch, or upload a newsletter edition.
            </p>
          )
          : (
            <ul className="space-y-2">
              {issues.map(issue => (
                <li key={issue.id}>
                  <StandardListingCard
                    icon={<Mail className="size-4 text-muted-foreground" />}
                    title={issue.title || new Date(issue.createdAt).toLocaleDateString()}
                    subtitle={summaryLine(issue)}
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
                          onSuccess: () => notifySuccess("Issue deleted"),
                        })}
                        aria-label="Delete issue"
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
