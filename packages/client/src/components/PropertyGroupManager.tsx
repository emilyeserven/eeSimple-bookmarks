import type { PropertyGroup } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { z } from "zod";

import { LabeledSection } from "./LabeledSection";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import {
  useCreatePropertyGroup,
  useDeletePropertyGroup,
  usePropertyGroups,
  useUpdatePropertyGroup,
} from "../hooks/usePropertyGroups";
import { useAppForm } from "../lib/form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** A single editable property-group row: rename, reprioritize, re-describe, and delete. */
export function PropertyGroupRow({
  group,
  onSaved,
}: { group: PropertyGroup;
  onSaved?: () => void; }) {
  const updateGroup = useUpdatePropertyGroup();
  const deleteGroup = useDeletePropertyGroup();
  const [name, setName] = useState(group.name);
  const [priority, setPriority] = useState(String(group.priority));
  const [description, setDescription] = useState(group.description ?? "");

  const parsedPriority = Number(priority);
  const dirty
    = name.trim() !== group.name
      || (Number.isFinite(parsedPriority) && parsedPriority !== group.priority)
      || description.trim() !== (group.description ?? "");
  const valid = name.trim().length > 0 && Number.isFinite(parsedPriority);

  function save(): void {
    if (!dirty || !valid) return;
    updateGroup.mutate(
      {
        id: group.id,
        input: {
          name: name.trim(),
          priority: parsedPriority,
          description: description.trim() || null,
        },
      },
      {
        onSuccess: () => onSaved?.(),
      },
    );
  }

  return (
    <div className="space-y-6">
      <LabeledSection title="Details">
        <div className="space-y-3">
          <div
            className="
              grid gap-3
              sm:grid-cols-[1fr_8rem_auto] sm:items-end
            "
          >
            <div className="space-y-1">
              <Label htmlFor={`property-group-name-${group.id}`}>Name</Label>
              <Input
                id={`property-group-name-${group.id}`}
                value={name}
                onChange={event => setName(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`property-group-priority-${group.id}`}>Priority</Label>
              <Input
                id={`property-group-priority-${group.id}`}
                type="number"
                value={priority}
                onChange={event => setPriority(event.target.value)}
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!dirty || !valid || updateGroup.isPending}
              onClick={save}
            >
              {updateGroup.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`property-group-description-${group.id}`}>Description</Label>
            <Textarea
              id={`property-group-description-${group.id}`}
              rows={2}
              placeholder="Optional — what this group is for."
              value={description}
              onChange={event => setDescription(event.target.value)}
            />
          </div>
        </div>
      </LabeledSection>

      <Separator />
      <LabeledSection
        title="Delete"
        description="Permanently remove this group. Its properties become ungrouped."
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="
            text-destructive
            hover:text-destructive
          "
          disabled={deleteGroup.isPending}
          onClick={() => deleteGroup.mutate(group.id)}
        >
          {deleteGroup.isPending ? "Deleting…" : "Delete"}
        </Button>
      </LabeledSection>

      {updateGroup.isError
        ? <p className="text-sm text-destructive">{updateGroup.error.message}</p>
        : null}
      {deleteGroup.isError
        ? <p className="text-sm text-destructive">{deleteGroup.error.message}</p>
        : null}
    </div>
  );
}

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

const addPropertyGroupSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  priority: z.number().int(),
});

/** Inline "add a property group" form. */
function AddPropertyGroupForm() {
  const createGroup = useCreatePropertyGroup();

  const form = useAppForm({
    defaultValues: {
      name: "",
      priority: 0,
    },
    validators: {
      onChange: addPropertyGroupSchema,
    },
    onSubmit: ({
      value,
    }) => {
      createGroup.mutate(
        {
          name: value.name.trim(),
          priority: value.priority,
        },
        {
          onSuccess: () => form.reset(),
        },
      );
    },
  });

  return (
    <form
      className="rounded-lg border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div
        className="
          grid gap-3
          sm:grid-cols-[1fr_8rem_auto] sm:items-end
        "
      >
        <form.AppField name="name">
          {field => (
            <field.TextField
              label="Name"
              placeholder="e.g. Ratings"
            />
          )}
        </form.AppField>
        <form.AppField name="priority">
          {field => (
            <field.NumberField
              label="Priority"
              hint="Lower sorts first."
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton
            label="Add group"
            pendingLabel="Adding…"
          />
        </form.AppForm>
      </div>
      {createGroup.isError
        ? <p className="mt-2 text-sm text-destructive">{createGroup.error.message}</p>
        : null}
    </form>
  );
}

/** Browsable, searchable property-group listing with add form. */
export function PropertyGroupsListing() {
  const {
    data: allGroups, isLoading, error,
  } = usePropertyGroups();
  const [search, setSearch] = useState("");
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);

  const filtered = (allGroups ?? []).filter((g) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return g.name.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <AddPropertyGroupForm />

      <div className="space-y-4">
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="max-w-sm"
        />

        {isLoading ? <p className="text-muted-foreground">Loading property groups…</p> : null}
        {error ? <p className="text-destructive">{error.message}</p> : null}
        {!isLoading && (allGroups?.length ?? 0) === 0
          ? (
            <p className="text-muted-foreground">
              No property groups yet. Add one above.
            </p>
          )
          : null}
        {!isLoading && (allGroups?.length ?? 0) > 0 && filtered.length === 0
          ? (
            <p className="text-muted-foreground">
              No property groups match &ldquo;{search}&rdquo;.
            </p>
          )
          : null}

        {filtered.length > 0
          ? (
            <ul className="space-y-2">
              {filtered.map(group => (
                <li
                  key={group.id}
                  className="group relative rounded-lg border bg-card"
                >
                  <Link
                    to="/taxonomies/property-groups/$propertyGroupSlug"
                    params={{
                      propertyGroupSlug: group.slug,
                    }}
                    title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                    onClick={event => viewClick(event, "property-group", group.id)}
                    className="
                      flex items-center gap-3 rounded-lg p-4 pr-12
                      transition-colors
                      hover:bg-accent
                    "
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{group.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {group.description || `Priority ${group.priority}`}
                      </p>
                    </div>
                    {group.propertyCount !== undefined
                      ? <Badge variant="secondary">{group.propertyCount}</Badge>
                      : null}
                  </Link>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="
                      absolute top-1/2 right-2 -translate-y-1/2 opacity-0
                      transition-opacity
                      group-hover:opacity-100
                      focus-visible:opacity-100
                    "
                  >
                    <Link
                      to="/taxonomies/property-groups/$propertyGroupSlug/edit"
                      params={{
                        propertyGroupSlug: group.slug,
                      }}
                      title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                      onClick={event => editClick(event, "property-group", group.id)}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Edit {group.name}</span>
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )
          : null}
      </div>
    </div>
  );
}
