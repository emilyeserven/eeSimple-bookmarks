import type { ScanPipelineRegistryRef, ScanPipelineStage } from "@eesimple/types";
import type { TFunction } from "i18next";

import { useState } from "react";

import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { GateBadge } from "./GateBadge";
import { PrecedenceChainList } from "./PrecedenceChainList";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function registryLabel(t: TFunction, ref: ScanPipelineRegistryRef): string {
  switch (ref) {
    case "oembedProviders":
      return t("Uses the oEmbed provider registry");
    case "contentKinds":
      return t("Uses the content-kind registry");
    case "isbnHtmlStrategies":
      return t("Uses the ISBN HTML extraction strategies");
  }
}

/**
 * One scan-pipeline stage: name + gate badge + summary, expanding to the longer detail, the live
 * gate specifics, any precedence chains, and a registry chip. The only component in the pipeline
 * view with expand state. Stage text is server-authored data and renders as-is.
 */
export function ScanPipelineStageRow({
  stage, step,
}: { stage: ScanPipelineStage;
  step?: number; }) {
  const {
    t,
  } = useTranslation();
  const [open, setOpen] = useState(false);
  const hasBody = Boolean(stage.detail)
    || Boolean(stage.live?.detail)
    || (stage.precedences?.length ?? 0) > 0
    || stage.registryRef !== undefined;
  return (
    <Collapsible
      open={open && hasBody}
      onOpenChange={setOpen}
      className="rounded-md border bg-background px-3 py-2"
    >
      <CollapsibleTrigger
        className="flex w-full items-start gap-2 text-left"
        disabled={!hasBody}
      >
        {step !== undefined && (
          <span
            className="
              mt-0.5 flex size-5 shrink-0 items-center justify-center
              rounded-full bg-muted text-[11px] font-medium tabular-nums
            "
          >
            {step}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{stage.name}</span>
            <GateBadge
              gate={stage.gate}
              live={stage.live}
            />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{stage.summary}</p>
        </div>
        {hasBody && (
          <ChevronDown
            className={`
              mt-1 size-4 shrink-0 text-muted-foreground transition-transform
              ${open ? "rotate-180" : ""}
            `}
          />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2 pl-7">
        {stage.detail && <p className="text-sm text-muted-foreground">{stage.detail}</p>}
        {stage.live?.detail && <p className="text-xs text-muted-foreground">{stage.live.detail}</p>}
        {stage.precedences?.map(precedence => (
          <PrecedenceChainList
            key={precedence.id}
            precedence={precedence}
          />
        ))}
        {stage.registryRef && (
          <Badge variant="outline">{registryLabel(t, stage.registryRef)}</Badge>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
