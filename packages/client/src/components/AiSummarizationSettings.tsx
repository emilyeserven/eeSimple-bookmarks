import { useState } from "react";

import { useTranslation } from "react-i18next";

import { useAiSummaryQueue, useApplyAiSummaries, useMarkAiQueueSummarized } from "../hooks/useAiSummarization";
import { useAiSummarizationForm } from "../hooks/useAiSummarizationForm";
import { buildGeneratedPrompt, describeApplyResult, normalizeApplyItems } from "../lib/aiSummarization";
import { describeError } from "../lib/apiError";
import { notifyError, notifySuccess } from "../lib/notifications";

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

/**
 * AI Summarization settings: shows a ready-to-paste prompt (assembled from the stored template, the
 * current "AI Summary Queue" bookmarks, and a JSON output-format instruction), lets the user add extra
 * context and opt into tag suggestions, paste the AI's JSON response back to update descriptions + mark
 * bookmarks summarized, and bulk-mark the whole queue as "Summarized by AI".
 */
export function AiSummarizationSettings() {
  const {
    t,
  } = useTranslation();
  const {
    form, patchForm, isLoading,
  } = useAiSummarizationForm();
  const {
    data: queue = [], isLoading: isQueueLoading,
  } = useAiSummaryQueue();
  const markSummarized = useMarkAiQueueSummarized();
  const applySummaries = useApplyAiSummaries();

  const [extraContext, setExtraContext] = useState("");
  const [copied, setCopied] = useState(false);
  const [applyText, setApplyText] = useState("");

  function handleMarkSummarized(): void {
    markSummarized.mutate(undefined, {
      onSuccess: ({
        count,
      }) => {
        if (count === 0) {
          notifySuccess(t("No bookmarks in the AI Summary Queue"));
        }
        else {
          notifySuccess(`Marked ${count} bookmark${count === 1 ? "" : "s"} as Summarized by AI`);
        }
      },
      onError: error => notifyError(describeError(error)),
    });
  }

  function handleCopy(): void {
    const generated = buildGeneratedPrompt(form.aiSummarizationPrompt, queue, form.aiSummarizationSuggestTags);
    const full = extraContext.trim() ? `${generated}\n\nAdditional context: ${extraContext.trim()}` : generated;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => notifyError(t("Could not copy to clipboard")));
  }

  function handleApply(): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(applyText);
    }
    catch {
      notifyError(t("Could not parse JSON. Paste the AI's JSON response."));
      return;
    }
    const items = normalizeApplyItems(parsed);
    if (!items) {
      notifyError(t("JSON must be an array of { id, summary } objects."));
      return;
    }
    if (items.length === 0) {
      notifyError(t("No summaries found in the pasted JSON."));
      return;
    }
    applySummaries.mutate({
      items,
    }, {
      onSuccess: (result) => {
        notifySuccess(describeApplyResult(result));
        setApplyText("");
      },
      onError: error => notifyError(describeError(error)),
    });
  }

  if (isLoading || isQueueLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const generatedPrompt = buildGeneratedPrompt(form.aiSummarizationPrompt, queue, form.aiSummarizationSuggestTags);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>AI Summarization Prompt</CardTitle>
          <CardDescription>
            {queue.length > 0
              ? `Ready to paste into your AI — includes ${queue.length} queued bookmark${queue.length === 1 ? "" : "s"}. It asks the AI to reply with JSON you can paste back below. Add extra context, then copy.`
              : "No bookmarks are currently in the AI Summary Queue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={generatedPrompt}
            readOnly
            rows={12}
            className="resize-none bg-muted/50 font-mono text-xs"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="suggest-tags"
              checked={form.aiSummarizationSuggestTags}
              onCheckedChange={value => patchForm({
                aiSummarizationSuggestTags: value === true,
              })}
            />
            <Label htmlFor="suggest-tags">{t("Ask the AI to suggest tags")}</Label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="extra-context">Extra context (optional)</Label>
            <Textarea
              id="extra-context"
              value={extraContext}
              onChange={e => setExtraContext(e.target.value)}
              placeholder={t("Add any extra context or instructions for this session…")}
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleCopy}
              disabled={queue.length === 0}
            >
              {copied ? "Copied!" : "Copy Full Prompt"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apply Summaries</CardTitle>
          <CardDescription>
            Paste the AI&apos;s JSON response here. Each bookmark&apos;s description is replaced with its
            summary and the bookmark is marked &quot;Summarized by AI&quot;
            {form.aiSummarizationSuggestTags ? ", and any suggested tags are added." : "."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={applyText}
            onChange={e => setApplyText(e.target.value)}
            placeholder={`[{ "id": "…", "summary": "…"${form.aiSummarizationSuggestTags ? ", \"tags\": [\"…\"]" : ""} }]`}
            rows={8}
            className="font-mono text-xs"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleApply}
              disabled={applySummaries.isPending || applyText.trim().length === 0}
            >
              {applySummaries.isPending ? "Applying…" : "Apply Summaries"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt Template</CardTitle>
          <CardDescription>
            The reusable instructions included at the top of the generated prompt above. Saved automatically as you type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.aiSummarizationPrompt}
            onChange={e => patchForm({
              aiSummarizationPrompt: e.target.value,
            })}
            placeholder={t("Enter instructions for the AI to follow when summarizing your queued bookmarks…")}
            rows={6}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
          <CardDescription>
            Mark all bookmarks with the &quot;AI Summary Queue&quot; content status as &quot;Summarized by AI&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleMarkSummarized}
            disabled={markSummarized.isPending}
          >
            {markSummarized.isPending ? "Marking…" : "Mark as Summarized"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
