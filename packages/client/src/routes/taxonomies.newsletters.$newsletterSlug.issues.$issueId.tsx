import type { ImportSummary } from "@eesimple/types";

import { useState } from "react";

import { Link, createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { NewsletterIssueBookmarksDialog } from "../components/NewsletterIssueBookmarksDialog";
import { useNewsletterIssues } from "../hooks/useImports";
import { useNewsletterBySlug } from "../hooks/useNewsletters";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/newsletters/$newsletterSlug/issues/$issueId")({
  validateSearch: validateBookmarkSearch,
  component: NewsletterIssueBookmarksPage,
});

function NewsletterIssueBookmarksPage() {
  const {
    newsletterSlug, issueId,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [manageOpen, setManageOpen] = useState(false);

  const {
    categories,
    properties,
    propertyGroups,
    bookmarks,
    bookmarksLoading,
    error,
    tagTree,
    mediaTypes,
    youtubeChannels,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  } = useCategoryPageData(tagsForServerQuery(search));

  const {
    newsletter, isLoading: newsletterLoading,
  } = useNewsletterBySlug(newsletterSlug);
  const {
    data: issues,
  } = useNewsletterIssues(newsletter?.id ?? "");
  const issue = (issues ?? []).find(i => i.id === issueId);

  if (newsletterLoading) {
    return <p className="text-muted-foreground">Loading newsletter…</p>;
  }
  if (!newsletter) {
    return <p className="text-destructive">Newsletter not found.</p>;
  }

  const allBookmarks = bookmarks ?? [];
  const issueBookmarks = allBookmarks.filter(b => b.import?.id === issueId);
  const issueLabel = issue?.title || (issue ? new Date(issue.createdAt).toLocaleDateString() : "Issue");

  return (
    <>
      <BookmarkSearchView
        header={(
          <div className="space-y-1">
            <Link
              to="/taxonomies/newsletters/$newsletterSlug"
              params={{
                newsletterSlug,
              }}
              className="
                inline-block text-sm text-muted-foreground
                hover:text-foreground
              "
            >
              ← Back to {newsletter.name}
            </Link>
            <div className="flex items-start justify-between gap-4">
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <Mail className="size-6 shrink-0" />
                {issueLabel}
              </h1>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setManageOpen(true)}
              >
                Manage bookmarks
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{newsletter.name}</p>
            {issue && <IssueUrlDisposition issue={issue} />}
          </div>
        )}
        pageKey={`newsletter-issue:${issueId}`}
        tree={tagTree ?? []}
        properties={properties ?? []}
        propertyGroups={propertyGroups ?? []}
        categories={categories ?? []}
        mediaTypes={mediaTypes ?? []}
        youtubeChannels={youtubeChannels ?? []}
        relationshipTypes={relationshipTypes ?? []}
        people={people ?? []}
        placeTypes={placeTypes ?? []}
        genreMoods={genreMoods ?? []}
        bookmarks={issueBookmarks}
        search={search}
        onSearchChange={next => navigate({
          search: next,
          replace: true,
          resetScroll: false,
        })}
        isLoading={bookmarksLoading}
        error={error}
        emptyMessage="No bookmarks in this issue yet."
        noMatchMessage="No bookmarks in this issue match these filters."
      />

      <NewsletterIssueBookmarksDialog
        importId={issueId}
        allBookmarks={allBookmarks}
        memberIds={issueBookmarks.map(b => b.id)}
        open={manageOpen}
        onOpenChange={setManageOpen}
      />
    </>
  );
}

const DISPOSITION_ITEMS: { key: keyof Pick<ImportSummary, "allowedUrls" | "blockedUrls" | "rejectedUrls" | "pendingUrls">;
  label: string; }[] = [
  {
    key: "allowedUrls",
    label: "allowed",
  },
  {
    key: "blockedUrls",
    label: "blocked",
  },
  {
    key: "rejectedUrls",
    label: "rejected",
  },
  {
    key: "pendingUrls",
    label: "pending",
  },
];

function IssueUrlDisposition({
  issue,
}: { issue: ImportSummary }) {
  const parts = DISPOSITION_ITEMS
    .map(({
      key, label,
    }) => ({
      count: issue[key].length,
      label,
    }))
    .filter(({
      count,
    }) => count > 0);
  if (parts.length === 0) return null;
  return (
    <p className="text-sm text-muted-foreground">
      {parts.map(({
        count, label,
      }, i) => (
        <span key={label}>
          {i > 0 && <span className="mx-1">·</span>}
          <span className="font-medium">{count}</span>
          {" "}
          {label}
        </span>
      ))}
    </p>
  );
}
