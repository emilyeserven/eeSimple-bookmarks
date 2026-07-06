import type { Book, KavitaSeriesResult, UpdateBookInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { BookOpen, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { BookUrlIsbnLookup } from "./BookUrlIsbnLookup";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { renderKavitaFieldSyncHint } from "./KavitaFieldSyncHint";
import { KavitaSeriesLookup } from "./KavitaSeriesLookup";
import { LocationAssignmentSection } from "./LocationAssignmentSection";
import { TaxonomyGeneralFields } from "./TaxonomyGeneralFields";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import { Label } from "@/components/ui/label";
import { useUpdateBook } from "@/hooks/useBooks";
import { useKavitaSeriesDetail } from "@/hooks/useKavitaSeriesDetail";
import i18n from "@/i18n";
import { notifyFieldSaved, notifyFieldSaveError } from "@/lib/autoSave";
import { useAppForm } from "@/lib/form";

const bookGeneralSchema = z.object({
  name: z.string().trim().min(1, i18n.t("Name is required")),
  sortOrder: z.number().int(),
  releaseYear: z.number().int(),
  mediaPropertyId: z.string(),
  isbn: z.string(),
});

interface Props {
  book: Book;
}

/** Edit a book's name, sort order, media property, release year, and Kavita link. Auto-saves. */
export function BookGeneralForm({
  book,
}: Props) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateBook = useUpdateBook();
  const LABELS: Record<keyof UpdateBookInput, string> = {
    name: t("Name"),
    sortOrder: t("Sort order"),
    mediaPropertyId: t("Media property"),
    releaseYear: t("Release year"),
    kavitaSeriesId: t("Kavita series"),
    kavitaLibraryId: t("Kavita series"),
    kavitaSeriesName: t("Kavita series"),
    isbn: t("ISBN"),
  };
  const autoSave = useFieldAutoSave<UpdateBookInput, Book>({
    id: book.id,
    update: updateBook,
    labels: LABELS,
    initial: {
      name: book.name,
      sortOrder: book.sortOrder,
      releaseYear: book.releaseYear,
      isbn: book.isbn ?? "",
    },
  });

  const {
    data: kavitaDetail,
  } = useKavitaSeriesDetail(book.kavitaSeriesId);

  const form = useAppForm({
    defaultValues: {
      name: book.name,
      sortOrder: book.sortOrder,
      releaseYear: book.releaseYear ?? 0,
      mediaPropertyId: book.mediaPropertyId ?? "",
      isbn: book.isbn ?? "",
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
        onSuccess: () => notifyFieldSaved(t("Kavita series")),
        onError: error => notifyFieldSaveError(
          t("Kavita series"),
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
        onSuccess: () => notifyFieldSaved(t("Kavita series")),
        onError: error => notifyFieldSaveError(
          t("Kavita series"),
          error instanceof Error ? error.message : undefined,
        ),
      },
    );
  }

  return (
    <div className="space-y-4">
      <TaxonomyGeneralFields
        form={form}
        fields={{
          name: "name",
          sortOrder: "sortOrder",
          mediaPropertyId: "mediaPropertyId",
        }}
        saveField={autoSave.saveField}
        currentSlug={book.slug}
        onRenamed={slug => void navigate({
          to: "/taxonomies/books/$bookSlug/edit/general",
          params: {
            bookSlug: slug,
          },
        })}
        nameAction={renderKavitaFieldSyncHint("name", book.name, kavitaDetail?.name)}
        ownerType="book"
        ownerId={book.id}
      />

      <form.AppField name="releaseYear">
        {field => (
          <field.NumberField
            label={t("Release year")}
            action={renderKavitaFieldSyncHint("release year", book.releaseYear, kavitaDetail?.releaseYear)}
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
        <Label htmlFor="book-url-isbn-lookup">{t("Have an Amazon or honto.jp link? Paste it to autofill the ISBN")}</Label>
        <BookUrlIsbnLookup
          id="book-url-isbn-lookup"
          onResolved={(resolvedIsbn) => {
            form.setFieldValue("isbn", resolvedIsbn);
            autoSave.saveField("isbn", resolvedIsbn || null);
          }}
        />
      </div>

      <form.AppField name="isbn">
        {field => (
          <field.TextField
            label={t("ISBN")}
            onBlur={() => autoSave.saveField("isbn", field.state.value.trim() || null)}
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
                {t("Kavita: {{series}}", {
                  series: book.kavitaSeriesName ?? t("Series #{{id}}", {
                    id: book.kavitaSeriesId,
                  }),
                })}
              </span>
              <button
                type="button"
                aria-label={t("Unlink Kavita series")}
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

      <GenreMoodAssignmentSection
        ownerType="book"
        ownerId={book.id}
      />

      <LocationAssignmentSection
        ownerType="book"
        ownerId={book.id}
      />
    </div>
  );
}
