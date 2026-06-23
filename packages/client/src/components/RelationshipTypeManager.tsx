import type { RelationshipType } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { ArrowRight, Info, Link2, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import {
  useCreateRelationshipType,
  useRelationshipTypes,
} from "../hooks/useRelationshipTypes";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { withRelationshipTypes } from "@/lib/bookmarkSearch";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/** A single relationship-type listing card: body → its filtered bookmarks, with hover Edit / Info. */
function RelationshipTypeCard({
  relationshipType,
}: { relationshipType: RelationshipType }) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <StandardListingCard
      icon={<Link2 className="size-5 shrink-0 text-muted-foreground" />}
      title={relationshipType.name}
      titleAdornment={relationshipType.builtIn
        ? <Badge variant="secondary">Built-in</Badge>
        : undefined}
      subtitle={relationshipType.directional ? "Directional" : "Symmetric"}
      count={relationshipType.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/bookmarks"
          search={withRelationshipTypes({}, [relationshipType.id])}
          title={`Show bookmarks with a ${relationshipType.name} relationship`}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/relationship-types/$relationshipTypeSlug/edit"
            params={{
              relationshipTypeSlug: relationshipType.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "relationship-type", relationshipType.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {relationshipType.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/relationship-types/$relationshipTypeSlug/general"
            params={{
              relationshipTypeSlug: relationshipType.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "relationship-type", relationshipType.id, relationshipType.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {relationshipType.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}

/** Inline "add a relationship type" form. */
function AddRelationshipTypeRow() {
  const create = useCreateRelationshipType();
  const [name, setName] = useState("");
  const [directional, setDirectional] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    create.mutate(
      {
        name: trimmed,
        directional,
      },
      {
        onError: err => setError(err.message),
        onSuccess: () => {
          setName("");
          setDirectional(false);
          setError(null);
        },
      },
    );
  }

  return (
    <RowCard className="flex flex-wrap items-end gap-3 p-4">
      <div className="space-y-1">
        <Label
          htmlFor="new-relationship-type"
          className="text-xs text-muted-foreground"
        >
          New relationship type
        </Label>
        <Input
          id="new-relationship-type"
          value={name}
          placeholder="e.g. Inspiration"
          onChange={e => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          className="h-9 w-56"
        />
      </div>
      <label
        className="flex h-9 items-center gap-2 text-sm text-muted-foreground"
      >
        <Checkbox
          checked={directional}
          onCheckedChange={checked => setDirectional(checked === true)}
          aria-label="Directional"
        />
        Directional
      </label>
      <Button
        type="button"
        onClick={handleAdd}
        disabled={create.isPending || name.trim().length === 0}
      >
        Add
      </Button>
      {error ? <p className="w-full text-xs text-destructive">{error}</p> : null}
    </RowCard>
  );
}

/** Browsable relationship-type listing. Each card opens its filtered bookmarks; hover to Edit / view Info. */
export function RelationshipTypesListing() {
  const {
    data: relationshipTypes, isLoading, error,
  } = useRelationshipTypes();

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        Directional types
        {" ("}
        <ArrowRight className="inline size-3" />
        ) read as parent → child and power the Hierarchy view; symmetric types read the same
        {" from either bookmark."}
      </p>

      {isLoading ? <p className="text-muted-foreground">Loading relationship types…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}

      <div className="space-y-2">
        {(relationshipTypes ?? []).map(rt => (
          <RelationshipTypeCard
            key={rt.id}
            relationshipType={rt}
          />
        ))}
      </div>

      <AddRelationshipTypeRow />
    </div>
  );
}
