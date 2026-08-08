import { useTranslation } from "react-i18next";

import { AiBookmarkTargets } from "./AiBookmarkTargets";
import { BookmarkAiUpdateFieldPicker } from "./BookmarkAiUpdateTab";
import { useAiPromptBuilder } from "../hooks/useAiPromptBuilder";

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
 * The AI Prompt Builder action page: pick the bookmarks to ask about (individually, by whole taxonomy
 * group, or via a saved filter), write a free-form question, choose how much of each bookmark rides
 * along as context, then copy one ready-to-paste prompt into an external AI. The read-only sibling of
 * AI Bulk Edit — nothing is parsed back and no bookmark is ever written. State lives in
 * `useAiPromptBuilder`.
 */
export function AiPromptBuilderPage() {
  const {
    t,
  } = useTranslation();
  const controller = useAiPromptBuilder();
  const hasTargets = controller.targets.length > 0;
  const hasQuestion = controller.question.trim().length > 0;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Bookmarks to Ask About")}</CardTitle>
          <CardDescription>
            {t("Pick individual bookmarks, whole taxonomy groups, and/or saved filters — every matching bookmark is included.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AiBookmarkTargets controller={controller} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Your Question")}</CardTitle>
          <CardDescription>
            {t("What do you want the AI to tell you about these bookmarks?")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={controller.question}
            onChange={e => controller.setQuestion(e.target.value)}
            placeholder={t("e.g. Which of these should I read first, and why?")}
            rows={4}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Context to Include")}</CardTitle>
          <CardDescription>
            {t("Each bookmark's title, URL and description are always included. Add any other fields the AI needs to answer — every extra field makes the prompt longer.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookmarkAiUpdateFieldPicker controller={controller} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Generated Prompt")}</CardTitle>
          <CardDescription>
            {t("Ready to paste into your AI. Read its answer there — nothing is sent from this app and nothing is written back.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasTargets && hasQuestion
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
                {t("Select at least one bookmark above and write a question to generate the prompt.")}
              </p>
            )}
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
