import { Link, createFileRoute } from "@tanstack/react-router";

import { LocationForm } from "../components/LocationForm";

export const Route = createFileRoute("/taxonomies/locations/new")({
  component: NewLocationPage,
});

/** Full create form for a location — geocoding lookup, ancestor chain, alternate names, and tags. */
function NewLocationPage() {
  const navigate = Route.useNavigate();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <Link
          to="/taxonomies/locations"
          className="
            inline-block text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          ← Back to locations
        </Link>
        <h1 className="text-2xl font-bold">New location</h1>
        <p className="text-sm text-muted-foreground">
          Look up a place to autograb its coordinates, or fill the fields in by hand. Add higher-level
          locations below to create the whole chain (e.g. Hagi → Yamaguchi Prefecture → … → Japan) at once.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <LocationForm
          onCreated={location => void navigate({
            to: "/taxonomies/locations/$locationSlug/edit/general",
            params: {
              locationSlug: location.slug,
            },
          })}
        />
      </div>
    </section>
  );
}
