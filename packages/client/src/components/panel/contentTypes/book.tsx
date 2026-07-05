/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { BookOpen } from "lucide-react";

import { useBooks } from "../../../hooks/useBooks";
import i18n from "../../../i18n";
import { bookWorkbench } from "../../workbench/book";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useBookList() {
  const {
    data, isLoading, error,
  } = useBooks();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(book => ({
      id: book.id,
      label: book.name,
      sublabel: book.kavitaSeriesName ?? undefined,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only book view — the same body + shell the main-app book pages render. */
function BookView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={bookWorkbench}
      id={id}
      mode="view"
      contentType="book"
    />
  );
}

/** Book editor — the same auto-save form the main-app edit tab renders. */
function BookEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={bookWorkbench}
      id={id}
      mode="edit"
      contentType="book"
    />
  );
}

export const bookContentType: PanelContentTypeDef = {
  type: "book",
  label: i18n.t("Books"),
  singular: i18n.t("Book"),
  icon: BookOpen,
  useList: useBookList,
  View: BookView,
  Edit: BookEdit,
};
