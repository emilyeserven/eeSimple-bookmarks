import type { SectionEntry, SectionEntryType } from "@eesimple/types";

import { Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SectionsAiImportReview } from "./SectionsAiImportReview";
import { TreeCombobox } from "./TreeCombobox";
import { useSectionsAiImport } from "./useSectionsAiImport";
import { tagNodesToOptions } from "../lib/tagTree";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * The Sections editor's "AI import" tool (owns its trigger button, like `ClearAllSectionsButton`):
 * pick an optional parent tag whose subtree is embedded in a generated prompt, copy the prompt into
 * an AI alongside photos of a book's table of contents, paste the AI's JSON back, review the parsed
 * sections + suggested tags (reject / rename new tags), and import — replacing the editor's current
 * list, to be persisted by the surrounding form's own save (the Kavita-import pattern).
 */
export function SectionsAiImportDialog({
  bookmarkTitle, allowedTypes, onApply,
}: {
  bookmarkTitle: string | null;
  allowedTypes: SectionEntryType[];
  onApply: (value: { exhaustive: boolean;
    sections: SectionEntry[]; }) => void;
}) {
  const {
    t,
  } = useTranslation();
  const ai = useSectionsAiImport({
    bookmarkTitle,
    allowedTypes,
    onApply,
  });
  const sectionCount = ai.parseState.kind === "ok" ? ai.parseState.payload.sections.length : 0;
  return (
    <Dialog
      open={ai.open}
      onOpenChange={ai.handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          title={t("Import sections from an AI-transcribed table of contents (replaces the current list)")}
        >
          <Sparkles className="size-4" />
          {t("AI import")}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="
          max-h-[85vh] overflow-y-auto
          sm:max-w-2xl
        "
      >
        <DialogHeader>
          <DialogTitle>{t("Import sections with AI")}</DialogTitle>
          <DialogDescription>
            {t("Copy the prompt into your AI along with photos of the table of contents, then paste its JSON response back here.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ai-import-parent-tag">{t("Parent tag for suggestions (optional)")}</Label>
            <TreeCombobox
              id="ai-import-parent-tag"
              options={tagNodesToOptions(ai.tree ?? [])}
              value={ai.parentTagId}
              placeholder={t("Select a parent tag…")}
              leadingOption={{
                value: "",
                label: t("(no tag suggestions)"),
              }}
              onValueChange={value => ai.setParentTagId(value || undefined)}
            />
            <p className="text-xs text-muted-foreground">
              {t("Its tag tree is embedded in the prompt so the AI reuses your existing tags.")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-import-prompt">{t("Prompt")}</Label>
            <Textarea
              id="ai-import-prompt"
              value={ai.prompt}
              readOnly
              rows={8}
              className="resize-none bg-muted/50 font-mono text-xs"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={ai.handleCopy}
              >
                {ai.copied ? t("Copied!") : t("Copy Prompt")}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-import-paste">{t("AI response")}</Label>
            <Textarea
              id="ai-import-paste"
              value={ai.pasteText}
              onChange={event => ai.setPasteText(event.target.value)}
              placeholder={"{ \"sections\": [ { \"name\": \"…\", \"startPage\": 1 } ] }"}
              rows={6}
              className="font-mono text-xs"
            />
            {ai.parseState.kind === "error"
              ? <p className="text-sm text-destructive">{t("Could not parse JSON. Paste the AI's JSON response.")}</p>
              : null}
            {ai.parseState.kind === "invalid"
              ? <p className="text-sm text-destructive">{t("JSON must be a { sections, newTags } object where every section has a name.")}</p>
              : null}
          </div>
          {ai.parseState.kind === "ok"
            ? (
              <SectionsAiImportReview
                payload={ai.parseState.payload}
                tagReview={ai.tagReview}
                rejected={ai.rejected}
                onToggleReject={ai.toggleReject}
                renames={ai.renames}
                onRename={ai.renameTag}
                fallbackParentName={ai.parentName}
              />
            )
            : null}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
            >
              {t("Cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={sectionCount === 0 || ai.isApplying}
            onClick={() => void ai.handleApply()}
          >
            {ai.isApplying
              ? <Loader2 className="size-4 animate-spin" />
              : null}
            {t("Import {{count}} sections", {
              count: sectionCount,
            })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
