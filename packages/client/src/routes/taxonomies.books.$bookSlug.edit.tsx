import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useBookBySlug } from "../hooks/useBooks";

export const Route = createFileRoute("/taxonomies/books/$bookSlug/edit")({
  component: BookEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/books/$bookSlug/edit/general",
    label: "General",
  },
] as const;

function BookEditLayout() {
  const {
    bookSlug,
  } = Route.useParams();
  const {
    book, isLoading,
  } = useBookBySlug(bookSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/books/$bookSlug"
            params={{
              bookSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading ? "book" : (book?.name ?? "book")}
          </Link>
          <h1 className="text-2xl font-bold">Edit book</h1>
        </div>
      )}
      nav={editNav}
      params={{
        bookSlug,
      }}
      navAriaLabel="Book edit sections"
    />
  );
}
