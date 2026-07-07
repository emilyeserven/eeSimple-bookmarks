import type { Bookmark } from "@eesimple/types";

/** One member bookmark of a relationship card, plus the optional free-text label on the edge. */
export interface RelationshipCardMember {
  bookmark: Bookmark;
  label: string | null;
}

/**
 * A single "relationship card": one anchor bookmark (the sticky parent, or — for symmetric types —
 * the bookmark the card is keyed on) and the bookmarks related to it under a given relationship type.
 */
export interface RelationshipCardGroup {
  anchor: Bookmark;
  members: RelationshipCardMember[];
}

/** anchorId → (memberId → edge label). Naturally dedupes an edge carried on both endpoints. */
type PairIndex = Map<string, Map<string, string | null>>;

/** Record `anchorId → memberId` keeping the first-seen label (edges appear on both endpoints). */
function addPair(pairs: PairIndex, anchorId: string, memberId: string, label: string | null): void {
  if (anchorId === memberId) return;
  const members = pairs.get(anchorId) ?? new Map<string, string | null>();
  if (!members.has(memberId)) members.set(memberId, label);
  pairs.set(anchorId, members);
}

/**
 * Directional edges of `typeId`, indexed parent → children. Mirrors the direction semantics of
 * `indexBookmarkEdges` (bookmarkHierarchy.ts): on a directional edge carried by bookmark `b`,
 * `role === "child"` ⇒ `b` is the parent; `role === "parent"` ⇒ the other bookmark is the parent.
 */
function collectDirectionalPairs(typeId: string, allBookmarks: Bookmark[]): PairIndex {
  const pairs: PairIndex = new Map();
  for (const b of allBookmarks) {
    for (const rel of b.relationships) {
      if (rel.relationshipTypeId !== typeId || !rel.directional) continue;
      if (rel.role === "child") addPair(pairs, b.id, rel.bookmark.id, rel.label);
      else if (rel.role === "parent") addPair(pairs, rel.bookmark.id, b.id, rel.label);
    }
  }
  return pairs;
}

/**
 * Symmetric edges of `typeId`, indexed anchor → peers, one entry per bookmark that carries such an
 * edge. A pair (A, B) therefore yields both A→B and B→A — the intended "anchor per bookmark" model.
 */
function collectSymmetricPairs(typeId: string, allBookmarks: Bookmark[]): PairIndex {
  const pairs: PairIndex = new Map();
  for (const b of allBookmarks) {
    for (const rel of b.relationships) {
      if (rel.relationshipTypeId !== typeId || rel.directional) continue;
      addPair(pairs, b.id, rel.bookmark.id, rel.label);
    }
  }
  return pairs;
}

/** Resolve a pair index into cards, dropping ids not in `byId` and sorting members by title. */
function materializeGroups(pairs: PairIndex, byId: Map<string, Bookmark>): RelationshipCardGroup[] {
  const groups: RelationshipCardGroup[] = [];
  for (const [anchorId, memberMap] of pairs) {
    const anchor = byId.get(anchorId);
    if (!anchor) continue;
    const members: RelationshipCardMember[] = [];
    for (const [memberId, label] of memberMap) {
      const bookmark = byId.get(memberId);
      if (bookmark) members.push({
        bookmark,
        label,
      });
    }
    if (members.length === 0) continue;
    members.sort((a, b) => a.bookmark.title.localeCompare(b.bookmark.title));
    groups.push({
      anchor,
      members,
    });
  }
  return groups;
}

/**
 * Build the "relationship cards" for a relationship type from the relationships embedded on every
 * bookmark (already loaded in the bookmarks cache) — no endpoint. For directional types each card is a
 * parent with its children; for symmetric types each card is a bookmark with its related peers. Cards
 * are sorted by anchor title, members by member title.
 *
 * O(n) over the already-loaded bookmark list — a sanctioned client-side derivation.
 */
export function buildRelationshipTypeCards(
  typeId: string,
  directional: boolean,
  allBookmarks: Bookmark[],
): RelationshipCardGroup[] {
  const byId = new Map(allBookmarks.map(b => [b.id, b]));
  const pairs = directional
    ? collectDirectionalPairs(typeId, allBookmarks)
    : collectSymmetricPairs(typeId, allBookmarks);
  return materializeGroups(pairs, byId).sort((a, b) => a.anchor.title.localeCompare(b.anchor.title));
}
