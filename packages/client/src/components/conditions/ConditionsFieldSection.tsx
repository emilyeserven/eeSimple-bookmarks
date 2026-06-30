import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SectionProps {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** A labelled collapsible group within the conditions builder. */
export function Section({
  title, summary, defaultOpen, children,
}: SectionProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="rounded-md border"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="
            flex w-full items-center justify-between gap-2 p-3 text-left text-sm
            font-medium
          "
        >
          <span>
            {title}
            {summary ? <span className="ml-2 font-normal text-muted-foreground">{summary}</span> : null}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t p-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
