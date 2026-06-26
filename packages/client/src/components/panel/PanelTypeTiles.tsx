import { useMemo, useState } from "react";

import { Bell, Search, Sparkles, X } from "lucide-react";

import { PANEL_CONTENT_TYPES } from "./contentTypes";
import { usePanelControls } from "./usePanelControls";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** The panel's landing state: a grid of tiles, one per browsable content type. */
export function PanelTypeTiles() {
  const {
    openType,
  } = usePanelControls();
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const filteredTypes = useMemo(
    () => (needle
      ? PANEL_CONTENT_TYPES.filter(({
        label,
      }) => label.toLowerCase().includes(needle))
      : PANEL_CONTENT_TYPES),
    [needle],
  );
  const showNotifications = !needle || "notifications".includes(needle);
  const showAiSummarization = !needle || "ai summarization".includes(needle);
  const hasResults = filteredTypes.length > 0 || showNotifications || showAiSummarization;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Browse</h2>
        <p className="text-sm text-muted-foreground">Pick a type to view or edit its items.</p>
      </div>
      <div className="relative flex items-center">
        <Search
          className="
            pointer-events-none absolute left-2.5 size-3.5 shrink-0
            text-muted-foreground
          "
        />
        <Input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search types…"
          className="h-8 pr-7 pl-8 text-xs"
        />
        {query
          ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="
                absolute right-2 text-muted-foreground
                hover:text-foreground
              "
            >
              <X className="size-3.5" />
            </button>
          )
          : null}
      </div>
      {hasResults
        ? (
          <>
            {filteredTypes.length > 0
              ? (
                <div className="grid grid-cols-2 gap-3">
                  {filteredTypes.map(({
                    type, label, icon: Icon,
                  }) => (
                    <Button
                      key={type}
                      type="button"
                      variant="outline"
                      className="h-auto flex-col items-start gap-2 p-4"
                      onClick={() => openType(type)}
                    >
                      <Icon className="size-5" />
                      <span className="text-sm font-medium">{label}</span>
                    </Button>
                  ))}
                </div>
              )
              : null}
            {showNotifications
              ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full flex-col items-start gap-2 p-4"
                  onClick={() => openType("notifications")}
                >
                  <Bell className="size-5" />
                  <span className="text-sm font-medium">Notifications</span>
                </Button>
              )
              : null}
            {showAiSummarization
              ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full flex-col items-start gap-2 p-4"
                  onClick={() => openType("ai-summarization")}
                >
                  <Sparkles className="size-5" />
                  <span className="text-sm font-medium">AI Summarization</span>
                </Button>
              )
              : null}
          </>
        )
        : (
          <p className="text-sm text-muted-foreground">No results.</p>
        )}
    </div>
  );
}
