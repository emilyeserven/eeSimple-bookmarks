import type { MapAncestryDebug, MapDebugInfo } from "../lib/locationMapDebug";

import { useState } from "react";

import { Bug } from "lucide-react";
import { useTranslation } from "react-i18next";

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
import i18n from "@/i18n";

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
  const {
    t,
  } = useTranslation();
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
          {t("Debug")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("Map debug info")}</DialogTitle>
          <DialogDescription>
            {t("Everything that decides what this map draws — props, resolved settings, the Levels overlay state, and a per-location outcome (rendered vs. why it’s hidden). Copy it to share when something doesn’t show up.")}
          </DialogDescription>
        </DialogHeader>

        <dl
          className="
            grid grid-cols-2 gap-x-4 gap-y-1 text-xs
            sm:grid-cols-3
          "
        >
          <DebugStat
            label={t("Total locations")}
            value={summary.totalNodes}
          />
          <DebugStat
            label={t("Rendered")}
            value={summary.rendered}
          />
          <DebugStat
            label={t("Areas / pins")}
            value={`${summary.renderedAreas} / ${summary.renderedPins}`}
          />
          <DebugStat
            label={t("No geometry")}
            value={summary.omittedNoGeometry}
          />
          <DebugStat
            label={t("Hidden by level")}
            value={summary.hiddenByLevel}
          />
          <DebugStat
            label={t("No place type / level")}
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
            label={t("Copy debug JSON")}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Plain-language verdict on why the viewed place's ancestor chain is (or isn't) plotted — the point
 * of this whole diagnostic. Ordered by the checks a missing chain trips: tree still loading, root
 * location (no ancestors exist), path failed to resolve, else the chain is present.
 */
function ancestryVerdict(ancestry: MapAncestryDebug): string {
  if (!ancestry.treeLoaded) return i18n.t("The full location tree is still loading — ancestors can't resolve yet.");
  if (ancestry.parentId === null) {
    return i18n.t("This is a root location — it has no parent, so its ancestor chain was never built (a geocoding/data gap, not a display issue).");
  }
  if (!ancestry.foundInTree) {
    return i18n.t("This location wasn’t found in the loaded tree, so its ancestor path couldn’t be resolved.");
  }
  if (ancestry.ancestors.length === 0) {
    return i18n.t("A parent id is set but no ancestors resolved from the tree — the parent may be missing from the tree.");
  }
  return i18n.t("{{count}} ancestor(s) resolved and plotted alongside this location.", {
    count: ancestry.ancestors.length,
  });
}

/** The ancestor-chain diagnostic block shown above the raw JSON on location detail maps. */
function AncestryDiagnostic({
  ancestry,
}: {
  ancestry: MapAncestryDebug;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-xs">
      <p className="font-medium">{t("Ancestor chain")}</p>
      <p className="text-muted-foreground">{ancestryVerdict(ancestry)}</p>
      <dl
        className="
          grid grid-cols-2 gap-x-4 gap-y-1
          sm:grid-cols-3
        "
      >
        <DebugStat
          label={t("Parent id")}
          value={ancestry.parentId ?? t("(root — none)")}
        />
        <DebugStat
          label={t("Ancestors resolved")}
          value={ancestry.ancestors.length}
        />
        <DebugStat
          label={t("Found in tree")}
          value={ancestry.foundInTree ? t("yes") : t("no")}
        />
        <DebugStat
          label={t("Tree loaded")}
          value={ancestry.treeLoaded
            ? t("yes ({{count}})", {
              count: ancestry.treeNodeCount,
            })
            : t("no")}
        />
        <DebugStat
          label={t("Only direct")}
          value={ancestry.onlyDirectRelatives ? t("on") : t("off")}
        />
      </dl>
      {ancestry.ancestors.length > 0
        ? (
          <p className="text-muted-foreground">
            {t("Chain:")}
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
