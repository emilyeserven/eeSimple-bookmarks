import { Suspense, lazy } from "react";

import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { HomepageSectionBlock } from "../components/HomepageSectionBlock";
import { useHomepageContentSettings } from "../hooks/useAppSettings";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useHomepageSectionBookmarks } from "../hooks/useHomepageSections";

// Lazy so the homepage doesn't load TipTap / the bookmark form unless there's content to show.
const HomepageContentBlocks = lazy(() =>
  import("../components/HomepageContentBlocks").then(module => ({
    default: module.HomepageContentBlocks,
  })));

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const {
    t,
  } = useTranslation();
  const {
    data: sections, isLoading, error,
  } = useHomepageSectionBookmarks();
  const {
    data: customProperties,
  } = useCustomProperties();
  const {
    data: content,
  } = useHomepageContentSettings();

  const hasContent = Boolean(
    content
    && ((content.homepageTextEnabled && content.homepageText.trim())
      || content.bookmarkQuickAddEnabled),
  );

  const sectionList = (sections ?? []).filter(
    ({
      section, bookmarks,
    }) => !(section.hideIfEmpty && bookmarks.length === 0),
  );
  const hasSections = (sections ?? []).length > 0;

  return (
    <section className="space-y-6">
      {!content?.homepageHeaderHidden && (
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{t("Homepage")}</h1>
          <p className="text-muted-foreground">
            {t("Bookmarks from your homepage sections, ordered by priority.")}
          </p>
        </div>
      )}

      {hasContent && content
        ? (
          <Suspense fallback={null}>
            <HomepageContentBlocks content={content} />
          </Suspense>
        )
        : null}

      {isLoading ? <p className="text-muted-foreground">{t("Loading bookmarks…")}</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}

      {!isLoading && !hasSections
        ? (
          <p className="text-muted-foreground">
            {t("Nothing here yet. Build homepage sections in")}
            {" "}
            <Link
              to="/settings/display/homepage"
              className="
                font-medium text-foreground
                hover:underline
              "
            >
              {t("Settings → Display → Homepage")}
            </Link>
            {" "}
            {t("to surface bookmarks here.")}
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
