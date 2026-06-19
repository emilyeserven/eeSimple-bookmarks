import type { CustomProperty } from "@eesimple/types";

import { TriangleAlert } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UnassignedPropertiesWarningProps {
  properties: CustomProperty[];
}

/** Inline warning listing custom properties that aren't assigned to any category. */
export function UnassignedPropertiesWarning({
  properties,
}: UnassignedPropertiesWarningProps) {
  if (properties.length === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex items-center gap-1.5 text-xs text-destructive"
        >
          <TriangleAlert className="size-4 shrink-0" />
          {properties.length === 1
            ? "1 property without a category"
            : `${properties.length} properties without a category`}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {properties.map(property => property.name).join(", ")}
      </TooltipContent>
    </Tooltip>
  );
}
