import { createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useAuthorBySlug, useDeleteAuthor } from "../hooks/useAuthors";

export const Route = createFileRoute("/taxonomies/authors/$authorSlug/_view")({
  component: AuthorViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/authors/$authorSlug/general",
    label: "General",
  },
] as const;

function AuthorViewLayout() {
  const {
    authorSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    author, isLoading,
  } = useAuthorBySlug(authorSlug);
  const deleteAuthor = useDeleteAuthor();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? "Author" : (author?.name ?? "Author not found")}
            </h1>
            {author
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="
                      inline-flex items-center justify-center rounded-md border
                      bg-background px-3 py-1.5 text-sm font-medium
                      hover:bg-accent hover:text-accent-foreground
                    "
                    onClick={() => void navigate({
                      to: "/taxonomies/authors/$authorSlug/edit/general",
                      params: {
                        authorSlug,
                      },
                    })}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="
                      inline-flex items-center justify-center rounded-md px-3
                      py-1.5 text-sm font-medium text-destructive
                      hover:text-destructive/80
                    "
                    disabled={deleteAuthor.isPending}
                    onClick={() => deleteAuthor.mutate(author.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/authors",
                      }),
                    })}
                  >
                    {deleteAuthor.isPending ? "Deleting…" : "Delete"}
                  </button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        authorSlug,
      }}
      navAriaLabel="Author sections"
    />
  );
}
