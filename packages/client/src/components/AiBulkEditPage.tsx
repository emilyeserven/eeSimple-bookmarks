import { useTranslation } from "react-i18next";

import { AiBulkEditTargets } from "./AiBulkEditTargets";
import { BookmarkAiUpdateReviewList } from "./BookmarkAiUpdateReview";
import { BookmarkAiUpdateFieldPicker } from "./BookmarkAiUpdateTab";
import { useAiBulkEdit } from "../hooks/useAiBulkEdit";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

/**
 * The AI Bulk Edit action page: pick target bookmarks (individually and/or whole taxonomy groups),
 * check the fields to update, copy one multi-bookmark prompt into an external AI, paste its JSON
 * reply back, review the proposed changes per bookmark, and apply. The bulk sibling of the bookmark
 * edit "AI" tab; all state lives in `useAiBulkEdit`.
 */
export function AiBulkEditPage() {
  const {
    t,
  } = useTranslation();
  const controller = useAiBulkEdit();
  const hasTargets = controller.targets.length > 0;
  const hasChecked = controller.checkedFields.size > 0;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Target Bookmarks")}</CardTitle>
          <CardDescription>
            {t("Pick individual bookmarks and/or whole taxonomy groups — every matching bookmark is included.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AiBulkEditTargets controller={controller} />
        </CardContent>
      </Card>

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
          <CardTitle>{t("AI Bulk Edit Prompt")}</CardTitle>
          <CardDescription>
            {t("Ready to paste into your AI. It asks for JSON you can paste back below, then review and apply.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasTargets && hasChecked
            ? (
              <>
                <Textarea
                  value={controller.generatedPrompt}
                  readOnly
                  rows={16}
                  className="resize-none bg-muted/50 font-mono text-xs"
                />
                <div className="flex justify-end">
                  <Button onClick={controller.handleCopy}>
                    {controller.copied ? t("Copied!") : t("Copy Prompt")}
                  </Button>
                </div>
              </>
            )
            : (
              <p className="text-sm text-muted-foreground">
                {t("Select at least one bookmark and one field above to generate the prompt.")}
              </p>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Review & Apply")}</CardTitle>
          <CardDescription>
            {t("Paste the AI's JSON response here. Review the proposed changes per bookmark, uncheck any you don't want, then apply.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={controller.applyText}
            onChange={e => controller.setApplyText(e.target.value)}
            placeholder={"{ \"bookmarks\": [{ \"id\": \"…\", \"title\": \"…\" }] }"}
            rows={8}
            className="font-mono text-xs"
          />
          {controller.parseState.kind === "error" && (
            <p className="text-sm text-destructive">{t("Could not parse JSON. Paste the AI's JSON response.")}</p>
          )}
          {controller.parseState.kind === "invalid" && (
            <p className="text-sm text-destructive">{t("The reply must be a JSON object with a bookmarks array.")}</p>
          )}
          {controller.parseState.kind === "ok" && (
            <div className="space-y-4">
              {controller.reviewSections.length === 0 && controller.unknownIds.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("No proposed changes found in the reply.")}</p>
              )}
              {controller.reviewSections.map(section => (
                <div
                  key={section.bookmark.id}
                  className="space-y-1.5"
                >
                  <p className="text-sm font-semibold">{section.bookmark.title}</p>
                  <BookmarkAiUpdateReviewList
                    rows={section.rows}
                    excluded={controller.excluded}
                    onToggle={controller.toggleRow}
                    ignoredKeys={section.ignoredKeys}
                  />
                </div>
              ))}
              {controller.unknownIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("Ignored bookmark ids:")}
                  {" "}
                  {controller.unknownIds.join(", ")}
                </p>
              )}
            </div>
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
