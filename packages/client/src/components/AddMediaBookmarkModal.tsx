import type { Bookmark } from "@eesimple/types";

import { useTranslation } from "react-i18next";
import { z } from "zod";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { useCreateBookmark } from "../hooks/useBookmarks";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useAppForm } from "../lib/form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBuiltInName } from "@/lib/builtInName";
import { iconComboboxOptions } from "@/lib/comboboxOptions";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  mediaTypeId: z.string(),
  isbn: z.string(),
  year: z.string(),
});

interface AddMediaBookmarkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (bookmark: Bookmark) => void;
}

/**
 * Minimal inline-create modal for a "media bookmark" — a title + media type (+ optional ISBN/year
 * identity), created URL-less (per the Franchise hub convention). Backs the target-bookmark
 * combobox in {@link BookmarkMediaLinkField}. Not routed through `useEntityCreateOption`'s
 * `CreatableEntityKind` registry: that registry mints taxonomy rows via a matching CRUD service,
 * while this mints an ordinary bookmark via `useCreateBookmark` — a different shape, wired in by
 * hand instead (see the `combobox-new-entity-creation` skill's note on this exception).
 */
export function AddMediaBookmarkModal({
  open,
  onOpenChange,
  onCreated,
}: AddMediaBookmarkModalProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  const builtInName = useBuiltInName();
  const createBookmark = useCreateBookmark();
  const form = useAppForm({
    defaultValues: {
      title: "",
      mediaTypeId: "",
      isbn: "",
      year: "",
    },
    validators: {
      onChange: schema,
    },
    onSubmit: ({
      value,
    }) => {
      const year = Number(value.year);
      createBookmark.mutate(
        {
          title: value.title.trim(),
          url: null,
          mediaTypeId: value.mediaTypeId || null,
          isbn: value.isbn.trim() || null,
          year: value.year.trim() && Number.isFinite(year) ? year : null,
        },
        {
          onSuccess: (bookmark) => {
            onCreated?.(bookmark);
            onOpenChange(false);
            form.reset();
          },
        },
      );
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("New media bookmark")}</DialogTitle>
          <DialogDescription>
            {t("Create a bookmark for a media title (e.g. a movie or book) so other bookmarks can link to it.")}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.AppField name="title">
            {field => (
              <field.TextField
                label={t("Title")}
                placeholder={t("e.g. Parasite")}
              />
            )}
          </form.AppField>
          <form.AppField name="mediaTypeId">
            {field => (
              <field.ComboboxField
                label={t("Media type")}
                placeholder={t("No media type")}
                searchPlaceholder={t("Search media types…")}
                emptyText={t("No media types found.")}
                options={iconComboboxOptions((mediaTypes ?? []).filter(mt => !mt.hidden), builtInName)}
              />
            )}
          </form.AppField>
          <CollapsibleFormSection
            title={t("Identity (optional)")}
            description={t("Helps dedupe this title against future imports/syncs from the same source.")}
            preview={t("ISBN, year")}
          >
            <form.AppField name="isbn">
              {field => (
                <field.TextField
                  label={t("ISBN")}
                  placeholder={t("e.g. 9780000000000")}
                />
              )}
            </form.AppField>
            <form.AppField name="year">
              {field => (
                <field.TextField
                  label={t("Year")}
                  placeholder={t("e.g. 2019")}
                />
              )}
            </form.AppField>
          </CollapsibleFormSection>
          {createBookmark.isError
            ? <p className="text-sm text-destructive">{createBookmark.error.message}</p>
            : null}
          <DialogFooter>
            <form.AppForm>
              <form.SubmitButton
                label={t("Create bookmark")}
                pendingLabel={t("Creating…")}
              />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
