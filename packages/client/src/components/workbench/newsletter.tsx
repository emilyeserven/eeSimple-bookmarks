/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { Newsletter } from "@eesimple/types";

import { NewsletterGeneralForm } from "../NewsletterGeneralForm";
import { SourceAutofillDefaults } from "../SourceAutofillDefaults";

import { useDeleteNewsletter, useNewsletterById, useNewsletterBySlug } from "@/hooks/useNewsletters";

function NewsletterGeneralView({
  entity: newsletter,
}: {
  entity: Newsletter;
}) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(newsletter.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{newsletter.slug}</dd>
        {newsletter.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">Bookmarks</dt>
              <dd>{newsletter.bookmarkCount}</dd>
            </>
          )
          : null}
      </dl>
      <SourceAutofillDefaults
        kind="newsletter"
        category={newsletter.category}
        mediaTypeId={newsletter.mediaTypeId}
        tagIds={newsletter.tagIds}
      />
    </div>
  );
}

/** Single source of truth for a newsletter's tabbed view/edit UI (main pane routes + right panel). */
export const newsletterWorkbench: EntityWorkbench<Newsletter> = {
  useBySlug: (slug) => {
    const {
      newsletter, isLoading,
    } = useNewsletterBySlug(slug);
    return {
      entity: newsletter,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      newsletter, isLoading, error,
    } = useNewsletterById(id);
    return {
      entity: newsletter,
      isLoading,
      error,
    };
  },
  name: newsletter => newsletter.name,
  useDelete: () => {
    const mutation = useDeleteNewsletter();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Newsletter not found.",
  navAriaLabel: "Newsletter sections",
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Newsletter details and defaults.",
        render: NewsletterGeneralView,
      },
      edit: {
        title: "General",
        description: "Newsletter name and the default category, tags, and media type applied to imported bookmarks.",
        render: ({
          entity,
        }) => <NewsletterGeneralForm newsletter={entity} />,
      },
    },
  ],
};
