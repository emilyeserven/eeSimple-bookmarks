/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { Author } from "@eesimple/types";

import { AuthorGeneralForm } from "../AuthorGeneralForm";

import { useAuthorById, useAuthorBySlug, useDeleteAuthor } from "@/hooks/useAuthors";

function AuthorGeneralView({
  entity: author,
}: {
  entity: Author;
}) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Added</dt>
      <dd>{new Date(author.createdAt).toLocaleDateString()}</dd>
      <dt className="text-muted-foreground">Slug</dt>
      <dd className="font-mono">{author.slug}</dd>
      {author.bookmarkCount != null
        ? (
          <>
            <dt className="text-muted-foreground">Bookmarks</dt>
            <dd>{author.bookmarkCount}</dd>
          </>
        )
        : null}
    </dl>
  );
}

/** Single source of truth for an author's tabbed view/edit UI (main pane routes + right panel). */
export const authorWorkbench: EntityWorkbench<Author> = {
  useBySlug: (slug) => {
    const {
      author, isLoading,
    } = useAuthorBySlug(slug);
    return {
      entity: author,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      author, isLoading, error,
    } = useAuthorById(id);
    return {
      entity: author,
      isLoading,
      error: error ?? null,
    };
  },
  name: author => author.name,
  useDelete: () => {
    const mutation = useDeleteAuthor();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Author not found.",
  navAriaLabel: "Author sections",
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Author details.",
        render: AuthorGeneralView,
      },
      edit: {
        title: "General",
        description: "Edit the author's name.",
        render: ({
          entity,
        }) => <AuthorGeneralForm author={entity} />,
      },
    },
  ],
};
