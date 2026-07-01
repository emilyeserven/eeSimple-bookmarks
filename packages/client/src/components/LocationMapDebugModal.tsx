import type { MapAncestryDebug, MapDebugInfo } from "../lib/locationMapDebug";

import { useState } from "react";

import { Bug } from "lucide-react";

import { CopyJsonButton } from "./CopyJsonButton";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * A small "Debug" button rendered under every location map (see {@link LocationMap}). It opens a
 * dialog dumping the map's props, resolved settings, per-node render outcomes, and the "Levels"
 * overlay state as copy/paste-ready JSON — the tool for tracking down why a location doesn't appear.
 */
export function LocationMapDebugModal({
  debug,
}: {
  debug: MapDebugInfo;
}) {
  const [open, setOpen] = useState(false);
  const {
    summary, ancestry,
  } = debug;

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-xs text-muted-foreground"
        >
          <Bug className="size-3" />
          Debug
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Map debug info</DialogTitle>
          <DialogDescription>
            Everything that decides what this map draws — props, resolved settings, the Levels
            overlay state, and a per-location outcome (rendered vs. why it’s hidden). Copy it to
            share when something doesn’t show up.
          </DialogDescription>
        </DialogHeader>

        <dl
          className="
            grid grid-cols-2 gap-x-4 gap-y-1 text-xs
            sm:grid-cols-3
          "
        >
          <DebugStat
            label="Total locations"
            value={summary.totalNodes}
          />
          <DebugStat
            label="Rendered"
            value={summary.rendered}
          />
          <DebugStat
            label="Areas / pins"
            value={`${summary.renderedAreas} / ${summary.renderedPins}`}
          />
          <DebugStat
            label="No geometry"
            value={summary.omittedNoGeometry}
          />
          <DebugStat
            label="Hidden by level"
            value={summary.hiddenByLevel}
          />
          <DebugStat
            label="No place type / level"
            value={`${summary.noPlaceType} / ${summary.noLevel}`}
          />
        </dl>

        {ancestry ? <AncestryDiagnostic ancestry={ancestry} /> : null}

        <pre
          className="
            max-h-[45vh] overflow-auto rounded-md border bg-muted/50 p-3 text-xs
            select-text
          "
        >
          {JSON.stringify(debug, null, 2)}
        </pre>

        <div className="flex justify-end gap-2">
          <CopyJsonButton
            data={debug}
            label="Copy debug JSON"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Plain-language verdict on why the viewed place's ancestor chain is (or isn't) plotted — the point
 * of this whole diagnostic. Ordered by the checks a missing chain trips: tree still loading, toggle
 * off, root location (no ancestors exist), path failed to resolve, else the chain is present.
 */
function ancestryVerdict(ancestry: MapAncestryDebug): string {
  if (!ancestry.treeLoaded) return "The full location tree is still loading — ancestors can't resolve yet.";
  if (!ancestry.showAncestors) {
    return "“Show ancestors on map” is off, so only this location is plotted. Turn it on to show the parent chain.";
  }
  if (ancestry.parentId === null) {
    return "This is a root location — it has no parent, so its ancestor chain was never built (a geocoding/data gap, not a display issue).";
  }
  if (!ancestry.foundInTree) {
    return "This location wasn’t found in the loaded tree, so its ancestor path couldn’t be resolved.";
  }
  if (ancestry.ancestors.length === 0) {
    return "A parent id is set but no ancestors resolved from the tree — the parent may be missing from the tree.";
  }
  return `${ancestry.ancestors.length} ancestor(s) resolved and plotted alongside this location.`;
}

/** The ancestor-chain diagnostic block shown above the raw JSON on location detail maps. */
function AncestryDiagnostic({
  ancestry,
}: {
  ancestry: MapAncestryDebug;
}) {
  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-xs">
      <p className="font-medium">Ancestor chain</p>
      <p className="text-muted-foreground">{ancestryVerdict(ancestry)}</p>
      <dl
        className="
          grid grid-cols-2 gap-x-4 gap-y-1
          sm:grid-cols-3
        "
      >
        <DebugStat
          label="Show ancestors"
          value={ancestry.showAncestors ? "on" : "off"}
        />
        <DebugStat
          label="Parent id"
          value={ancestry.parentId ?? "(root — none)"}
        />
        <DebugStat
          label="Ancestors resolved"
          value={ancestry.ancestors.length}
        />
        <DebugStat
          label="Found in tree"
          value={ancestry.foundInTree ? "yes" : "no"}
        />
        <DebugStat
          label="Tree loaded"
          value={ancestry.treeLoaded ? `yes (${ancestry.treeNodeCount})` : "no"}
        />
        <DebugStat
          label="Only direct"
          value={ancestry.onlyDirectRelatives ? "on" : "off"}
        />
      </dl>
      {ancestry.ancestors.length > 0
        ? (
          <p className="text-muted-foreground">
            Chain:
            {" "}
            {ancestry.ancestors.map(a => a.name).join(" → ")}
          </p>
        )
        : null}
    </div>
  );
}

function DebugStat({
  label, value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
