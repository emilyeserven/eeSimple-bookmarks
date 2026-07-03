import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AddBookModal } from "../components/AddBookModal";
import { BooksListing } from "../components/BookManager";
import { useBooks } from "../hooks/useBooks";
import { useSetListingPage } from "../hooks/useListingPage";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/books/")({
  component: BooksPage,
});

/** Browse view for Books: every book with search filtering. */
function BooksPage() {
  const {
    data: allBooks,
  } = useBooks();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("books-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New book",
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Books</h1>
          {allBooks
            ? (
              <Badge variant="secondary">
                {allBooks.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Individual books, optionally grouped under a media property and linked to a Kavita series.
          Bookmarks link to a book here. Click one to view or edit it.
        </p>
      </div>

      <BooksListing />

      <AddBookModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(book) => {
          void navigate({
            to: "/taxonomies/books/$bookSlug/edit/general",
            params: {
              bookSlug: book.slug,
            },
          });
        }}
      />
    </section>
  );
}
