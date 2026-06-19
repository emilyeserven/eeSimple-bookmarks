import type { PropertyGroup } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { LabeledSection } from "./LabeledSection";
import { useEditPanelClick } from "./panel/useEditPanelClick";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** Read-only display card for a single property group. Shared by the view page and the right panel's View body. */
export function PropertyGroupCard({
  group,
}: { group: PropertyGroup }) {
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold">{group.name}</h2>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link
            to="/taxonomies/property-groups/$propertyGroupSlug/edit"
            params={{
              propertyGroupSlug: group.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "property-group", group.id)}
          >
            Edit
          </Link>
        </Button>
      </div>

      {group.description
        ? <p className="text-sm text-muted-foreground">{group.description}</p>
        : null}

      <Separator />

      <LabeledSection title="Details">
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
      </LabeledSection>
    </div>
  );
}
