import type { Book, KavitaSeriesResult } from "@eesimple/types";

import { useState } from "react";

import { BookOpen, X } from "lucide-react";

import { AddMediaPropertyModal } from "./AddMediaPropertyModal";
import { KavitaSeriesLookup } from "./KavitaSeriesLookup";
import { useCreateBook } from "../hooks/useBooks";
import { useMediaProperties } from "../hooks/useMediaProperties";

import { Combobox } from "@/components/Combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** The Kavita linkage a lookup fills in; held together so the "linked" chip and payload stay in sync. */
interface KavitaLink {
  kavitaSeriesId: number | null;
  kavitaLibraryId: number | null;
  kavitaSeriesName: string | null;
  releaseYear: number | null;
}

const EMPTY_KAVITA: KavitaLink = {
  kavitaSeriesId: null,
  kavitaLibraryId: null,
  kavitaSeriesName: null,
  releaseYear: null,
};

interface BookFormProps {
  /** Called with the created book (e.g. to select it in the opener, or navigate to its edit page). */
  onCreated?: (book: Book) => void;
}

/**
 * Create form for a Book. Modeled on the Locations create form: enter a name, or look the book up on
 * Kavita to autofill the name / series linkage / release year. Optionally group it under a media
 * property. Submit-driven (create keeps a Save button); the edit tabs auto-save.
 *
 * The media-property picker intentionally uses the manual `useState` + `AddMediaPropertyModal`
 * pattern rather than `useEntityCreateOption` — `AddBookModal` wraps this component, and
 * `useEntityCreateOption`'s registry imports `AddBookModal` for the `"book"` entry, so this form
 * calling the hook would create an import cycle (`AddBookModal` → `BookForm` → `useEntityCreateOption`
 * → `AddBookModal`). Same rationale as `LocationForm`.
 */
export function BookForm({
  onCreated,
}: BookFormProps) {
  const createBook = useCreateBook();
  const {
    data: mediaProperties,
  } = useMediaProperties();

  const [name, setName] = useState("");
  const [mediaPropertyId, setMediaPropertyId] = useState<string>("");
  const [kavita, setKavita] = useState<KavitaLink>(EMPTY_KAVITA);
  const [addMediaPropertyOpen, setAddMediaPropertyOpen] = useState(false);

  function applyCandidate(series: KavitaSeriesResult) {
    // Fill the name only when empty, so a deliberate title isn't overwritten by a search pick.
    setName(current => current.trim() || series.name);
    setKavita({
      kavitaSeriesId: series.seriesId,
      kavitaLibraryId: series.libraryId,
      kavitaSeriesName: series.name,
      releaseYear: series.releaseYear,
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    createBook.mutate(
      {
        name: trimmed,
        mediaPropertyId: mediaPropertyId || null,
        ...kavita,
      },
      {
        onSuccess: onCreated,
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <KavitaSeriesLookup onSelect={applyCandidate} />

      <div className="space-y-1.5">
        <Label htmlFor="book-name">Name</Label>
        <Input
          id="book-name"
          placeholder="e.g. The Fellowship of the Ring"
          value={name}
          onChange={event => setName(event.target.value)}
          autoFocus
        />
      </div>

      {kavita.kavitaSeriesId !== null
        ? (
          <div
            className="
              flex items-center gap-2 rounded-md border px-3 py-2 text-sm
            "
          >
            <BookOpen className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">
              Linked to Kavita: {kavita.kavitaSeriesName ?? `Series #${kavita.kavitaSeriesId}`}
              {kavita.releaseYear ? ` (${kavita.releaseYear})` : ""}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              aria-label="Clear Kavita link"
              onClick={() => setKavita(EMPTY_KAVITA)}
            >
              <X className="size-4" />
            </Button>
          </div>
        )
        : null}

      <div className="space-y-1.5">
        <Label>Media property</Label>
        <Combobox
          aria-label="Media property"
          options={(mediaProperties ?? []).map(prop => ({
            value: prop.id,
            label: prop.name,
          }))}
          value={mediaPropertyId || undefined}
          onValueChange={value => setMediaPropertyId(value ?? "")}
          placeholder="No media property"
          searchPlaceholder="Search media properties…"
          emptyText="No media properties found."
          createOption={{
            label: "Create media property",
            onSelect: () => setAddMediaPropertyOpen(true),
          }}
        />
      </div>
      <AddMediaPropertyModal
        open={addMediaPropertyOpen}
        onOpenChange={setAddMediaPropertyOpen}
        onCreated={mediaProperty => setMediaPropertyId(mediaProperty.id)}
      />

      {createBook.isError
        ? <p className="text-sm text-destructive">{createBook.error.message}</p>
        : null}

      <Button
        type="submit"
        disabled={createBook.isPending || name.trim().length === 0}
      >
        {createBook.isPending ? "Creating…" : "Create book"}
      </Button>
    </form>
  );
}
