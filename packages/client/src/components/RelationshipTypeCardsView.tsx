import type { Bookmark, RelationshipType } from "@eesimple/types";
import type { ReactNode } from "react";

import { useMemo } from "react";

import { useTranslation } from "react-i18next";

import { BookmarkCard } from "./BookmarkCard";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useResolveCardDisplay } from "../lib/cardDisplayRules";
import { buildRelationshipTypeCards } from "../lib/relationshipTypeCards";

import { Badge } from "@/components/ui/badge";
import { RowCard } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/**
 * The "Relationship Cards" view body for a relationship type's Info page (and right panel). For each
 * parent bookmark it renders the parent as a sticky card on the left with its child bookmarks on the
 * right, showing the relationship between them. Symmetric types render one card per bookmark (the
 * bookmark anchored on the left, its related peers on the right). All data is derived client-side from
 * the already-loaded bookmark list — no endpoint (see {@link buildRelationshipTypeCards}).
 */
export function RelationshipTypeCardsView({
  relationshipType,
}: { relationshipType: RelationshipType }) {
  const {
    t,
  } = useTranslation();
  const {
    data: allBookmarks,
  } = useBookmarks();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    resolve: resolveDisplay, isPending: displayPending,
  } = useResolveCardDisplay();

  const groups = useMemo(
    () => buildRelationshipTypeCards(relationshipType.id, relationshipType.directional, allBookmarks ?? []),
    [relationshipType.id, relationshipType.directional, allBookmarks],
  );

  const renderCard = (bookmark: Bookmark): ReactNode => {
    const display = resolveDisplay(bookmark);
    return (
      <RowCard className="flex h-full flex-col p-4">
        <BookmarkCard
          bookmark={bookmark}
          properties={properties ?? []}
          sections={display.sections}
          imageCorners={display.imageCorners}
          imageMode={display.imageMode}
          imageVisibility={display.imageVisibility}
          hideWebsiteForYouTube={display.hideWebsiteForYouTube}
          loading={displayPending}
        />
      </RowCard>
    );
  };

  const connector = (label: string | null): ReactNode => (
    <div
      className="
        flex flex-wrap items-center gap-2 text-sm text-muted-foreground
      "
    >
      <Badge variant="secondary">{relationshipType.name}</Badge>
      {relationshipType.directional
        ? <span aria-hidden>→</span>
        : null}
      {label
        ? <span className="italic">“{label}”</span>
        : null}
    </div>
  );

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("No bookmarks are linked by this relationship type yet.")}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group, index) => (
        <section
          key={group.anchor.id}
          className="space-y-4"
        >
          {index > 0 ? <Separator /> : null}
          <div
            className="
              gap-6
              md:grid md:grid-cols-[minmax(0,22rem)_1fr] md:items-start
            "
          >
            <div className="md:sticky md:top-4 md:self-start">
              {renderCard(group.anchor)}
            </div>
            <div
              className="
                mt-4 space-y-4
                md:mt-0
              "
            >
              {group.members.map(member => (
                <div
                  key={member.bookmark.id}
                  className="flex items-center gap-4"
                >
                  <div className="shrink-0">{connector(member.label)}</div>
                  <div className="min-w-0 flex-1">{renderCard(member.bookmark)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
