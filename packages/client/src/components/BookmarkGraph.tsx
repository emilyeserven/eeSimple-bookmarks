import type { BookmarkGraphEdge, BookmarkGraphModel, BookmarkGraphNode } from "../lib/bookmarkGraph";
import type { BookmarkGraphPoint } from "../lib/bookmarkGraphLayout";
import type { ComponentType } from "react";

import { useEffect, useMemo, useRef, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { ExternalLink, Minus, Plus } from "lucide-react";

import { useBookmarkGraphSimulation } from "../hooks/useBookmarkGraphSimulation";
import { edgeOpacity, edgeStrokeWidth, neighborsOf, nodeOpacityForDistance, nodeRadius, truncateLabel } from "../lib/bookmarkGraph";
import { VIEW_HEIGHT, VIEW_WIDTH } from "../lib/bookmarkGraphLayout";

import i18n from "@/i18n";

/**
 * The Obsidian-style relatedness graph: the current bookmark pinned at the center, its related
 * bookmarks around it, and a line between every displayed pair that shares commonalities — thicker
 * the more they share. A live d3-force simulation animates the layout; peers are **draggable**, a
 * plain tap **selects** a node (highlighting it + its neighbors and dimming the rest and revealing
 * its affordances), and the selected node's **open** icon navigates while its **+/−** grows/collapses
 * that node's own related bookmarks as a further ring.
 */
export function BookmarkGraph({
  graph,
  expandedIds,
  toggleExpand,
}: {
  graph: BookmarkGraphModel;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const justExpandedRef = useRef<string | null>(null);
  const {
    svgRef, getPoint, nodeHandlers,
  } = useBookmarkGraphSimulation(graph, {
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    justExpandedRef,
    onSelect: setSelectedId,
  });

  // Drop the selection if its node disappears (e.g. after collapsing the ring that held it).
  useEffect(() => {
    if (selectedId && !graph.nodes.some(node => node.bookmark.id === selectedId)) {
      setSelectedId(null);
    }
  }, [graph, selectedId]);

  const connectedIds = useMemo(
    () => selectedId ? withNeighbors(graph, selectedId) : null,
    [graph, selectedId],
  );

  const goTo = (bookmarkId: string) => {
    void navigate({
      to: "/bookmarks/$bookmarkId",
      params: {
        bookmarkId,
      },
    });
  };
  const onExpand = (id: string) => {
    if (!expandedIds.has(id)) justExpandedRef.current = id;
    toggleExpand(id);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className="h-auto w-full rounded-md border select-none"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setSelectedId(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setSelectedId(null);
      }}
    >
      {graph.edges.map(edge => (
        <GraphEdgeLine
          key={`${edge.sourceId}:${edge.targetId}`}
          edge={edge}
          maxScore={graph.maxScore}
          selectedId={selectedId}
          getPoint={getPoint}
        />
      ))}
      {orderedForPaint(graph.nodes, selectedId).map(node => (
        <GraphNode
          key={node.bookmark.id}
          node={node}
          maxWeight={graph.maxWeight}
          point={getPoint(node.bookmark.id)}
          selected={node.bookmark.id === selectedId}
          dimmed={connectedIds !== null && !connectedIds.has(node.bookmark.id)}
          expanded={expandedIds.has(node.bookmark.id)}
          handlers={nodeHandlers(node.bookmark.id)}
          onSelect={setSelectedId}
          onOpen={goTo}
          onExpand={onExpand}
        />
      ))}
    </svg>
  );
}

/**
 * Nodes in paint order — the selected node moves last so it (and its on-select affordances) render on
 * top of every other node, since SVG paint order is document order.
 */
function orderedForPaint(nodes: BookmarkGraphNode[], selectedId: string | null): BookmarkGraphNode[] {
  if (selectedId === null) return nodes;
  return [
    ...nodes.filter(node => node.bookmark.id !== selectedId),
    ...nodes.filter(node => node.bookmark.id === selectedId),
  ];
}

/** The selected node plus its immediate neighbors — the set kept bright when something is selected. */
function withNeighbors(graph: BookmarkGraphModel, id: string): Set<string> {
  const set = neighborsOf(graph, id);
  set.add(id);
  return set;
}

/** One commonality edge — stroke width scales with the shared score; opacity dims/highlights on select. */
function GraphEdgeLine({
  edge,
  maxScore,
  selectedId,
  getPoint,
}: {
  edge: BookmarkGraphEdge;
  maxScore: number;
  selectedId: string | null;
  getPoint: (id: string) => BookmarkGraphPoint | undefined;
}) {
  const source = getPoint(edge.sourceId);
  const target = getPoint(edge.targetId);
  if (!source || !target) return null;
  const highlighted = selectedId !== null && (edge.sourceId === selectedId || edge.targetId === selectedId);
  const dimmed = selectedId !== null && !highlighted;
  return (
    <line
      x1={source.x}
      y1={source.y}
      x2={target.x}
      y2={target.y}
      strokeWidth={edgeStrokeWidth(edge.score, maxScore)}
      strokeOpacity={dimmed ? 0.08 : edgeOpacity(edge.score, maxScore)}
      className={highlighted ? "stroke-primary" : "stroke-muted-foreground"}
    />
  );
}

/** One bookmark node — the pinned center, or a draggable/selectable peer with on-select affordances. */
function GraphNode({
  node,
  maxWeight,
  point,
  selected,
  dimmed,
  expanded,
  handlers,
  onSelect,
  onOpen,
  onExpand,
}: {
  node: BookmarkGraphNode;
  maxWeight: number;
  point: BookmarkGraphPoint | undefined;
  selected: boolean;
  dimmed: boolean;
  expanded: boolean;
  handlers: { onPointerDown: (e: React.PointerEvent) => void };
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onExpand: (id: string) => void;
}) {
  if (!point) return null;
  const radius = nodeRadius(node.weight, maxWeight);
  const id = node.bookmark.id;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={node.bookmark.title}
      onPointerDown={handlers.onPointerDown}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(id);
        }
      }}
      style={{
        touchAction: "none",
        opacity: dimmed ? 0.15 : nodeOpacityForDistance(node.distance),
      }}
      className="cursor-pointer transition-opacity outline-none"
    >
      <title>{node.bookmark.title}</title>
      <circle
        cx={point.x}
        cy={point.y}
        r={radius}
        strokeWidth={selected ? 2 : 0}
        className={`
          ${node.isCenter ? "fill-primary" : "fill-muted-foreground"}
          ${selected ? "stroke-primary" : ""}
        `}
      />
      <text
        x={point.x}
        y={point.y + radius + 12}
        textAnchor="middle"
        className={`
          fill-foreground text-[11px]
          ${node.isCenter ? "font-semibold" : ""}
        `}
      >
        {truncateLabel(node.bookmark.title)}
      </text>
      {selected
        ? (
          <NodeAffordances
            cx={point.x}
            cy={point.y}
            radius={radius}
            expanded={expanded}
            title={node.bookmark.title}
            onOpen={() => onOpen(id)}
            onExpand={() => onExpand(id)}
          />
        )
        : null}
    </g>
  );
}

/** The open + expand/collapse icon buttons flanking the selected node (inline SVG, viewBox-scaled). */
function NodeAffordances({
  cx,
  cy,
  radius,
  expanded,
  title,
  onOpen,
  onExpand,
}: {
  cx: number;
  cy: number;
  radius: number;
  expanded: boolean;
  title: string;
  onOpen: () => void;
  onExpand: () => void;
}) {
  const offset = radius + 12;
  return (
    <>
      <AffordanceButton
        x={cx + offset}
        y={cy - offset}
        icon={ExternalLink}
        label={i18n.t("Open {{title}}", {
          title,
        })}
        onActivate={onOpen}
      />
      <AffordanceButton
        x={cx - offset}
        y={cy - offset}
        icon={expanded ? Minus : Plus}
        label={expanded ? i18n.t("Collapse related") : i18n.t("Expand related")}
        onActivate={onExpand}
      />
    </>
  );
}

const AFFORDANCE_RADIUS = 11;
const AFFORDANCE_ICON = 14;

/** A small circular icon button in SVG space — stops pointer propagation so it never starts a drag. */
function AffordanceButton({
  x,
  y,
  icon: Icon,
  label,
  onActivate,
}: {
  x: number;
  y: number;
  icon: ComponentType<{ x?: number;
    y?: number;
    width?: number;
    height?: number;
    className?: string; }>;
  label: string;
  onActivate: () => void;
}) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      onPointerDown={e => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      className="cursor-pointer outline-none"
    >
      <title>{label}</title>
      <circle
        cx={x}
        cy={y}
        r={AFFORDANCE_RADIUS}
        strokeWidth={1}
        className="fill-background stroke-border"
      />
      <Icon
        x={x - AFFORDANCE_ICON / 2}
        y={y - AFFORDANCE_ICON / 2}
        width={AFFORDANCE_ICON}
        height={AFFORDANCE_ICON}
        className="text-foreground"
      />
    </g>
  );
}
