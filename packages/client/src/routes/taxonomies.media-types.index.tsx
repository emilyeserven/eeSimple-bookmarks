import { createFileRoute } from "@tanstack/react-router";

import { MediaTypesListing } from "../components/MediaTypeManager";
import { useMediaTypes } from "../hooks/useMediaTypes";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/media-types/")({
  component: MediaTypesTaxonomyPage,
});

/** Browse view for the Media Types taxonomy: every known type with search filtering. */
function MediaTypesTaxonomyPage() {
  const {
    data: allMediaTypes,
  } = useMediaTypes();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Media Types</h1>
          {allMediaTypes
            ? (
              <Badge variant="secondary">
                {allMediaTypes.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Browse the Media Types taxonomy. Built-in types ship with the app; add your own below. Click
          a type to view or edit it.
        </p>
      </div>

      <MediaTypesListing />
    </section>
  );
}
