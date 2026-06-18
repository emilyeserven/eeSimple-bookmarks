import { createFileRoute } from "@tanstack/react-router";

import { PropertyGroupTabWrapper } from "../components/PropertyGroupTabWrapper";

export const Route = createFileRoute(
  "/taxonomies/property-groups/$propertyGroupSlug/_view/general",
)({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    propertyGroupSlug,
  } = Route.useParams();
  return (
    <PropertyGroupTabWrapper
      propertyGroupSlug={propertyGroupSlug}
      title="General"
      description="Name, priority, description, and metadata."
    >
      {group => (
        <div className="space-y-4">
          {group.description
            ? <p className="text-sm text-muted-foreground">{group.description}</p>
            : null}
          <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Added</dt>
            <dd>{new Date(group.createdAt).toLocaleDateString()}</dd>
            <dt className="text-muted-foreground">Slug</dt>
            <dd className="font-mono">{group.slug}</dd>
            <dt className="text-muted-foreground">Priority</dt>
            <dd>{group.priority}</dd>
            {group.propertyCount != null
              ? (
                <>
                  <dt className="text-muted-foreground">Properties</dt>
                  <dd>{group.propertyCount}</dd>
                </>
              )
              : null}
          </dl>
        </div>
      )}
    </PropertyGroupTabWrapper>
  );
}
