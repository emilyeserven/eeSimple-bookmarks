import type { BookFormProps } from "./useBookFormController";

import { BookOpen, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AddMediaPropertyModal } from "./AddMediaPropertyModal";
import { AmazonIsbnLookup } from "./AmazonIsbnLookup";
import { EntityNamesEditor } from "./entityNames/EntityNamesEditor";
import { KavitaSeriesLookup } from "./KavitaSeriesLookup";
import { EMPTY_KAVITA, useBookFormController } from "./useBookFormController";

import { Combobox } from "@/components/Combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
 *
 * All state and handlers live in `useBookFormController` — this component is just the JSX wiring
 * (see the `decompose-over-cap` skill: hook-density was this form's complexity driver).
 */
export function BookForm(props: BookFormProps) {
  const {
    t,
  } = useTranslation();
  const {
    createBook,
    mediaProperties,
    isbnFetch,
    name,
    setName,
    nameDrafts,
    setNameDrafts,
    mediaPropertyId,
    setMediaPropertyId,
    kavita,
    setKavita,
    addMediaPropertyOpen,
    setAddMediaPropertyOpen,
    isbnInput,
    setIsbnInput,
    isbn,
    applyCandidate,
    handleIsbnLookup,
    handleSubmit,
  } = useBookFormController(props);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-1.5 rounded-md border bg-muted/40 p-3">
        <Label
          htmlFor="book-amazon-url"
          className="text-sm font-medium"
        >
          {t("Have an Amazon link? Paste it to autofill this book")}
        </Label>
        <AmazonIsbnLookup
          id="book-amazon-url"
          autoFocus
          onResolved={isbn => void handleIsbnLookup(isbn)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {t("Or enter details manually:")}
      </p>

      <KavitaSeriesLookup onSelect={applyCandidate} />

      <div className="space-y-1.5">
        <Label htmlFor="book-name">{t("Name")}</Label>
        <Input
          id="book-name"
          placeholder={t("e.g. The Fellowship of the Ring")}
          value={name}
          onChange={event => setName(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("Names")}</Label>
        <EntityNamesEditor
          value={nameDrafts}
          onChange={setNameDrafts}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="book-isbn">{t("ISBN")}</Label>
        <div className="flex gap-2">
          <Input
            id="book-isbn"
            placeholder={t("e.g. 9780618640157")}
            value={isbnInput}
            onChange={event => setIsbnInput(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isbnFetch.isPending || isbnInput.trim().length === 0}
            onClick={() => void handleIsbnLookup()}
          >
            {isbnFetch.isPending ? t("Looking up…") : t("Look up")}
          </Button>
        </div>
        {isbn
          ? (
            <p className="text-xs text-muted-foreground">
              {t("ISBN {{isbn}} will be saved with this book.", {
                isbn,
              })}
            </p>
          )
          : null}
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
              {t("Linked to Kavita: {{name}}", {
                name: kavita.kavitaSeriesName ?? t("Series #{{id}}", {
                  id: kavita.kavitaSeriesId,
                }),
              })}
              {kavita.releaseYear ? ` (${kavita.releaseYear})` : ""}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              aria-label={t("Clear Kavita link")}
              onClick={() => setKavita(EMPTY_KAVITA)}
            >
              <X className="size-4" />
            </Button>
          </div>
        )
        : null}

      <div className="space-y-1.5">
        <Label>{t("Media property")}</Label>
        <Combobox
          aria-label={t("Media property")}
          options={(mediaProperties ?? []).map(prop => ({
            value: prop.id,
            label: prop.name,
          }))}
          value={mediaPropertyId || undefined}
          onValueChange={value => setMediaPropertyId(value ?? "")}
          placeholder={t("No media property")}
          searchPlaceholder={t("Search media properties…")}
          emptyText={t("No media properties found.")}
          createOption={{
            label: t("Create media property"),
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
        {createBook.isPending ? t("Creating…") : t("Create book")}
      </Button>
    </form>
  );
}
