import type { BookmarkGraphEdge, BookmarkGraphModel, BookmarkGraphNode } from "../lib/bookmarkGraph";
import type { BookmarkGraphPoint } from "../lib/bookmarkGraphLayout";
import type { RelatednessDimension } from "../lib/relatedBookmarks";
import type { ComponentType } from "react";

import { useEffect, useMemo, useRef, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { ExternalLink, Minus, Plus } from "lucide-react";

import { useBookmarkGraphSimulation } from "../hooks/useBookmarkGraphSimulation";
import { useCategories } from "../hooks/useCategories";
import { edgeOpacity, edgeStrokeWidth, neighborsOf, nodeOpacityForDistance, nodeRadius, truncateLabel } from "../lib/bookmarkGraph";
import { VIEW_HEIGHT, VIEW_WIDTH } from "../lib/bookmarkGraphLayout";
import { explainRelatedness } from "../lib/relatedBookmarks";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { useBookmarkGraphSettings } from "@/hooks/useAppSettings";
import i18n from "@/i18n";
import { useUiStore } from "@/stores/uiStore";

/**
 * The Obsidian-style relatedness graph: the current bookmark pinned at the center, its related
 * bookmarks around it, and a line between every displayed pair that shares commonalities — thicker and
 * less transparent the more they share. A live d3-force simulation animates the layout; peers are
 * **draggable**, a plain tap **selects** a node (highlighting it + its neighbors and dimming the rest,
 * revealing its affordances). The controls bar adjusts node spacing and toggles the second layer for
 * all peers; while a node is selected, hovering a related node explains how the two are related.
 */
export function BookmarkGraph({
  graph,
  expandedIds,
  toggleExpand,
  showSecondLayer,
  toggleSecondLayer,
}: {
  graph: BookmarkGraphModel;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  showSecondLayer: boolean;
  toggleSecondLayer: () => void;
}) {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const justExpandedRef = useRef<string | null>(null);
  const spacing = useUiStore(state => state.bookmarkGraphSpacing);
  const setSpacing = useUiStore(state => state.setBookmarkGraphSpacing);
  const {
    svgRef, getPoint, nodeHandlers,
  } = useBookmarkGraphSimulation(graph, {
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    spacing,
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

  // The related node the cursor is over while something is selected — drives the relationship popover.
  const hoverPair = selectedId && hoveredId && hoveredId !== selectedId && connectedIds?.has(hoveredId)
    ? {
      selected: graph.nodes.find(node => node.bookmark.id === selectedId),
      hovered: graph.nodes.find(node => node.bookmark.id === hoveredId),
    }
    : null;
  const hoverAnchor = hoverPair?.hovered
    ? toClientPoint(svgRef.current, getPoint(hoverPair.hovered.bookmark.id))
    : null;

  return (
    <div className="space-y-3">
      <BookmarkGraphControls
        spacing={spacing}
        onSpacingChange={setSpacing}
        showSecondLayer={showSecondLayer}
        onToggleSecondLayer={toggleSecondLayer}
      />
      <div className="relative">
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
              expanded={expandedIds.has(node.bookmark.id) || (showSecondLayer && node.distance === 1)}
              handlers={nodeHandlers(node.bookmark.id)}
              onSelect={setSelectedId}
              onHover={setHoveredId}
              onOpen={goTo}
              onExpand={onExpand}
            />
          ))}
        </svg>
        {hoverPair?.selected && hoverPair.hovered && hoverAnchor
          ? (
            <GraphRelationshipPopover
              selected={hoverPair.selected.bookmark}
              hovered={hoverPair.hovered.bookmark}
              anchor={hoverAnchor}
            />
          )
          : null}
      </div>
    </div>
  );
}

/** The node-spacing slider + show-second-layer toggle, above the graph. */
function BookmarkGraphControls({
  spacing,
  onSpacingChange,
  showSecondLayer,
  onToggleSecondLayer,
}: {
  spacing: number;
  onSpacingChange: (value: number) => void;
  showSecondLayer: boolean;
  onToggleSecondLayer: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{i18n.t("Node spacing")}</span>
        <Slider
          min={0.5}
          max={2}
          step={0.05}
          value={[spacing]}
          onValueChange={([value]) => onSpacingChange(value)}
          aria-label={i18n.t("Node spacing")}
          className="w-40"
        />
      </div>
      <Toggle
        size="sm"
        variant="outline"
        pressed={showSecondLayer}
        onPressedChange={onToggleSecondLayer}
        aria-label={i18n.t("Show second layer")}
      >
        {i18n.t("Show second layer")}
      </Toggle>
    </div>
  );
}

/** Map a viewBox point to fixed/client coordinates using the live rendered svg size. */
function toClientPoint(svg: SVGSVGElement | null, point: BookmarkGraphPoint | undefined): BookmarkGraphPoint | null {
  if (!svg || !point) return null;
  const rect = svg.getBoundingClientRect();
  return {
    x: rect.left + (point.x / VIEW_WIDTH) * rect.width,
    y: rect.top + (point.y / VIEW_HEIGHT) * rect.height,
  };
}

/** Translated label for each relatedness dimension shown in the hover popover. */
const DIMENSION_LABELS: Record<RelatednessDimension["dimension"], () => string> = {
  tags: () => i18n.t("Tags"),
  genreMoods: () => i18n.t("Genres & moods"),
  people: () => i18n.t("People"),
  groups: () => i18n.t("Groups"),
  category: () => i18n.t("Category"),
  mediaType: () => i18n.t("Media type"),
  website: () => i18n.t("Website"),
  youtubeChannel: () => i18n.t("Channel"),
  relationship: () => i18n.t("Relationship"),
};

/** The on-hover popover explaining how the selected and hovered bookmarks are related. */
function GraphRelationshipPopover({
  selected,
  hovered,
  anchor,
}: {
  selected: BookmarkGraphNode["bookmark"];
  hovered: BookmarkGraphNode["bookmark"];
  anchor: BookmarkGraphPoint;
}) {
  const {
    data: settings,
  } = useBookmarkGraphSettings();
  const {
    data: categories,
  } = useCategories();
  const dimensions = useMemo(() => {
    if (!settings) return [];
    const nameById = new Map((categories ?? []).map(category => [category.id, category.name]));
    return explainRelatedness(selected, hovered, settings.weights, id => nameById.get(id));
  }, [selected, hovered, settings, categories]);

  return (
    <Popover open>
      <PopoverAnchor asChild>
        <div
          style={{
            position: "fixed",
            left: anchor.x,
            top: anchor.y,
            width: 0,
            height: 0,
          }}
        />
      </PopoverAnchor>
      <PopoverContent
        side="top"
        align="center"
        onOpenAutoFocus={e => e.preventDefault()}
        className="pointer-events-none w-64 p-3"
      >
        <p className="mb-2 text-sm font-medium">{hovered.title}</p>
        {dimensions.length > 0
          ? (
            <ul className="space-y-1.5">
              {dimensions.map(dimension => (
                <li
                  key={dimension.dimension}
                  className="text-xs"
                >
                  <span className="text-muted-foreground">{DIMENSION_LABELS[dimension.dimension]()}</span>
                  <span className="mt-0.5 flex flex-wrap gap-1">
                    {dimension.values.map(value => (
                      <Badge
                        key={value}
                        variant="secondary"
                      >{value}
                      </Badge>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )
          : <p className="text-xs text-muted-foreground">{i18n.t("Related")}</p>}
      </PopoverContent>
    </Popover>
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
  onHover,
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
  onHover: (id: string | null) => void;
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
      onPointerEnter={() => onHover(id)}
      onPointerLeave={() => onHover(null)}
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
