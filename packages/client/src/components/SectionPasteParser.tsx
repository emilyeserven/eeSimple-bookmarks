import type { ClassifiedPersonName } from "../lib/peopleMatchOrCreate";
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
import { usePeople } from "../hooks/usePeople";
import { classifyPeopleNames } from "../lib/peopleMatchOrCreate";
import { parseWithTemplate } from "../lib/sectionParseTemplate";

import { Badge } from "@/components/ui/badge";
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
  const {
    data: people,
  } = usePeople();

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

  const classifiedPeople = useMemo(
    () => (preview ? classifyPeopleNames(preview.personNames, people ?? []) : []),
    [preview, people],
  );

  function handleParse() {
    if (!preview) return;
    onAppendSections(preview.sections);
    if (preview.personNames.length > 0) onAddPeople?.(preview.personNames);
    setText("");
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        title={t("Paste a list (chapters, a table of contents, tracks…) and split it into section rows")}
        onClick={() => setOpen(true)}
      >
        <ClipboardPaste className="size-4" />
        {t("Paste to parse")}
      </Button>
    );
  }

  return (
    <div className="w-full space-y-3 rounded-md border bg-muted/30 p-3">
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
        <SectionParsePreview
          sections={preview.sections}
          classifiedPeople={classifiedPeople}
          fallbackCount={preview.fallbackCount}
          showPeople={onAddPeople !== undefined}
        />
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

const SECTION_TYPE_LABELS: Record<SectionEntryType, string> = {
  url: "URL",
  page: "Page",
  timestamp: "Timestamp",
};

/** The muted value shown beside a previewed section name (its URL, or its page/timestamp value). */
function sectionDetailValue(section: SectionEntry): string {
  return section.type === "url" ? (section.url ?? "") : section.startValue;
}

interface SectionParsePreviewProps {
  sections: SectionEntry[];
  classifiedPeople: ClassifiedPersonName[];
  fallbackCount: number;
  /** Whether captured authors will actually be routed to People (i.e. `onAddPeople` is wired). */
  showPeople: boolean;
}

/**
 * The verbose preview under the paste textarea: a count summary, the full (scrollable) list of the
 * section rows that will be added — each with its name and a muted type/value detail — and, when
 * authors will be routed to People, each captured name badged New (created) vs Reused (existing).
 */
function SectionParsePreview({
  sections, classifiedPeople, fallbackCount, showPeople,
}: SectionParsePreviewProps) {
  const {
    t,
  } = useTranslation();
  const showAuthors = showPeople && classifiedPeople.length > 0;
  return (
    <div className="space-y-2 rounded-md border bg-background/50 p-2">
      <p className="text-xs text-muted-foreground">
        {t("Will add {{count}} section(s)", {
          count: sections.length,
        })}
        {classifiedPeople.length > 0
          && ` · ${t("{{count}} author(s)", {
            count: classifiedPeople.length,
          })}`}
        {fallbackCount > 0
          && ` · ${t("{{count}} unmatched", {
            count: fallbackCount,
          })}`}
      </p>
      {sections.length > 0 && (
        <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
          {sections.map((section) => {
            const detail = sectionDetailValue(section);
            return (
              <li
                key={section.id}
                className="flex items-baseline justify-between gap-2"
              >
                <span className="min-w-0 flex-1 truncate">
                  {section.name || (
                    <span className="text-muted-foreground italic">{t("(no name)")}</span>
                  )}
                </span>
                {detail && (
                  <span
                    className="
                      max-w-[45%] shrink-0 truncate text-right
                      text-muted-foreground
                    "
                  >
                    {t(SECTION_TYPE_LABELS[section.type])}
                    {" "}
                    {detail}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {showAuthors && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{t("Authors")}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {classifiedPeople.map(person => (
              <span
                key={person.name}
                className="inline-flex items-center gap-1"
              >
                <span>{person.name}</span>
                <Badge variant={person.existing ? "secondary" : "default"}>
                  {person.existing ? t("Reused") : t("New")}
                </Badge>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
