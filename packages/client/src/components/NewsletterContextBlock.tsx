import { ChevronDown } from "lucide-react";

import { highlightAnchor } from "../lib/newsletterContext";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/** The collapsible captured-passage block, with the link's anchor text bolded. */
export function NewsletterContextBlock({
  context, anchorText, open, onOpenChange,
}: {
  context: string;
  anchorText: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
    >
      <CollapsibleTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="-ml-2 h-auto gap-1 px-2 py-1 text-xs text-muted-foreground"
        >
          <ChevronDown
            className={`
              size-3 transition-transform
              ${open ? "rotate-180" : ""}
            `}
          />
          Context
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent
        className="
          mt-1 rounded-md bg-muted/40 p-2 text-xs whitespace-pre-line
          text-muted-foreground
        "
      >
        {highlightAnchor(context, anchorText).map((segment, index) =>
          segment.bold
            ? (
              <strong
                key={index}
                className="font-semibold text-foreground"
              >
                {segment.text}
              </strong>
            )
            : <span key={index}>{segment.text}</span>)}
      </CollapsibleContent>
    </Collapsible>
  );
}
