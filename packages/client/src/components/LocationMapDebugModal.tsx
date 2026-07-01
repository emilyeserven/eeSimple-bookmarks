import type { MapDebugInfo } from "../lib/locationMapDebug";

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
    summary,
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
