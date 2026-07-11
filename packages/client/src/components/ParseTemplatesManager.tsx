import type { ParseTag, ParseTemplate } from "@eesimple/types";

import { useState } from "react";

import { PARSE_TAGS } from "@eesimple/types";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  useCreateParseTemplate,
  useDeleteParseTemplate,
  useParseTemplates,
  useUpdateParseTemplate,
} from "../hooks/useParseTemplates";
import { parseWithTemplate } from "../lib/sectionParseTemplate";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
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

/** Human-readable description of where each tag's capture goes, shown in the legend. */
const TAG_LEGEND: readonly { tag: ParseTag;
  desc: string; }[] = [
  {
    tag: "name",
    desc: "the section name",
  },
  {
    tag: "person",
    desc: "added to the bookmark's People",
  },
  {
    tag: "page",
    desc: "the section's page value",
  },
  {
    tag: "timestamp",
    desc: "the section's timestamp value",
  },
  {
    tag: "url",
    desc: "the section's link",
  },
  {
    tag: "ignore",
    desc: "captured then discarded",
  },
];

interface TemplateDraft {
  name: string;
  description: string;
  delineator: string;
  pattern: string;
  fallbackTag: ParseTag;
}

const BLANK_DRAFT: TemplateDraft = {
  name: "",
  description: "",
  delineator: " / ",
  pattern: "{{person}} - {{name}}",
  fallbackTag: "name",
};

/** The shared name/delineator/pattern/fallback/description input grid for create + edit. */
function TemplateFields({
  draft, onChange,
}: {
  draft: TemplateDraft;
  onChange: (patch: Partial<TemplateDraft>) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div
      className="
        grid gap-3
        sm:grid-cols-2
      "
    >
      <div className="space-y-1">
        <Label className="text-xs">{t("Name")}</Label>
        <Input
          value={draft.name}
          onChange={e => onChange({
            name: e.target.value,
          })}
          placeholder={t("e.g. Author - Title list")}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("Description")}</Label>
        <Input
          value={draft.description}
          onChange={e => onChange({
            description: e.target.value,
          })}
          placeholder={t("Optional")}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("Delineator")}</Label>
        <Input
          value={draft.delineator}
          onChange={e => onChange({
            delineator: e.target.value,
          })}
          placeholder={t("e.g. \" / \"")}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("Pattern")}</Label>
        <Input
          value={draft.pattern}
          onChange={e => onChange({
            pattern: e.target.value,
          })}
          placeholder="{{person}} - {{name}}"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("Unmatched items")}</Label>
        <Select
          value={draft.fallbackTag}
          onValueChange={value => onChange({
            fallbackTag: value as ParseTag,
          })}
        >
          <SelectTrigger>
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
  );
}

/** A textarea to test a draft against sample text, showing the parsed counts. */
function TemplatePreview({
  draft,
}: {
  draft: TemplateDraft;
}) {
  const {
    t,
  } = useTranslation();
  const [sample, setSample] = useState("");
  const preview = sample.trim() && draft.pattern.trim()
    ? parseWithTemplate(
      sample,
      {
        id: "draft",
        name: "",
        description: null,
        delineator: draft.delineator,
        pattern: draft.pattern,
        fallbackTag: draft.fallbackTag,
        createdAt: "",
      },
      {
        allowedTypes: ["url", "page", "timestamp"],
        defaultType: "url",
      },
    )
    : null;
  return (
    <div className="space-y-1">
      <Label className="text-xs">{t("Test with sample text")}</Label>
      <Textarea
        value={sample}
        onChange={e => setSample(e.target.value)}
        placeholder={t("Paste sample text to preview…")}
        rows={2}
        className="text-xs"
      />
      {preview && (
        <p className="text-xs text-muted-foreground">
          {t("{{sections}} section(s), {{people}} author(s), {{unmatched}} unmatched", {
            sections: preview.sections.length,
            people: preview.personNames.length,
            unmatched: preview.fallbackCount,
          })}
        </p>
      )}
    </div>
  );
}

/** The "add a template" card. */
function NewTemplateForm() {
  const {
    t,
  } = useTranslation();
  const [draft, setDraft] = useState<TemplateDraft>(BLANK_DRAFT);
  const {
    mutate, isPending,
  } = useCreateParseTemplate();

  function handleCreate() {
    if (!draft.name.trim() || !draft.pattern.trim()) return;
    mutate({
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      delineator: draft.delineator,
      pattern: draft.pattern,
      fallbackTag: draft.fallbackTag,
    }, {
      onSuccess: () => setDraft(BLANK_DRAFT),
    });
  }

  return (
    <RowCard className="space-y-3 p-4">
      <p className="text-sm font-medium">{t("New parse template")}</p>
      <TemplateFields
        draft={draft}
        onChange={patch => setDraft(current => ({
          ...current,
          ...patch,
        }))}
      />
      <TemplatePreview draft={draft} />
      <Button
        type="button"
        size="sm"
        disabled={!draft.name.trim() || !draft.pattern.trim() || isPending}
        onClick={handleCreate}
      >
        {isPending ? t("Saving...") : t("Add template")}
      </Button>
    </RowCard>
  );
}

/** An existing template's editable card. */
function TemplateCard({
  template,
}: {
  template: ParseTemplate;
}) {
  const {
    t,
  } = useTranslation();
  const [draft, setDraft] = useState<TemplateDraft>({
    name: template.name,
    description: template.description ?? "",
    delineator: template.delineator,
    pattern: template.pattern,
    fallbackTag: template.fallbackTag,
  });
  const update = useUpdateParseTemplate();
  const remove = useDeleteParseTemplate();

  function handleSave() {
    if (!draft.name.trim() || !draft.pattern.trim()) return;
    update.mutate({
      id: template.id,
      input: {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        delineator: draft.delineator,
        pattern: draft.pattern,
        fallbackTag: draft.fallbackTag,
      },
    });
  }

  return (
    <RowCard className="space-y-3 p-4">
      <TemplateFields
        draft={draft}
        onChange={patch => setDraft(current => ({
          ...current,
          ...patch,
        }))}
      />
      <TemplatePreview draft={draft} />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!draft.name.trim() || !draft.pattern.trim() || update.isPending}
          onClick={handleSave}
        >
          {t("Save changes")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="
            text-muted-foreground
            hover:text-destructive
          "
          disabled={remove.isPending}
          onClick={() => remove.mutate(template.id)}
        >
          <Trash2 className="size-4" />
          {t("Delete")}
        </Button>
      </div>
    </RowCard>
  );
}

/** Settings → Parse Templates: manage reusable parse rules for the Sections editor's paste feature. */
export function ParseTemplatesManager() {
  const {
    t,
  } = useTranslation();
  const {
    data: templates, isLoading,
  } = useParseTemplates();

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Parse Templates")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Reusable rules for the Sections editor's \"Paste to parse\" feature: a delineator splits the pasted text into items, and a pattern of tags marks what each part is.")}
        </p>
      </div>
      <div
        className="
          space-y-1 rounded-md border bg-muted/30 p-3 text-xs
          text-muted-foreground
        "
      >
        <p className="font-medium text-foreground">{t("Available tags")}</p>
        <ul className="space-y-0.5">
          {TAG_LEGEND.map(({
            tag, desc,
          }) => (
            <li key={tag}>
              <code className="text-foreground">{`{{${tag}}}`}</code>
              {" — "}
              {t(desc)}
            </li>
          ))}
        </ul>
      </div>

      <NewTemplateForm />

      {isLoading
        ? <p className="text-sm text-muted-foreground">{t("Loading...")}</p>
        : !templates?.length
          ? <p className="text-sm text-muted-foreground">{t("No templates saved yet.")}</p>
          : (
            <div className="space-y-3">
              {templates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                />
              ))}
            </div>
          )}
    </section>
  );
}
