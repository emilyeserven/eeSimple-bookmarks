import type { Bookmark, BookmarkGraphSettings, BookmarkPerson, BookmarkRelationship, BookmarkTag } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEFAULT_BOOKMARK_GRAPH_SETTINGS } from "@eesimple/types";

import { BookmarkGraph } from "./BookmarkGraph";
import { buildBookmarkGraph } from "../lib/bookmarkGraph";
import { makeBookmark } from "../test-utils/factories";

const tag = (id: string): BookmarkTag => ({
  id,
  slug: id,
  name: id,
  parentId: null,
  editableOnCard: false,
});

const person = (id: string): BookmarkPerson => ({
  id,
  slug: id,
  name: id,
});

const rel = (partner: Bookmark): BookmarkRelationship => ({
  relationshipTypeId: "rt1",
  relationshipTypeName: "Similar",
  directional: false,
  role: "related",
  label: null,
  bookmark: {
    id: partner.id,
    title: partner.title,
    url: partner.url,
  },
});

const settings: BookmarkGraphSettings = DEFAULT_BOOKMARK_GRAPH_SETTINGS;

/** A center bookmark with peers of varied overlap — node sizes and edge weights differ visibly. */
function variedGraph() {
  const center = makeBookmark({
    id: "center",
    title: "Learning TypeScript",
    tags: [tag("typescript"), tag("tutorial"), tag("web")],
    people: [person("dan")],
  });
  const peers = [
    makeBookmark({
      id: "b1",
      title: "TS Handbook",
      tags: [tag("typescript"), tag("tutorial"), tag("web")],
    }),
    makeBookmark({
      id: "b2",
      title: "React docs",
      tags: [tag("web"), tag("tutorial")],
    }),
    makeBookmark({
      id: "b3",
      title: "CSS tricks",
      tags: [tag("web")],
    }),
    makeBookmark({
      id: "b4",
      title: "Type-level wizardry — a very long title",
      tags: [tag("typescript")],
      people: [person("dan")],
    }),
    makeBookmark({
      id: "b5",
      title: "Vite guide",
      tags: [tag("web"), tag("typescript")],
    }),
    makeBookmark({
      id: "b6",
      title: "Testing course",
      tags: [tag("tutorial")],
    }),
  ];
  return buildBookmarkGraph(center, [center, ...peers], settings);
}

/** A dense cluster — every bookmark shares the same tags, so the peer mesh is fully connected. */
function denseGraph() {
  const shared = [tag("anime"), tag("2026"), tag("favorites")];
  const center = makeBookmark({
    id: "center",
    title: "Season hub",
    tags: shared,
  });
  const peers = Array.from({
    length: 9,
  }, (_, i) =>
    makeBookmark({
      id: `d${i}`,
      title: `Episode thread ${i + 1}`,
      tags: shared,
    }));
  return buildBookmarkGraph(center, [center, ...peers], settings);
}

/** Only explicit relationships, no taxonomy overlap — floored edges still draw the spokes. */
function explicitOnlyGraph() {
  const peers = [
    makeBookmark({
      id: "e1",
      title: "Prequel",
    }),
    makeBookmark({
      id: "e2",
      title: "Sequel",
    }),
    makeBookmark({
      id: "e3",
      title: "Companion piece",
    }),
  ];
  const center = makeBookmark({
    id: "center",
    title: "The original",
    relationships: peers.map(rel),
  });
  return buildBookmarkGraph(center, [center, ...peers], settings);
}

const meta = {
  title: "Components/BookmarkGraph",
  component: BookmarkGraph,
  args: {
    graph: variedGraph(),
  },
} satisfies Meta<typeof BookmarkGraph>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Varied overlap: bigger nodes share more with the others; thicker lines share more pairwise. */
export const Default: Story = {};

/** A fully-connected cluster — the per-node top-K pruning keeps the mesh readable. */
export const DenseCluster: Story = {
  args: {
    graph: denseGraph(),
  },
};

/** Explicit relationships only — spokes drawn from the score floor, all nodes equally weighted. */
export const ExplicitRelationshipsOnly: Story = {
  args: {
    graph: explicitOnlyGraph(),
  },
};
