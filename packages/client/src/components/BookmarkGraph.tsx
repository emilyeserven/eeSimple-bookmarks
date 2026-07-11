import type { BookmarkGraphEdge, BookmarkGraphModel, BookmarkGraphNode } from "../lib/bookmarkGraph";
import type { BookmarkGraphPoint } from "../lib/bookmarkGraphLayout";

import { useMemo } from "react";

import { useNavigate } from "@tanstack/react-router";

import { edgeOpacity, edgeStrokeWidth, nodeRadius, truncateLabel } from "../lib/bookmarkGraph";
import { layoutBookmarkGraph } from "../lib/bookmarkGraphLayout";

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 400;

/**
 * The Obsidian-style one-layer relatedness graph: the current bookmark pinned at the center, its
 * related bookmarks around it, and a line between every displayed pair that shares commonalities —
 * thicker/tighter the more they share. Positions come from a synchronous force-layout run
 * (`layoutBookmarkGraph`), so the render is a static SVG; clicking a peer navigates to it.
 */
export function BookmarkGraph({
  graph,
}: {
  graph: BookmarkGraphModel;
}) {
  const navigate = useNavigate();
  const positions = useMemo(() => layoutBookmarkGraph(graph, VIEW_WIDTH, VIEW_HEIGHT), [graph]);
  const goTo = (bookmarkId: string) => {
    void navigate({
      to: "/bookmarks/$bookmarkId",
      params: {
        bookmarkId,
      },
    });
  };

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className="h-auto w-full rounded-md border select-none"
    >
      {graph.edges.map(edge => (
        <GraphEdgeLine
          key={`${edge.sourceId}:${edge.targetId}`}
          edge={edge}
          maxScore={graph.maxScore}
          positions={positions}
        />
      ))}
      {graph.nodes.map(node => (
        <GraphNode
          key={node.bookmark.id}
          node={node}
          maxWeight={graph.maxWeight}
          point={positions.get(node.bookmark.id)}
          onNavigate={goTo}
        />
      ))}
    </svg>
  );
}

/** One commonality edge — stroke width and opacity scale with the pair's share of the max score. */
function GraphEdgeLine({
  edge,
  maxScore,
  positions,
}: {
  edge: BookmarkGraphEdge;
  maxScore: number;
  positions: Map<string, BookmarkGraphPoint>;
}) {
  const source = positions.get(edge.sourceId);
  const target = positions.get(edge.targetId);
  if (!source || !target) return null;
  return (
    <line
      x1={source.x}
      y1={source.y}
      x2={target.x}
      y2={target.y}
      strokeWidth={edgeStrokeWidth(edge.score, maxScore)}
      strokeOpacity={edgeOpacity(edge.score, maxScore)}
      className="stroke-muted-foreground"
    />
  );
}

/** One bookmark node — the pinned center, or a clickable/keyboard-focusable peer. */
function GraphNode({
  node,
  maxWeight,
  point,
  onNavigate,
}: {
  node: BookmarkGraphNode;
  maxWeight: number;
  point: BookmarkGraphPoint | undefined;
  onNavigate: (bookmarkId: string) => void;
}) {
  if (!point) return null;
  const radius = nodeRadius(node.weight, maxWeight);
  const label = truncateLabel(node.bookmark.title);
  const interactive = !node.isCenter;
  return (
    <g
      role={interactive ? "link" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? node.bookmark.title : undefined}
      onClick={interactive ? () => onNavigate(node.bookmark.id) : undefined}
      onKeyDown={interactive
        ? (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onNavigate(node.bookmark.id);
          }
        }
        : undefined}
      className={interactive
        ? "group cursor-pointer outline-none"
        : undefined}
    >
      <title>{node.bookmark.title}</title>
      <circle
        cx={point.x}
        cy={point.y}
        r={radius}
        className={node.isCenter
          ? "fill-primary"
          : `
            fill-muted-foreground transition-colors
            group-hover:fill-primary
            group-focus-visible:fill-primary
          `}
      />
      <text
        x={point.x}
        y={point.y + radius + 12}
        textAnchor="middle"
        className={`
          fill-foreground text-[10px]
          ${node.isCenter ? "font-semibold" : ""}
        `}
      >
        {label}
      </text>
    </g>
  );
}
