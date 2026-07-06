import { createFileRoute } from "@tanstack/react-router";

import { bookWorkbench } from "../components/workbench/book";
import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/books/$bookSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: BookInfoTab,
});

function BookInfoTab() {
  const {
    bookSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={bookWorkbench}
      slug={bookSlug}
      infoTo="/taxonomies/books/$bookSlug/info"
      params={{
        bookSlug,
      }}
      activeTab={tab}
    />
  );
}
