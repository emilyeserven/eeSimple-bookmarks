import type { Book, KavitaSeriesResult, UpdateBookInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { BookOpen, X } from "lucide-react";
import { z } from "zod";

import { KavitaSeriesLookup } from "./KavitaSeriesLookup";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import { useUpdateBook } from "@/hooks/useBooks";
import { useMediaProperties } from "@/hooks/useMediaProperties";
import { notifyFieldSaved, notifyFieldSaveError } from "@/lib/autoSave";
import { useAppForm } from "@/lib/form";

const bookGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sortOrder: z.number().int(),
  releaseYear: z.number().int(),
  mediaPropertyId: z.string(),
});

const LABELS: Record<keyof UpdateBookInput, string> = {
  name: "Name",
  sortOrder: "Sort order",
  mediaPropertyId: "Media property",
  releaseYear: "Release year",
  kavitaSeriesId: "Kavita series",
  kavitaLibraryId: "Kavita series",
  kavitaSeriesName: "Kavita series",
};

interface Props {
  book: Book;
}

/** Edit a book's name, sort order, media property, release year, and Kavita link. Auto-saves. */
export function BookGeneralForm({
  book,
}: Props) {
  const navigate = useNavigate();
  const updateBook = useUpdateBook();
  const {
    data: mediaProperties,
  } = useMediaProperties();
  const autoSave = useFieldAutoSave<UpdateBookInput, Book>({
    id: book.id,
    update: updateBook,
    labels: LABELS,
    initial: {
      name: book.name,
      sortOrder: book.sortOrder,
      releaseYear: book.releaseYear,
    },
  });

  const mediaPropertyCreate = useEntityCreateOption("media-property", (mediaProperty) => {
    void updateBook.mutate(
      {
        id: book.id,
        input: {
          mediaPropertyId: mediaProperty.id,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Media property"),
        onError: error => notifyFieldSaveError(
          "Media property",
          error instanceof Error ? error.message : undefined,
        ),
      },
    );
  });

  const form = useAppForm({
    defaultValues: {
      name: book.name,
      sortOrder: book.sortOrder,
      releaseYear: book.releaseYear ?? 0,
      mediaPropertyId: book.mediaPropertyId ?? "",
    },
    validators: {
      onChange: bookGeneralSchema,
    },
  });

  /** Re-link Kavita from a search pick: persist series ids + release year in one save + one toast. */
  function applyKavita(series: KavitaSeriesResult): void {
    form.setFieldValue("releaseYear", series.releaseYear ?? 0);
    updateBook.mutate(
      {
        id: book.id,
        input: {
          kavitaSeriesId: series.seriesId,
          kavitaLibraryId: series.libraryId,
          kavitaSeriesName: series.name,
          releaseYear: series.releaseYear,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Kavita series"),
        onError: error => notifyFieldSaveError(
          "Kavita series",
          error instanceof Error ? error.message : undefined,
        ),
      },
    );
  }

  function clearKavita(): void {
    updateBook.mutate(
      {
        id: book.id,
        input: {
          kavitaSeriesId: null,
          kavitaLibraryId: null,
          kavitaSeriesName: null,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Kavita series"),
        onError: error => notifyFieldSaveError(
          "Kavita series",
          error instanceof Error ? error.message : undefined,
        ),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="
          grid gap-3
          sm:grid-cols-[1fr_8rem]
        "
      >
        <form.AppField name="name">
          {field => (
            <field.TextField
              label="Name"
              onBlur={() => autoSave.saveField(
                "name",
                field.state.value.trim(),
                {
                  valid: field.state.meta.errors.length === 0,
                  onSuccess: (updated) => {
                    if (updated.slug !== book.slug) {
                      void navigate({
                        to: "/taxonomies/books/$bookSlug/edit/general",
                        params: {
                          bookSlug: updated.slug,
                        },
                      });
                    }
                  },
                },
              )}
            />
          )}
        </form.AppField>
        <form.AppField name="sortOrder">
          {field => (
            <field.NumberField
              label="Sort order"
              hint="Lower sorts first."
              onBlur={() => autoSave.saveField(
                "sortOrder",
                field.state.value,
                {
                  valid: field.state.meta.errors.length === 0,
                },
              )}
            />
          )}
        </form.AppField>
      </div>

      <form.AppField name="mediaPropertyId">
        {field => (
          <field.ComboboxField
            label="Media property"
            placeholder="No media property"
            searchPlaceholder="Search media properties…"
            emptyText="No media properties found."
            createOption={mediaPropertyCreate.createOption}
            options={(mediaProperties ?? []).map(prop => ({
              value: prop.id,
              label: prop.name,
            }))}
            onValueChange={value => autoSave.saveField(
              "mediaPropertyId",
              value || null,
              {
                valid: true,
              },
            )}
          />
        )}
      </form.AppField>
      {mediaPropertyCreate.modal}

      <form.AppField name="releaseYear">
        {field => (
          <field.NumberField
            label="Release year"
            onBlur={() => autoSave.saveField(
              "releaseYear",
              field.state.value || null,
              {
                valid: field.state.meta.errors.length === 0,
              },
            )}
          />
        )}
      </form.AppField>

      <div className="space-y-1.5">
        {book.kavitaSeriesId !== null
          ? (
            <div
              className="
                flex items-center gap-2 rounded-md border px-3 py-2 text-sm
              "
            >
              <BookOpen className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">
                Kavita: {book.kavitaSeriesName ?? `Series #${book.kavitaSeriesId}`}
              </span>
              <button
                type="button"
                aria-label="Unlink Kavita series"
                className="
                  text-muted-foreground
                  hover:text-foreground
                "
                onClick={clearKavita}
              >
                <X className="size-4" />
              </button>
            </div>
          )
          : null}
        <KavitaSeriesLookup onSelect={applyKavita} />
      </div>
    </div>
  );
}
