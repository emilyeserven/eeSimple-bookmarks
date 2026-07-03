import { Link, createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useBookBySlug, useDeleteBook } from "../hooks/useBooks";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/books/$bookSlug/_view")({
  component: BookViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/books/$bookSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/books/$bookSlug/image",
    label: "Image",
  },
] as const;

function BookViewLayout() {
  const {
    bookSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    book, isLoading,
  } = useBookBySlug(bookSlug);
  const deleteBook = useDeleteBook();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/books"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to books
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading
                ? "Book"
                : book
                  ? (
                    <RomanizedLabel
                      name={book.name}
                      romanized={book.romanizedName}
                    />
                  )
                  : "Book not found"}
            </h1>
            {book
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/taxonomies/books/$bookSlug/edit/general"
                      params={{
                        bookSlug,
                      }}
                    >
                      Edit
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="
                      text-destructive
                      hover:text-destructive
                    "
                    disabled={deleteBook.isPending}
                    onClick={() => deleteBook.mutate(book.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/books",
                      }),
                    })}
                  >
                    {deleteBook.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        bookSlug,
      }}
      navAriaLabel="Book sections"
    />
  );
}
