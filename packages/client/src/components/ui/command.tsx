import * as React from "react";

import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Command({
  className, ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        `
          flex size-full flex-col overflow-hidden rounded-md bg-popover
          text-popover-foreground
        `,
        className,
      )}
      {...props}
    />
  );
}

function CommandInput({
  className, ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-9 items-center gap-2 border-b px-3"
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          `
            flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none
            placeholder:text-muted-foreground
            disabled:cursor-not-allowed disabled:opacity-50
          `,
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({
  className, onWheel, ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto",
        className,
      )}
      onWheel={(event) => {
        // A Popover's content portals to <body>, so when the popover opens inside a Dialog (e.g. a
        // Combobox in a modal form), the Dialog's scroll-lock doesn't recognize this list as part of
        // its own subtree and swallows the wheel event before it can scroll natively. Apply the delta
        // ourselves so the list still scrolls in that nesting.
        event.currentTarget.scrollTop += event.deltaY;
        onWheel?.(event);
      }}
      {...props}
    />
  );
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm"
      {...props}
    />
  );
}

function CommandGroup({
  className, ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        `
          overflow-hidden p-1 text-foreground
          **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5
          **:[[cmdk-group-heading]]:text-xs
          **:[[cmdk-group-heading]]:font-medium
          **:[[cmdk-group-heading]]:text-muted-foreground
        `,
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className, ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function CommandItem({
  className, ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        `
          relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5
          text-sm outline-hidden select-none
          data-[disabled=true]:pointer-events-none
          data-[disabled=true]:opacity-50
          data-[selected=true]:bg-accent
          data-[selected=true]:text-accent-foreground
          [&_svg]:pointer-events-none [&_svg]:shrink-0
          [&_svg:not([class*='size-'])]:size-4
        `,
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
};
