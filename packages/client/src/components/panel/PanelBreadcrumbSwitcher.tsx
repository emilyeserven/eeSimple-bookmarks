import type { DrawerContentType } from "@/lib/drawerSearch";

import { useState } from "react";

import { Check, ChevronsUpDown } from "lucide-react";

import { usePanelSwitcherItems } from "./panelBreadcrumbData";
import { usePanelControls } from "./usePanelControls";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function PanelBreadcrumbSwitcher({
  dCT, dCId,
}: { dCT: DrawerContentType;
  dCId: string; }) {
  const [open, setOpen] = useState(false);
  const {
    openItem, dMode,
  } = usePanelControls();
  const {
    items, isLoading,
  } = usePanelSwitcherItems(dCT);

  if (!isLoading && items.length <= 1) return null;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Switch to a related item"
          className={cn(`
            ml-0.5 inline-flex items-center rounded-sm p-0.5
            text-muted-foreground opacity-0 transition-opacity
            group-hover/crumb:opacity-100
            hover:text-foreground
            focus-visible:opacity-100
            data-[state=open]:opacity-100
          `)}
        >
          <ChevronsUpDown className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>{isLoading ? "Loading…" : "No matches."}</CommandEmpty>
            <CommandGroup>
              {items.map(item => (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.id}`}
                  onSelect={() => {
                    setOpen(false);
                    openItem(dCT, item.id, dMode ?? "view");
                  }}
                >
                  <span className="truncate">{item.label}</span>
                  <Check
                    className={cn(
                      "ml-auto",
                      item.id === dCId ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
