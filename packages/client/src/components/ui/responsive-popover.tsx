import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface ResponsivePopoverProps {
  /**
   * The control that opens the surface (an icon button), rendered via `asChild`. Omit for a
   * controlled, trigger-less surface — e.g. when the header More menu opens it from a menu item.
   */
  trigger?: React.ReactNode;
  /** Heading shown above the body on desktop, and the `DialogTitle` (required for a11y) on mobile. */
  title: string;
  /** Optional control rendered inline with the title, same row, `justify-between` (e.g. a presence toggle). */
  titleEnd?: React.ReactNode;
  /** Optional supporting line, shown as `DialogDescription` on mobile. */
  description?: string;
  /** The shared inner content — the single source of truth rendered by both breakpoints. */
  children: React.ReactNode;
  /** Controlled open state. Omit for the normal trigger-driven (uncontrolled) case. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Popover alignment (desktop only). */
  align?: "start" | "center" | "end";
  contentClassName?: string;
}

/**
 * A popover on `>=md` and a modal `Dialog` on `<md`, sharing one inner body. The single primitive
 * behind header/toolbar controls so they "become a modal on small screens" without duplicating the
 * content. Supports both the uncontrolled trigger-driven case (the normal desktop popover) and a
 * controlled, trigger-less case (the mobile More menu opens it). See the `responsive-popover` skill.
 */
export function ResponsivePopover({
  trigger,
  title,
  titleEnd,
  description,
  children,
  open,
  onOpenChange,
  align = "end",
  contentClassName,
}: ResponsivePopoverProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
        <DialogContent className={cn("max-w-sm", contentClassName)}>
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>{title}</DialogTitle>
              {titleEnd}
            </div>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
    >
      {trigger ? <PopoverTrigger asChild>{trigger}</PopoverTrigger> : null}
      <PopoverContent
        align={align}
        className={cn("w-auto min-w-56", contentClassName)}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{title}</p>
          {titleEnd}
        </div>
        {children}
      </PopoverContent>
    </Popover>
  );
}
