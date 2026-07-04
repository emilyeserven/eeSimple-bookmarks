import { useEffect, useRef, useState } from "react";

import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUiStore } from "@/stores/uiStore";

/** Search icon + expanding inline input for listing pages. Renders nothing when no listing page has registered. */
export function ListingSearchBar() {
  const headerSearchActive = useUiStore(state => state.headerSearchActive);
  const headerSearchQuery = useUiStore(state => state.headerSearchQuery);
  const setHeaderSearchQuery = useUiStore(state => state.setHeaderSearchQuery);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    t,
  } = useTranslation();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Collapse and clear when the page unmounts its search registration
  useEffect(() => {
    if (!headerSearchActive) setOpen(false);
  }, [headerSearchActive]);

  if (!headerSearchActive) return null;

  function clearAndClose() {
    setHeaderSearchQuery("");
    setOpen(false);
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("Search")}
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        ref={inputRef}
        type="text"
        placeholder={t("Search…")}
        value={headerSearchQuery}
        onChange={e => setHeaderSearchQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") clearAndClose(); }}
        className="h-8 w-40"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("Clear search")}
        onClick={clearAndClose}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
