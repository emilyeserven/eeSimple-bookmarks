import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CollapsibleFormSectionProps {
  title: string;
  description: string;
  preview: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** A form section that collapses to a one-line preview and expands to its full fields. */
export function CollapsibleFormSection({
  title, description, preview, defaultOpen, children,
}: CollapsibleFormSectionProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="group/section space-y-3"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-start justify-between gap-2 text-left"
        >
          <span className="space-y-1">
            <span className="block text-sm font-semibold">{title}</span>
            <span
              className="
                block text-xs text-muted-foreground
                group-data-[state=open]/section:hidden
              "
            >
              {preview}
            </span>
          </span>
          <ChevronDown
            className="
              mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform
              group-data-[state=open]/section:rotate-180
            "
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{description}</p>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
