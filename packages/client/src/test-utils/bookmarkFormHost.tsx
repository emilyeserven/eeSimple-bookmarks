import type { BookmarkFormApi } from "../components/bookmarkFormSchema";
import type { ReactNode } from "react";

import { bookmarkSchema } from "../components/bookmarkFormSchema";
import { useAppForm } from "../lib/form";

interface BookmarkFormHostValues {
  url: string;
  title: string;
  romanizedTitle: string;
  categoryId: string;
  mediaTypeId: string;
  languageId: string;
  description: string;
  tagIds: string[];
  locationIds: string[];
  blacklistedTagIds: string[];
  blacklistedLocationIds: string[];
  personIds: string[];
  groupId: string;
}

interface BookmarkFormHostProps {
  /** Seed values for the throwaway form (merged over empty defaults). */
  initialValues?: Partial<BookmarkFormHostValues>;
  /** Render-prop receiving the live form, so `form.Subscribe` / `form.AppField` children work. */
  children: (form: BookmarkFormApi) => ReactNode;
}

/**
 * Mounts a real bookmark `useAppForm` instance and hands it to `children`, so the `Revealed*`
 * sub-components (which take a `form: BookmarkFormApi` and use `form.Subscribe`/`form.AppField`)
 * can be rendered in isolation in stories and unit tests without standing up the full
 * `BookmarkForm`. Mirrors `BookmarkForm`'s own `useAppForm({ defaultValues, validators })` call.
 */
export function BookmarkFormHost({
  initialValues,
  children,
}: BookmarkFormHostProps) {
  const form = useAppForm({
    defaultValues: {
      url: "",
      title: "",
      romanizedTitle: "",
      categoryId: "",
      mediaTypeId: "",
      languageId: "",
      description: "",
      tagIds: [],
      locationIds: [],
      blacklistedTagIds: [],
      blacklistedLocationIds: [],
      personIds: [],
      groupId: "",
      ...initialValues,
    },
    validators: {
      onChange: bookmarkSchema,
    },
  });
  return <>{children(form)}</>;
}
