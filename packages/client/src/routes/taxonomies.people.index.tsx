import { createFileRoute } from "@tanstack/react-router";

import { PeopleListing } from "../components/PersonManager";
import { usePeople } from "../hooks/usePeople";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/people/")({
  component: PeopleTaxonomyPage,
});

/** Browse view for the People taxonomy: every person with search filtering. */
function PeopleTaxonomyPage() {
  const {
    data: allPeople,
  } = usePeople();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">People</h1>
          {allPeople
            ? (
              <Badge variant="secondary">
                {allPeople.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Browse the People taxonomy. Create an person, then assign them to bookmarks.
        </p>
      </div>

      <PeopleListing />
    </section>
  );
}
