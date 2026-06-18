import { Link, createFileRoute } from "@tanstack/react-router";

import { ColumnsSwitcher } from "../components/ColumnsSwitcher";
import { HomepageSectionBlock } from "../components/HomepageSectionBlock";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useHomepageSectionBookmarks } from "../hooks/useHomepageSections";
import { useBookmarkColumns } from "../lib/bookmarkColumns";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const HOME_PAGE_KEY = "home";

function HomePage() {
  const {
    data: sections, isLoading, error,
  } = useHomepageSectionBookmarks();
  const {
    data: customProperties,
  } = useCustomProperties();
  const columns = useBookmarkColumns(HOME_PAGE_KEY);

  const sectionList = sections ?? [];
  const hasSections = sectionList.length > 0;

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Homepage</h1>
          <p className="text-muted-foreground">
            Bookmarks from your homepage sections, ordered by priority.
          </p>
        </div>
        <ColumnsSwitcher pageKey={HOME_PAGE_KEY} />
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading bookmarks…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}

      {!isLoading && !hasSections
        ? (
          <p className="text-muted-foreground">
            Nothing here yet. Build homepage sections in
            {" "}
            <Link
              to="/settings/homepage"
              className="
                font-medium text-foreground
                hover:underline
              "
            >
              Settings → Homepage
            </Link>
            {" "}
            to surface bookmarks here.
          </p>
        )
        : null}

      <div className="space-y-8">
        {sectionList.map(data => (
          <HomepageSectionBlock
            key={data.section.id}
            data={data}
            columns={columns}
            customProperties={customProperties ?? []}
          />
        ))}
      </div>
    </section>
  );
}
