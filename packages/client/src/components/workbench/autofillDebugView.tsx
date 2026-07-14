import type { AutofillRule } from "@eesimple/types";

import { useMemo, useState } from "react";

import { Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Combobox } from "../Combobox";
import { CopyJsonButton } from "../CopyJsonButton";

import { Button } from "@/components/ui/button";
import { useBookmarks } from "@/hooks/useBookmarks";
import { copyText } from "@/lib/clipboard";
import { notifyError, notifySuccess } from "@/lib/notifications";

export function DebugView({
  entity: rule,
}: {
  entity: AutofillRule;
}) {
  const {
    t,
  } = useTranslation();
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | undefined>();
  const {
    data: allBookmarks = [],
  } = useBookmarks();

  const bookmarkOptions = useMemo(
    () => allBookmarks.map(b => ({
      value: b.id,
      label: b.title,
      names: b.names,
    })),
    [allBookmarks],
  );

  const selectedBookmark = selectedBookmarkId
    ? allBookmarks.find(b => b.id === selectedBookmarkId)
    : undefined;

  async function copyPrompt() {
    const text = [
      "Does the following bookmark match the autofill rule's conditions?",
      "",
      "Rule:",
      "```json",
      JSON.stringify(rule, null, 2),
      "```",
      "",
      "Bookmark:",
      "```json",
      JSON.stringify(selectedBookmark, null, 2),
      "```",
    ].join("\n");
    try {
      await copyText(text);
      notifySuccess(t("Copied to clipboard"));
    }
    catch {
      notifyError(t("Couldn't copy to clipboard"));
    }
  }

  return (
    <div className="space-y-4">
      <CopyJsonButton
        data={rule}
        label="Copy Rule JSON"
      />
      <div className="space-y-2">
        <Combobox
          options={bookmarkOptions}
          value={selectedBookmarkId}
          onValueChange={v => setSelectedBookmarkId(v ?? undefined)}
          placeholder={t("Search bookmarks to include in a debug prompt…")}
          searchPlaceholder="Search bookmarks…"
          emptyText="No bookmarks found."
        />
        {selectedBookmark && (
          <div className="flex gap-2">
            <CopyJsonButton
              data={selectedBookmark}
              label="Copy Bookmark JSON"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => void copyPrompt()}
            >
              <Copy className="size-4" />
              Copy Prompt
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
