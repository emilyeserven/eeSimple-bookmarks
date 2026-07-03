import { createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { usePersonBySlug, useDeletePerson } from "../hooks/usePeople";

export const Route = createFileRoute("/taxonomies/people/$personSlug/_view")({
  component: PersonViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/people/$personSlug/general",
    label: "General",
  },
] as const;

function PersonViewLayout() {
  const {
    personSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    person, isLoading,
  } = usePersonBySlug(personSlug);
  const deletePerson = useDeletePerson();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {person
                ? (
                  <RomanizedLabel
                    name={person.name}
                    romanized={person.romanizedName}
                  />
                )
                : (isLoading ? "Person" : "Person not found")}
            </h1>
            {person
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
                      to: "/taxonomies/people/$personSlug/edit/general",
                      params: {
                        personSlug,
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
                    disabled={deletePerson.isPending}
                    onClick={() => deletePerson.mutate(person.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/people",
                      }),
                    })}
                  >
                    {deletePerson.isPending ? "Deleting…" : "Delete"}
                  </button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        personSlug,
      }}
      navAriaLabel="Person sections"
    />
  );
}
