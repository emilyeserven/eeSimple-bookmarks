import * as React from "react";

import { ChevronsUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CategoryIcon,
  CUSTOM_CATEGORY_NAMES,
  CUSTOM_ICON_NAMES,
  CUSTOM_ICONS_BY_CATEGORY,
  ICON_NAMES,
  LUCIDE_CATEGORY_NAMES,
  LUCIDE_ICONS_BY_CATEGORY,
  PHOSPHOR_CATEGORY_NAMES,
  PHOSPHOR_ICON_NAMES,
  PHOSPHOR_ICONS_BY_CATEGORY,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  "value": string | null | undefined;
  "onChange": (icon: string) => void;
  "className"?: string;
  "aria-label"?: string;
}

/** One category block in the browse list. `id` is unique across all sources (Lucide,
 * custom, and Phosphor can share a label, e.g. "Maps & Location"); `label` is the
 * human-visible name; `icons` are the (possibly prefixed) icon names in that category. */
interface IconSection {
  id: string;
  label: string;
  source: "lucide" | "custom" | "phosphor";
  icons: string[];
}

/** Every category, in browse order: Lucide → custom (Religion & Culture) → Phosphor.
 * Built once at module init; the picker renders all of them in one continuous scroll. */
const SECTIONS: IconSection[] = [
  ...LUCIDE_CATEGORY_NAMES.map((label): IconSection => ({
    id: `lucide:${label}`,
    label,
    source: "lucide",
    icons: LUCIDE_ICONS_BY_CATEGORY[label] ?? [],
  })),
  ...CUSTOM_CATEGORY_NAMES.map((label): IconSection => ({
    id: `custom:${label}`,
    label,
    source: "custom",
    icons: CUSTOM_ICONS_BY_CATEGORY[label] ?? [],
  })),
  ...PHOSPHOR_CATEGORY_NAMES.map((label): IconSection => ({
    id: `ph:${label}`,
    label,
    source: "phosphor",
    icons: PHOSPHOR_ICONS_BY_CATEGORY[label] ?? [],
  })),
];

/** Track which section is scrolled into view inside `scrollRef`, for the category nav
 * highlight. Returns the active section id plus a ref-registrar to attach to each section. */
function useScrollSpy(enabled: boolean, scrollRef: React.RefObject<HTMLDivElement | null>) {
  const [activeId, setActiveId] = React.useState<string>(SECTIONS[0]?.id ?? "");
  const elements = React.useRef(new Map<string, HTMLElement>());

  const register = React.useCallback((id: string) => (el: HTMLElement | null) => {
    if (el) elements.current.set(id, el);
    else elements.current.delete(id);
  }, []);

  React.useEffect(() => {
    const root = scrollRef.current;
    if (!enabled || !root) return;
    setActiveId(SECTIONS[0]?.id ?? "");
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = visible[0]?.target.getAttribute("data-section-id");
        if (id) setActiveId(id);
      },
      {
        root,
        rootMargin: "0px 0px -75% 0px",
        threshold: 0,
      },
    );
    for (const el of elements.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, scrollRef]);

  return {
    activeId,
    register,
  };
}

/**
 * A searchable icon picker built from shadcn `Popover` + `Command`. Browsing shows every
 * category in one continuous scroll with a vertical category nav on the right that
 * highlights the category in view and jumps to it on click; typing switches to a flat
 * search across all icons. Lucide names are stored as-is, Phosphor names with a `"ph:"`
 * prefix, and app-authored custom icons with a `"custom:"` prefix.
 */
export function IconPicker({
  value,
  onChange,
  className,
  "aria-label": ariaLabelProp,
}: IconPickerProps) {
  const {
    t,
  } = useTranslation();
  const ariaLabel = ariaLabelProp ?? t("Icon");
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const isSearching = query.trim().length > 0;
  const {
    activeId, register,
  } = useScrollSpy(open && !isSearching, scrollRef);

  const lucideSearchResults = React.useMemo(() => {
    if (!isSearching) return null;
    const needle = query.trim().toLowerCase();
    return ICON_NAMES.filter(n => n.toLowerCase().includes(needle));
  }, [query, isSearching]);

  const customSearchResults = React.useMemo(() => {
    if (!isSearching) return [];
    const needle = query.trim().toLowerCase();
    return CUSTOM_ICON_NAMES.filter(name => name.slice(7).toLowerCase().includes(needle));
  }, [query, isSearching]);

  const phosphorSearchResults = React.useMemo(() => {
    if (!isSearching) return PHOSPHOR_ICON_NAMES;
    const needle = query.trim().toLowerCase();
    return PHOSPHOR_ICON_NAMES.filter(name => name.slice(3).toLowerCase().includes(needle));
  }, [query, isSearching]);

  const noSearchResults = (lucideSearchResults ?? []).length === 0
    && customSearchResults.length === 0
    && phosphorSearchResults.length === 0;

  const displayName = value
    ? (value.includes(":") ? value.slice(value.indexOf(":") + 1) : value)
    : null;

  function selectIcon(name: string) {
    onChange(name);
    setOpen(false);
  }

  function renderIconGrid(names: string[]) {
    return (
      <div className="grid grid-cols-6 gap-1 p-1">
        {names.map(name => (
          <CommandItem
            key={name}
            value={name}
            title={name.includes(":") ? name.slice(name.indexOf(":") + 1) : name}
            onSelect={() => selectIcon(name)}
            className={cn(
              "flex aspect-square items-center justify-center p-0",
              value === name && "bg-accent text-accent-foreground",
            )}
          >
            <CategoryIcon
              name={name}
              className="size-4"
            />
          </CommandItem>
        ))}
      </div>
    );
  }

  function scrollToSection(id: string) {
    const root = scrollRef.current;
    const el = root?.querySelector<HTMLElement>(`[data-section-id="${id}"]`);
    if (!root || !el) return;
    // rect-based offset is robust to whether the scroll container is positioned.
    const top = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
    root.scrollTo({
      top,
      behavior: "smooth",
    });
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="flex items-center gap-2">
            <CategoryIcon
              name={value}
              className="size-4"
            />
            <span
              className={cn("truncate", !displayName && "text-muted-foreground")}
            >
              {displayName ?? t("Pick an icon")}
            </span>
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] max-w-[calc(100vw-2rem)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("Search icons…")}
            value={query}
            onValueChange={setQuery}
          />

          {/* Search mode: flat results across all icons */}
          {isSearching && (
            <CommandList className="max-h-[400px]">
              {noSearchResults && <CommandEmpty>{t("No matching icons.")}</CommandEmpty>}
              {(lucideSearchResults ?? []).length > 0 && (
                <CommandGroup heading={t("Lucide Icons")}>
                  {renderIconGrid(lucideSearchResults ?? [])}
                </CommandGroup>
              )}
              {customSearchResults.length > 0 && (
                <CommandGroup heading={t("Custom Icons")}>
                  {renderIconGrid(customSearchResults)}
                </CommandGroup>
              )}
              {phosphorSearchResults.length > 0 && (
                <CommandGroup heading={t("Phosphor Icons")}>
                  {renderIconGrid(phosphorSearchResults)}
                </CommandGroup>
              )}
            </CommandList>
          )}

          {/* Browse mode: continuous scroll of every category + vertical category nav */}
          {!isSearching && (
            <div className="flex">
              <CommandList
                ref={scrollRef}
                className="max-h-[400px] flex-1"
              >
                {SECTIONS.map(section => (
                  <div
                    key={section.id}
                    ref={register(section.id)}
                    data-section-id={section.id}
                  >
                    <CommandGroup heading={t(section.label)}>
                      {renderIconGrid(section.icons)}
                    </CommandGroup>
                  </div>
                ))}
              </CommandList>
              <nav
                aria-label={t("Icon categories")}
                className="
                  flex max-h-[400px] w-32 shrink-0 flex-col overflow-y-auto
                  border-l py-1
                "
              >
                {SECTIONS.map((section, i) => {
                  const prev = SECTIONS[i - 1];
                  const showDivider = !prev || prev.source !== section.source;
                  return (
                    <React.Fragment key={section.id}>
                      {showDivider && section.source !== "lucide" && (
                        <span
                          className="
                            px-2 pt-2 pb-0.5 text-[10px] font-medium
                            tracking-wide text-muted-foreground/70 uppercase
                          "
                        >
                          {section.source === "custom" ? t("Custom") : t("Phosphor")}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          `
                            mx-1 rounded-sm px-2 py-1 text-left text-xs
                            whitespace-nowrap transition-colors
                          `,
                          activeId === section.id
                            ? "bg-accent font-medium text-accent-foreground"
                            : `
                              text-muted-foreground
                              hover:bg-accent hover:text-accent-foreground
                            `,
                        )}
                      >
                        {t(section.label)}
                      </button>
                    </React.Fragment>
                  );
                })}
              </nav>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
