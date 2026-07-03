import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AddMovieModal } from "../components/AddMovieModal";
import { MoviesListing } from "../components/MovieManager";
import { useSetListingPage } from "../hooks/useListingPage";
import { useMovies } from "../hooks/useMovies";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/movies/")({
  component: MoviesPage,
});

/** Browse view for Movies: every movie with search filtering. */
function MoviesPage() {
  const {
    data: allMovies,
  } = useMovies();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("movies-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New movie",
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Movies</h1>
          {allMovies
            ? (
              <Badge variant="secondary">
                {allMovies.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Individual movies, optionally grouped under a media property and linked to a Plex item.
          Bookmarks link to a movie here. Click one to view or edit it.
        </p>
      </div>

      <MoviesListing />

      <AddMovieModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(movie) => {
          void navigate({
            to: "/taxonomies/movies/$movieSlug/edit/general",
            params: {
              movieSlug: movie.slug,
            },
          });
        }}
      />
    </section>
  );
}
