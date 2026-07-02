import type { AiSummarizationSettings as AiSummarizationForm } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { useAiSummaryQueue, useMarkAiQueueSummarized } from "../hooks/useAiSummarization";
import { useAiSummarizationSettings, useUpdateAiSummarizationSettings, AI_SUMMARIZATION_DEFAULTS } from "../hooks/useAppSettings";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Debounce window (ms) before a prompt edit auto-saves. */
const AUTOSAVE_DELAY_MS = 800;

function buildGeneratedPrompt(template: string, items: { url: string | null;
  title: string; }[]): string {
  const linkLines = items
    .map(item => `- ${item.title}${item.url ? `: ${item.url}` : ""}`)
    .join("\n");
  const linksSection = items.length > 0
    ? `Links to summarize:\n${linkLines}`
    : "Links to summarize:\n(No bookmarks currently in the AI Summary Queue)";
  return template ? `${template}\n\n${linksSection}` : linksSection;
}

/**
 * AI Summarization settings: shows a ready-to-paste prompt assembled from the stored template and
 * the current "AI Summary Queue" bookmarks, lets the user add extra context, and provides a
 * bulk action to mark queued bookmarks as "Summarized by AI".
 */
export function AiSummarizationSettings() {
  const {
    data, isLoading,
  } = useAiSummarizationSettings();
  const {
    data: queue = [], isLoading: isQueueLoading,
  } = useAiSummaryQueue();
  const update = useUpdateAiSummarizationSettings();
  const markSummarized = useMarkAiQueueSummarized();

  const [form, setFormState] = useState<AiSummarizationForm>(AI_SUMMARIZATION_DEFAULTS);
  const formRef = useRef<AiSummarizationForm>(form);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSeededRef = useRef(false);
  const [extraContext, setExtraContext] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data) {
      isSeededRef.current = true;
      formRef.current = data;
      setFormState(data);
    }
  }, [data]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  function scheduleAutoSave(): void {
    if (!isSeededRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      update.mutate(formRef.current);
    }, AUTOSAVE_DELAY_MS);
  }

  function setPrompt(value: string): void {
    const next = {
      ...formRef.current,
      aiSummarizationPrompt: value,
    };
    formRef.current = next;
    setFormState(next);
    scheduleAutoSave();
  }

  function handleMarkSummarized(): void {
    markSummarized.mutate(undefined, {
      onSuccess: ({
        count,
      }) => {
        if (count === 0) {
          notifySuccess("No bookmarks in the AI Summary Queue");
        }
        else {
          notifySuccess(`Marked ${count} bookmark${count === 1 ? "" : "s"} as Summarized by AI`);
        }
      },
      onError: error => notifyError(describeError(error)),
    });
  }

  function handleCopy(): void {
    const generated = buildGeneratedPrompt(form.aiSummarizationPrompt, queue);
    const full = extraContext.trim() ? `${generated}\n\nAdditional context: ${extraContext.trim()}` : generated;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => notifyError("Could not copy to clipboard"));
  }

  if (isLoading || isQueueLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const generatedPrompt = buildGeneratedPrompt(form.aiSummarizationPrompt, queue);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>AI Summarization Prompt</CardTitle>
          <CardDescription>
            {queue.length > 0
              ? `Ready to paste into your AI — includes ${queue.length} queued bookmark${queue.length === 1 ? "" : "s"}. Add extra context below, then copy.`
              : "No bookmarks are currently in the AI Summary Queue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={generatedPrompt}
            readOnly
            rows={10}
            className="resize-none bg-muted/50 font-mono text-xs"
          />
          <div className="space-y-1.5">
            <Label htmlFor="extra-context">Extra context (optional)</Label>
            <Textarea
              id="extra-context"
              value={extraContext}
              onChange={e => setExtraContext(e.target.value)}
              placeholder="Add any extra context or instructions for this session…"
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
          <CardTitle>Prompt Template</CardTitle>
          <CardDescription>
            The reusable instructions included at the top of the generated prompt above. Saved automatically as you type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.aiSummarizationPrompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Enter instructions for the AI to follow when summarizing your queued bookmarks…"
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
