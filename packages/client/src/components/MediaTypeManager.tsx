import type { MediaType } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { z } from "zod";

import { LabeledSection } from "./LabeledSection";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { useCreateMediaType, useDeleteMediaType, useMediaTypes, useUpdateMediaType } from "../hooks/useMediaTypes";
import { useAppForm } from "../lib/form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** A single editable media-type row: rename and/or reorder. Built-ins can't be renamed or deleted. */
export function MediaTypeRow({
  mediaType,
  onSaved,
}: { mediaType: MediaType;
  onSaved?: () => void; }) {
  const updateMediaType = useUpdateMediaType();
  const deleteMediaType = useDeleteMediaType();
  const [name, setName] = useState(mediaType.name);
  const [sortOrder, setSortOrder] = useState(String(mediaType.sortOrder));

  const parsedSort = Number(sortOrder);
  const dirty
    = name.trim() !== mediaType.name
      || (Number.isFinite(parsedSort) && parsedSort !== mediaType.sortOrder);
  const valid = name.trim().length > 0 && Number.isFinite(parsedSort);

  function save(): void {
    if (!dirty || !valid || mediaType.builtIn) return;
    updateMediaType.mutate(
      {
        id: mediaType.id,
        input: {
          name: name.trim(),
          sortOrder: parsedSort,
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
        <div
          className="
            grid gap-3
            sm:grid-cols-[1fr_8rem_auto] sm:items-end
          "
        >
          <div className="space-y-1">
            <Label htmlFor={`media-type-name-${mediaType.id}`}>Name</Label>
            <Input
              id={`media-type-name-${mediaType.id}`}
              value={name}
              disabled={mediaType.builtIn}
              onChange={event => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`media-type-sort-${mediaType.id}`}>Sort order</Label>
            <Input
              id={`media-type-sort-${mediaType.id}`}
              type="number"
              value={sortOrder}
              disabled={mediaType.builtIn}
              onChange={event => setSortOrder(event.target.value)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!dirty || !valid || mediaType.builtIn || updateMediaType.isPending}
            onClick={save}
          >
            {updateMediaType.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
        {mediaType.builtIn
          ? (
            <p className="text-xs text-muted-foreground">
              Built-in media type — it can&apos;t be renamed or deleted.
            </p>
          )
          : null}
      </LabeledSection>

      {mediaType.builtIn
        ? null
        : (
          <>
            <Separator />
            <LabeledSection
              title="Delete"
              description="Permanently remove this media type."
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="
                  text-destructive
                  hover:text-destructive
                "
                disabled={deleteMediaType.isPending}
                onClick={() => deleteMediaType.mutate(mediaType.id)}
              >
                {deleteMediaType.isPending ? "Deleting…" : "Delete"}
              </Button>
            </LabeledSection>
          </>
        )}

      {updateMediaType.isError
        ? <p className="text-sm text-destructive">{updateMediaType.error.message}</p>
        : null}
      {deleteMediaType.isError
        ? <p className="text-sm text-destructive">{deleteMediaType.error.message}</p>
        : null}
    </div>
  );
}

/** Read-only display card for a single media type. Shared by the view page and the right panel's View body. */
export function MediaTypeCard({
  mediaType,
}: { mediaType: MediaType }) {
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold">{mediaType.name}</h2>
          {mediaType.builtIn
            ? <Badge variant="outline">Built-in</Badge>
            : null}
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link
            to="/taxonomies/media-types/$mediaTypeSlug/edit"
            params={{
              mediaTypeSlug: mediaType.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "media-type", mediaType.id)}
          >
            Edit
          </Link>
        </Button>
      </div>

      <Separator />

      <LabeledSection title="Details">
        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Added</dt>
          <dd>{new Date(mediaType.createdAt).toLocaleDateString()}</dd>
          <dt className="text-muted-foreground">Slug</dt>
          <dd className="font-mono">{mediaType.slug}</dd>
          <dt className="text-muted-foreground">Sort order</dt>
          <dd>{mediaType.sortOrder}</dd>
          {mediaType.bookmarkCount != null
            ? (
              <>
                <dt className="text-muted-foreground">Bookmarks</dt>
                <dd>{mediaType.bookmarkCount}</dd>
              </>
            )
            : null}
        </dl>
      </LabeledSection>
    </div>
  );
}

const addMediaTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

/** Inline "add a media type" form — adds a custom media type alongside the built-ins. */
function AddMediaTypeForm() {
  const createMediaType = useCreateMediaType();

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: addMediaTypeSchema,
    },
    onSubmit: ({
      value,
    }) => {
      createMediaType.mutate(
        {
          name: value.name.trim(),
        },
        {
          onSuccess: () => form.reset(),
        },
      );
    },
  });

  return (
    <RowCard className="p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <div
          className="
            grid gap-3
            sm:grid-cols-[1fr_auto] sm:items-end
          "
        >
          <form.AppField name="name">
            {field => (
              <field.TextField
                label="Name"
                placeholder="e.g. Newsletter"
              />
            )}
          </form.AppField>
          <form.AppForm>
            <form.SubmitButton
              label="Add media type"
              pendingLabel="Adding…"
            />
          </form.AppForm>
        </div>
        {createMediaType.isError
          ? <p className="mt-2 text-sm text-destructive">{createMediaType.error.message}</p>
          : null}
      </form>
    </RowCard>
  );
}

/** Browsable, searchable media-type listing with add form. Shared by the Media Types taxonomy page and the Settings page. */
export function MediaTypesListing() {
  const {
    data: allMediaTypes, isLoading, error,
  } = useMediaTypes();
  const [search, setSearch] = useState("");
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);

  const filtered = (allMediaTypes ?? []).filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <AddMediaTypeForm />

      <div className="space-y-4">
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="max-w-sm"
        />

        {isLoading ? <p className="text-muted-foreground">Loading media types…</p> : null}
        {error ? <p className="text-destructive">{error.message}</p> : null}
        {!isLoading && (allMediaTypes?.length ?? 0) === 0
          ? (
            <p className="text-muted-foreground">
              No media types yet. Add one above.
            </p>
          )
          : null}
        {!isLoading && (allMediaTypes?.length ?? 0) > 0 && filtered.length === 0
          ? (
            <p className="text-muted-foreground">
              No media types match &ldquo;{search}&rdquo;.
            </p>
          )
          : null}

        {filtered.length > 0
          ? (
            <ul className="space-y-2">
              {filtered.map(mediaType => (
                <li key={mediaType.id}>
                  <RowCard className="group relative">
                    <Link
                      to="/taxonomies/media-types/$mediaTypeSlug"
                      params={{
                        mediaTypeSlug: mediaType.slug,
                      }}
                      title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                      onClick={event => viewClick(event, "media-type", mediaType.id)}
                      className="
                        flex items-center gap-3 rounded-lg p-4 pr-12
                        transition-colors
                        hover:bg-accent
                      "
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{mediaType.name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {mediaType.builtIn ? "Built-in" : "Custom"}
                        </p>
                      </div>
                      {mediaType.bookmarkCount !== undefined
                        ? <Badge variant="secondary">{mediaType.bookmarkCount}</Badge>
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
                        to="/taxonomies/media-types/$mediaTypeSlug/edit"
                        params={{
                          mediaTypeSlug: mediaType.slug,
                        }}
                        title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                        onClick={event => editClick(event, "media-type", mediaType.id)}
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Edit {mediaType.name}</span>
                      </Link>
                    </Button>
                  </RowCard>
                </li>
              ))}
            </ul>
          )
          : null}
      </div>
    </div>
  );
}
