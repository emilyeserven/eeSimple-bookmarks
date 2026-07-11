import type { ParseTag, SectionEntry, SectionEntryType } from "@eesimple/types";

import { useMemo, useState } from "react";

import { PARSE_TAGS } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { ClipboardPaste } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  LoadParseTemplateDropdown,
  SaveParseTemplatePopover,
} from "./SectionParseTemplateControls";
import { parseWithTemplate } from "../lib/sectionParseTemplate";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const FALLBACK_TAG_LABELS: Record<ParseTag, string> = {
  name: "Name",
  person: "Person",
  page: "Page",
  timestamp: "Timestamp",
  url: "URL",
  ignore: "Ignore",
};

interface SectionPasteParserProps {
  allowedTypes: SectionEntryType[];
  defaultType: SectionEntryType;
  /** Append the parsed section rows to the editor's list. */
  onAppendSections: (sections: SectionEntry[]) => void;
  /** Match-or-create the parsed author names into the bookmark's People (create + edit surfaces). */
  onAddPeople?: (names: string[]) => void;
}

/**
 * The "Paste to parse" control for the Sections editor: paste a block of text, describe how it's
 * shaped with a delineator + `{{tag}}` pattern (loadable/savable as a reusable Parse Template), and
 * append the parsed rows — routing any `{{person}}` captures to the bookmark's People.
 */
export function SectionPasteParser({
  allowedTypes, defaultType, onAppendSections, onAddPeople,
}: SectionPasteParserProps) {
  const {
    t,
  } = useTranslation();
  const [open, setOpen] = useState(false);
  const [delineator, setDelineator] = useState(" / ");
  const [pattern, setPattern] = useState("{{person}} - {{name}}");
  const [fallbackTag, setFallbackTag] = useState<ParseTag>("name");
  const [text, setText] = useState("");

  const preview = useMemo(() => {
    if (!text.trim() || !pattern.trim()) return null;
    return parseWithTemplate(
      text,
      {
        id: "draft",
        name: "",
        description: null,
        delineator,
        pattern,
        fallbackTag,
        createdAt: "",
      },
      {
        allowedTypes,
        defaultType,
      },
    );
  }, [text, delineator, pattern, fallbackTag, allowedTypes, defaultType]);

  function handleParse() {
    if (!preview) return;
    onAppendSections(preview.sections);
    if (preview.personNames.length > 0) onAddPeople?.(preview.personNames);
    setText("");
  }

  if (!open) {
    return (
      <button
        type="button"
        className="
          flex items-center gap-1 text-sm text-primary
          hover:underline
        "
        onClick={() => setOpen(true)}
      >
        <ClipboardPaste className="size-3.5" />
        {t("Paste to parse")}
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{t("Delineator")}</Label>
          <Input
            value={delineator}
            onChange={e => setDelineator(e.target.value)}
            placeholder={t("e.g. \" / \"")}
            className="h-7 w-28 text-xs"
          />
        </div>
        <div className="min-w-40 flex-1 space-y-1">
          <Label className="text-xs">{t("Pattern")}</Label>
          <Input
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder="{{person}} - {{name}}"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("Unmatched items")}</Label>
          <Select
            value={fallbackTag}
            onValueChange={value => setFallbackTag(value as ParseTag)}
          >
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARSE_TAGS.map(tag => (
                <SelectItem
                  key={tag}
                  value={tag}
                >
                  {t(FALLBACK_TAG_LABELS[tag])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("Tags: {{tags}}. Text between tags marks how each item is split; unmatched items put their whole text into the field chosen above.", {
          tags: PARSE_TAGS.map(tag => `{{${tag}}}`).join(", "),
        })}
      </p>
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={t("Paste your list here…")}
        rows={4}
        className="text-xs"
      />
      {preview && (
        <p className="text-xs text-muted-foreground">
          {t("Will add {{count}} section(s)", {
            count: preview.sections.length,
          })}
          {preview.personNames.length > 0
            && ` · ${t("{{count}} author(s)", {
              count: preview.personNames.length,
            })}`}
          {preview.fallbackCount > 0
            && ` · ${t("{{count}} unmatched", {
              count: preview.fallbackCount,
            })}`}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!preview || preview.sections.length === 0}
          onClick={handleParse}
        >
          {t("Parse")}
        </Button>
        <LoadParseTemplateDropdown
          onLoad={(tpl) => {
            setDelineator(tpl.delineator);
            setPattern(tpl.pattern);
            setFallbackTag(tpl.fallbackTag);
          }}
        />
        <SaveParseTemplatePopover
          delineator={delineator}
          pattern={pattern}
          fallbackTag={fallbackTag}
        />
        <Link
          to="/settings/parse-templates"
          className="
            text-xs text-primary
            hover:underline
          "
        >
          {t("Manage templates")}
        </Link>
        <button
          type="button"
          className="
            ml-auto text-xs text-muted-foreground
            hover:underline
          "
          onClick={() => setOpen(false)}
        >
          {t("Close")}
        </button>
      </div>
    </div>
  );
}
