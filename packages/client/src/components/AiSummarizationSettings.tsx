import type { AiSummarizationSettings as AiSummarizationForm } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { useMarkAiQueueSummarized } from "../hooks/useAiSummarization";
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
import { Textarea } from "@/components/ui/textarea";

/** Debounce window (ms) before a prompt edit auto-saves. */
const AUTOSAVE_DELAY_MS = 800;

/**
 * AI Summarization settings: a stored prompt that an AI can use to summarize bookmarks in the
 * "AI Summary Queue" content status, and a bulk action to mark them as "Summarized by AI".
 * The prompt auto-saves after a short debounce (no Save button).
 */
export function AiSummarizationSettings() {
  const {
    data, isLoading,
  } = useAiSummarizationSettings();
  const update = useUpdateAiSummarizationSettings();
  const markSummarized = useMarkAiQueueSummarized();

  const [form, setFormState] = useState<AiSummarizationForm>(AI_SUMMARIZATION_DEFAULTS);
  const formRef = useRef<AiSummarizationForm>(form);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSeededRef = useRef(false);

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
      update.mutate(formRef.current, {
        onSuccess: () => notifySuccess("AI summarization prompt saved"),
        onError: error => notifyError(describeError(error)),
      });
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

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>AI Summarization Prompt</CardTitle>
          <CardDescription>
            The prompt sent to an AI to summarize bookmarks with the &quot;AI Summary Queue&quot; content
            status. Saved automatically as you type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.aiSummarizationPrompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Enter a prompt for the AI to follow when summarizing your queued bookmarks…"
            rows={8}
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
