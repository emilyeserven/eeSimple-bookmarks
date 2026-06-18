import { Link, createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import { HomepageSectionBlock } from "../components/HomepageSectionBlock";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useHomepageSectionBookmarks } from "../hooks/useHomepageSections";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const {
    data: sections, isLoading, error,
  } = useHomepageSectionBookmarks();
  const {
    data: customProperties,
  } = useCustomProperties();

  const sectionList = (sections ?? []).filter(
    ({ section, bookmarks }) => !(section.hideIfEmpty && bookmarks.length === 0),
  );
  const hasSections = (sections ?? []).length > 0;

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Homepage</h1>
          <p className="text-muted-foreground">
            Bookmarks from your homepage sections, ordered by priority.
          </p>
        </div>
        <Link
          to="/settings/homepage"
          className="
            flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm
            text-muted-foreground transition-colors
            hover:bg-accent hover:text-accent-foreground
          "
          aria-label="Homepage settings"
        >
          <Settings className="size-4" />
          <span>Settings</span>
        </Link>
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
            customProperties={customProperties ?? []}
          />
        ))}
      </div>
    </section>
  );
}
