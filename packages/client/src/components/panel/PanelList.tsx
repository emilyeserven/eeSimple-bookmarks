import type { DrawerContentType } from "@/lib/drawerSearch";

import { useMemo, useState } from "react";

import { ChevronLeft, Pencil } from "lucide-react";

import { getContentType } from "./contentTypes";
import { usePanelControls } from "./usePanelControls";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PanelListProps {
  type: DrawerContentType;
}

/**
 * A searchable list of one content type's items. Each row opens the item in `view` mode; an Edit
 * button — revealed on hover/focus — opens it in `edit` mode instead.
 */
export function PanelList({
  type,
}: PanelListProps) {
  const def = getContentType(type);
  const {
    open, openItem,
  } = usePanelControls();
  const {
    items, isLoading, error,
  } = def.useList();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(item =>
      item.label.toLowerCase().includes(needle)
      || (item.sublabel?.toLowerCase().includes(needle) ?? false));
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Back to content types"
          onClick={open}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <h2 className="text-xl font-semibold">{def.label}</h2>
      </div>

      <Input
        type="search"
        placeholder={`Search ${def.label.toLowerCase()}…`}
        value={query}
        onChange={event => setQuery(event.target.value)}
      />

      {isLoading ? <p className="text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && !error && filtered.length === 0
        ? (
          <p className="text-muted-foreground">
            {query ? "No matches." : `No ${def.label.toLowerCase()} yet.`}
          </p>
        )
        : null}

      <ul className="space-y-1">
        {filtered.map(item => (
          <li
            key={item.id}
            className="
              group flex items-center gap-2 rounded-md
              hover:bg-accent
            "
          >
            <button
              type="button"
              className="
                flex min-w-0 flex-1 flex-col items-start px-3 py-2 text-left
              "
              onClick={() => openItem(type, item.id, "view")}
            >
              <span className="w-full truncate text-sm font-medium">{item.label}</span>
              {item.sublabel
                ? (
                  <span
                    className="w-full truncate text-xs text-muted-foreground"
                  >{item.sublabel}
                  </span>
                )
                : null}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="
                mr-1 size-7 opacity-0 transition-opacity
                group-hover:opacity-100
                focus-visible:opacity-100
              "
              aria-label={`Edit ${item.label}`}
              onClick={() => openItem(type, item.id, "edit")}
            >
              <Pencil className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
