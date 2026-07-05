import type { DrawerContentType } from "@/lib/drawerSearch";

import { useMemo, useState } from "react";

import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { getContentType } from "./contentTypes";
import { usePanelControls } from "./usePanelControls";
import { RomanizedLabel } from "../RomanizedLabel";

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
  const {
    t,
  } = useTranslation();
  const def = getContentType(type);
  const {
    openItem,
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
      || (item.sublabel?.toLowerCase().includes(needle) ?? false)
      || (item.romanized?.toLowerCase().includes(needle) ?? false));
  }, [items, query]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{def.label}</h2>

      <Input
        type="search"
        placeholder={t("Search {{label}}…", {
          label: def.label.toLowerCase(),
        })}
        value={query}
        onChange={event => setQuery(event.target.value)}
      />

      {isLoading ? <p className="text-muted-foreground">{t("Loading…")}</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && !error && filtered.length === 0
        ? (
          <p className="text-muted-foreground">
            {query
              ? t("No matches.")
              : t("No {{label}} yet.", {
                label: def.label.toLowerCase(),
              })}
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
              <span className="w-full truncate text-sm font-medium">
                {item.romanized
                  ? (
                    <RomanizedLabel
                      name={item.label}
                      romanized={item.romanized}
                    />
                  )
                  : item.label}
              </span>
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
              aria-label={t("Edit {{name}}", {
                name: item.label,
              })}
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
