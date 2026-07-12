import { useState } from "react";

import { Check, ChevronDown, Pencil, StickyNote } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useScratchpadSettings, useUpdateScratchpadSettings } from "../hooks/useAppSettings";

import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";

/**
 * The Scratchpad panel in the sidebar footer (below the {@link SidebarTabBasket}). Desktop-only. A
 * simple place to keep free-form notes: collapsed it is a single line — a note icon, the label, and
 * an expander; expanded it shows the note as **rendered Markdown**, with an edit button that swaps in
 * a small mono-font textarea (no toolbar) holding the raw Markdown. The note persists server-side
 * (app-settings singleton) so it syncs across devices; edits auto-save on blur (edit-tab auto-save
 * standard) via {@link useUpdateScratchpadSettings}.
 */
export function SidebarScratchpad() {
  const {
    t,
  } = useTranslation();
  const {
    state, isMobile,
  } = useSidebar();
  const {
    data,
  } = useScratchpadSettings();
  const update = useUpdateScratchpadSettings();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // Desktop-only feature.
  if (isMobile) return null;

  const text = data?.scratchpadText ?? "";

  const startEditing = () => {
    setDraft(text);
    setEditing(true);
  };

  // Persist on blur / Done — skip the write when nothing changed (deep-equal no-op).
  const commit = () => {
    setEditing(false);
    if (draft !== text) update.mutate({
      scratchpadText: draft,
    });
  };

  // In icon-collapsed mode the rail is too narrow for the note — show just the icon with a tooltip.
  if (state === "collapsed") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip={t("Scratchpad")}>
            <StickyNote />
            <span>{t("Scratchpad")}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <div className="px-1 pb-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          aria-expanded={expanded}
          className="
            flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5
            text-sm
            hover:bg-accent hover:text-accent-foreground
          "
        >
          <StickyNote className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{t("Scratchpad")}</span>
          <ChevronDown
            className={`
              ml-auto size-3.5 shrink-0 transition-transform duration-200
              ${expanded ? "" : "-rotate-90"}
            `}
          />
        </button>
        {expanded && (editing
          ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label={t("Done editing notes")}
              title={t("Done")}
              onClick={commit}
            >
              <Check className="size-4" />
            </Button>
          )
          : (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label={t("Edit notes")}
              title={t("Edit notes")}
              onClick={startEditing}
            >
              <Pencil className="size-4" />
            </Button>
          ))}
      </div>

      {expanded && (
        <div className="mt-1 px-2">
          {editing
            ? (
              <Textarea
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={commit}
                rows={8}
                className="max-h-[16em] font-mono text-xs"
                placeholder={t("Write notes in Markdown…")}
              />
            )
            : text.trim() === ""
              ? (
                <p className="py-1.5 text-xs text-muted-foreground">
                  {t("No notes yet. Click the pencil to add some.")}
                </p>
              )
              : (
                <div className="max-h-[16em] overflow-y-auto">
                  <RichTextEditor
                    editable={false}
                    value={text}
                  />
                </div>
              )}
        </div>
      )}
    </div>
  );
}
