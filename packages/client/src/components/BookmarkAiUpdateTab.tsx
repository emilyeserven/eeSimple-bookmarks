import type { AiUpdatableField, AiUpdatableFieldKey } from "../lib/bookmarkAiUpdate";
import type { Bookmark } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { BookmarkAiUpdateReviewList } from "./BookmarkAiUpdateReview";
import { useBookmarkAiUpdate } from "../hooks/useBookmarkAiUpdate";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslatedLabel } from "@/hooks/useTranslatedLabel";

/** One checkbox row of the field picker; derived properties render disabled with their reason. */
function FieldCheckboxRow({
  field, checked, onToggle,
}: {
  field: AiUpdatableField;
  checked: boolean;
  onToggle: (key: AiUpdatableFieldKey) => void;
}) {
  const {
    t,
  } = useTranslation();
  const tLabel = useTranslatedLabel();
  const checkboxId = `ai-field-${field.key}`;
  const disabledReason = field.disabledReason === "calculated"
    ? t("Calculated from other properties")
    : field.disabledReason === "sectionsDriven"
      ? t("Derived from a sections property")
      : null;
  return (
    <div className="flex items-center gap-1.5">
      <Checkbox
        id={checkboxId}
        checked={checked}
        disabled={disabledReason !== null}
        onCheckedChange={() => onToggle(field.key)}
      />
      <Label
        htmlFor={checkboxId}
        className={`
          text-sm font-normal
          ${disabledReason
      ? "text-muted-foreground"
      : ""}
        `}
      >
        {tLabel(field.label)}
        {disabledReason && (
          <span className="text-xs text-muted-foreground">
            {" "}
            (
            {disabledReason}
            )
          </span>
        )}
      </Label>
    </div>
  );
}

/** The slice of a controller the field picker needs — satisfied by the single AND bulk controllers. */
export interface AiUpdateFieldPickerControls {
  fields: AiUpdatableField[];
  checkedFields: ReadonlySet<AiUpdatableFieldKey>;
  toggleField: (key: AiUpdatableFieldKey) => void;
  setAllFields: (checked: boolean) => void;
}

/**
 * The three checkbox groups (Standard / Relations / Custom properties) + select all/none. Shared by
 * the bookmark edit AI tab and the AI Bulk Edit page.
 */
export function BookmarkAiUpdateFieldPicker({
  controller,
}: {
  controller: AiUpdateFieldPickerControls;
}) {
  const {
    t,
  } = useTranslation();
  const groups: {
    title: string;
    group: AiUpdatableField["group"];
  }[] = [{
    title: t("Standard fields"),
    group: "standard",
  }, {
    title: t("Relations"),
    group: "relations",
  }, {
    title: t("Custom properties"),
    group: "properties",
  }];
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => controller.setAllFields(true)}
        >
          {t("Select all")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => controller.setAllFields(false)}
        >
          {t("Select none")}
        </Button>
      </div>
      <div
        className="
          grid gap-4
          sm:grid-cols-3
        "
      >
        {groups.map(({
          title, group,
        }) => {
          const fields = controller.fields.filter(field => field.group === group);
          if (fields.length === 0) return null;
          return (
            <div
              key={group}
              className="space-y-1.5"
            >
              <p className="text-sm font-medium">{title}</p>
              {fields.map(field => (
                <FieldCheckboxRow
                  key={field.key}
                  field={field}
                  checked={controller.checkedFields.has(field.key)}
                  onToggle={controller.toggleField}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The bookmark edit "AI" tab: check the fields to update, copy the generated prompt into an external
 * AI, paste its JSON reply back, review the proposed per-field changes (unmatched taxonomy names
 * offer to be created), and apply. Mirrors {@link TagReparentTab}; all state lives in
 * `useBookmarkAiUpdate`.
 */
export function BookmarkAiUpdateTab({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  const {
    t,
  } = useTranslation();
  const controller = useBookmarkAiUpdate(bookmark);
  const hasChecked = controller.checkedFields.size > 0;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Fields to Update")}</CardTitle>
          <CardDescription>
            {t("Choose which fields the AI should provide values for. Everything else is left untouched.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookmarkAiUpdateFieldPicker controller={controller} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("AI Update Prompt")}</CardTitle>
          <CardDescription>
            {t("Ready to paste into your AI. It asks for JSON you can paste back below, then review and apply.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasChecked
            ? (
              <>
                <Textarea
                  value={controller.generatedPrompt}
                  readOnly
                  rows={14}
                  className="resize-none bg-muted/50 font-mono text-xs"
                />
                <div className="flex justify-end">
                  <Button onClick={controller.handleCopy}>
                    {controller.copied ? t("Copied!") : t("Copy Prompt")}
                  </Button>
                </div>
              </>
            )
            : <p className="text-sm text-muted-foreground">{t("Check at least one field above to generate the prompt.")}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Review & Apply")}</CardTitle>
          <CardDescription>
            {t("Paste the AI's JSON response here. Review the proposed changes, uncheck any you don't want, then apply.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={controller.applyText}
            onChange={e => controller.setApplyText(e.target.value)}
            placeholder={"{ \"title\": \"…\", \"properties\": { \"…\": … } }"}
            rows={8}
            className="font-mono text-xs"
          />
          {controller.parseState.kind === "error" && (
            <p className="text-sm text-destructive">{t("Could not parse JSON. Paste the AI's JSON response.")}</p>
          )}
          {controller.parseState.kind === "invalid" && (
            <p className="text-sm text-destructive">{t("The reply must be a JSON object of field values.")}</p>
          )}
          {controller.parseState.kind === "ok" && (
            <BookmarkAiUpdateReviewList
              rows={controller.reviewRows}
              excluded={controller.excluded}
              onToggle={controller.toggleRow}
              ignoredKeys={controller.parseState.ignoredKeys}
            />
          )}
          <div className="flex justify-end">
            <Button
              onClick={controller.handleApply}
              disabled={controller.isApplying || controller.parseState.kind !== "ok"}
            >
              {controller.isApplying ? t("Applying…") : t("Apply Changes")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Prompt Template")}</CardTitle>
          <CardDescription>
            {t("The reusable instructions included at the top of the generated prompt above. Saved automatically as you type.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={controller.templatePrompt}
            onChange={e => controller.setTemplatePrompt(e.target.value)}
            placeholder={t("Leave empty to use the built-in instructions.")}
            rows={6}
          />
        </CardContent>
      </Card>
    </div>
  );
}
