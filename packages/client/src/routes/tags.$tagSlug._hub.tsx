import { Link, createFileRoute } from "@tanstack/react-router";
import { Tag as TagIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { useTagTree } from "../hooks/useTags";
import { findAncestorPath } from "../lib/tagTree";

/**
 * The tag listing shell: the entity header (with the "Sub-tags:" child chip row) over the
 * `Bookmarks | Gallery | Media | Info` strip, shared by the bookmarks/gallery/media panes and the Info
 * page. `edit` is a sibling of this pathless layout, so the strip never shows while editing.
 */
export const Route = createFileRoute("/tags/$tagSlug/_hub")({
  component: TagHubLayout,
});

function TagHubLayout() {
  const {
    t,
  } = useTranslation();
  const {
    tagSlug,
  } = Route.useParams();
  const {
    data: tagTree,
  } = useTagTree();
  const path = tagTree ? findAncestorPath(tagTree, tagSlug) : null;
  const tag = path?.[path.length - 1];

  return (
    <ListingHubLayout
      header={(
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <TagIcon className="size-6 shrink-0" />
            {tag
              ? (
                <LocalizedNameLabel
                  names={tag.names ?? []}
                  base={tag.name}
                />
              )
              : (tagTree ? t("Tag not found") : t("Tag"))}
          </h1>
          {tag && tag.children.length > 0 && (
            <div
              className="
                flex flex-wrap items-center gap-2 text-sm text-muted-foreground
              "
            >
              <span>{t("Sub-tags:")}</span>
              {tag.children.map(child => (
                <Link
                  key={child.id}
                  to="/tags/$tagSlug"
                  params={{
                    tagSlug: child.slug,
                  }}
                  className="
                    rounded-full border px-2.5 py-0.5 font-medium
                    hover:bg-accent
                  "
                >
                  <LocalizedNameLabel
                    names={child.names ?? []}
                    base={child.name}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
      tabs={[
        {
          to: "/tags/$tagSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/tags/$tagSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/tags/$tagSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        tagSlug,
      }}
      navAriaLabel={t("Tag views")}
    />
  );
}
