import type { AiAutotagApplyItem } from "@eesimple/types";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { useApplyAiTags, useUntaggedBookmarks } from "../hooks/useAiAutotag";
import { useAiAutotagForm } from "../hooks/useAiAutotagForm";
import { useTags } from "../hooks/useTags";
import { buildAutotagPrompt, describeAutotagResult, parseAutotagText } from "../lib/aiAutotag";
import { describeError } from "../lib/apiError";
import { copyText } from "../lib/clipboard";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MIN_COUNT = 1;
const MAX_COUNT = 200;
const DEFAULT_COUNT = 10;

/** Key identifying a single (bookmark, tag) pair in the review selection. */
function pairKey(id: string, tag: string): string {
  return `${id}::${tag}`;
}

/**
 * AI Autotag settings: picks a batch of untagged bookmarks, shows a ready-to-paste prompt (the stored
 * template + the batch + an optional list of existing tags + a JSON output-format instruction), and
 * lets the user paste the AI's JSON back, review the suggested tags per bookmark (checkboxes, all
 * checked by default), and apply only the ones they keep — creating any tag names that don't yet exist.
 */
export function AiAutotagSettings() {
  const {
    t,
  } = useTranslation();
  const {
    form, patchForm, isLoading,
  } = useAiAutotagForm();
  const [count, setCount] = useState(DEFAULT_COUNT);
  const {
    data: untagged = [], isLoading: isUntaggedLoading,
  } = useUntaggedBookmarks(count);
  const {
    data: tags = [],
  } = useTags();
  const applyTags = useApplyAiTags();

  const [copied, setCopied] = useState(false);
  const [applyText, setApplyText] = useState("");
  // Excluded (bookmark, tag) pairs — everything the AI returned is applied unless the user unchecks it.
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const parseState = useMemo(() => parseAutotagText(applyText), [applyText]);
  const titleById = useMemo(
    () => new Map(untagged.map(item => [item.id, item.title])),
    [untagged],
  );

  const existingTagNames = form.aiAutotagIncludeExistingTags ? tags.map(tag => tag.name) : null;
  const generatedPrompt = buildAutotagPrompt(form.aiAutotagPrompt, untagged, existingTagNames);

  function handleCopy(): void {
    copyText(generatedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => notifyError(t("Could not copy to clipboard")));
  }

  function toggleTag(id: string, tag: string): void {
    const key = pairKey(id, tag);
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectedItems(items: AiAutotagApplyItem[]): AiAutotagApplyItem[] {
    return items
      .map(item => ({
        id: item.id,
        tags: item.tags.filter(tag => !excluded.has(pairKey(item.id, tag))),
      }))
      .filter(item => item.tags.length > 0);
  }

  function handleApply(): void {
    if (parseState.kind !== "ok") {
      notifyError(t("Could not parse JSON. Paste the AI's JSON response."));
      return;
    }
    const items = selectedItems(parseState.items);
    if (items.length === 0) {
      notifyError(t("No tags selected to apply."));
      return;
    }
    applyTags.mutate({
      items,
    }, {
      onSuccess: (result) => {
        notifySuccess(describeAutotagResult(result));
        setApplyText("");
        setExcluded(new Set());
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
          <CardTitle>{t("Untagged Bookmarks")}</CardTitle>
          <CardDescription>
            {t("Choose how many of your most recent untagged bookmarks to include in the prompt.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="autotag-count">{t("How many bookmarks")}</Label>
              <Input
                id="autotag-count"
                type="number"
                min={MIN_COUNT}
                max={MAX_COUNT}
                value={count}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (Number.isFinite(next)) {
                    setCount(Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.floor(next))));
                  }
                }}
                className="w-28"
              />
            </div>
            <p className="pb-2 text-sm text-muted-foreground">
              {isUntaggedLoading
                ? t("Loading…")
                : `${untagged.length} ${untagged.length === 1 ? t("untagged bookmark") : t("untagged bookmarks")}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("AI Autotag Prompt")}</CardTitle>
          <CardDescription>
            {untagged.length > 0
              ? t("Ready to paste into your AI. It asks for JSON you can paste back below, then review and apply.")
              : t("No untagged bookmarks were found.")}
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
              id="include-existing-tags"
              checked={form.aiAutotagIncludeExistingTags}
              onCheckedChange={value => patchForm({
                aiAutotagIncludeExistingTags: value === true,
              })}
            />
            <Label htmlFor="include-existing-tags">{t("Include my existing tags in the prompt")}</Label>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleCopy}
              disabled={untagged.length === 0}
            >
              {copied ? t("Copied!") : t("Copy Prompt")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Review & Apply Tags")}</CardTitle>
          <CardDescription>
            {t("Paste the AI's JSON response here. Review the suggested tags per bookmark and uncheck any you don't want, then apply. Tag names that don't exist yet are created.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={applyText}
            onChange={e => setApplyText(e.target.value)}
            placeholder={"[{ \"id\": \"…\", \"tags\": [\"…\"] }]"}
            rows={8}
            className="font-mono text-xs"
          />
          {parseState.kind === "error" && (
            <p className="text-sm text-destructive">{t("Could not parse JSON. Paste the AI's JSON response.")}</p>
          )}
          {parseState.kind === "invalid" && (
            <p className="text-sm text-destructive">{t("JSON must be an array of { id, tags } objects.")}</p>
          )}
          {parseState.kind === "ok" && parseState.items.length > 0 && (
            <AutotagReviewList
              items={parseState.items}
              titleById={titleById}
              excluded={excluded}
              onToggle={toggleTag}
            />
          )}
          <div className="flex justify-end">
            <Button
              onClick={handleApply}
              disabled={applyTags.isPending || parseState.kind !== "ok"}
            >
              {applyTags.isPending ? t("Applying…") : t("Apply Tags")}
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
            value={form.aiAutotagPrompt}
            onChange={e => patchForm({
              aiAutotagPrompt: e.target.value,
            })}
            placeholder={t("Enter instructions for the AI to follow when tagging your untagged bookmarks…")}
            rows={6}
          />
        </CardContent>
      </Card>
    </>
  );
}

interface AutotagReviewListProps {
  items: AiAutotagApplyItem[];
  titleById: Map<string, string>;
  excluded: Set<string>;
  onToggle: (id: string, tag: string) => void;
}

/** Per-bookmark review: each returned tag is a checkbox, checked (applied) unless the user unchecks it. */
function AutotagReviewList({
  items, titleById, excluded, onToggle,
}: AutotagReviewListProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-3 rounded-lg border p-3">
      {items.map(item => (
        <div
          key={item.id}
          className="space-y-1.5"
        >
          <p className="text-sm font-medium">{titleById.get(item.id) ?? item.id}</p>
          {item.tags.length === 0
            ? <p className="text-xs text-muted-foreground">{t("No tags suggested.")}</p>
            : (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {item.tags.map((tag) => {
                  const checkboxId = `autotag-${item.id}-${tag}`;
                  return (
                    <div
                      key={tag}
                      className="flex items-center gap-1.5"
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={!excluded.has(`${item.id}::${tag}`)}
                        onCheckedChange={() => onToggle(item.id, tag)}
                      />
                      <Label
                        htmlFor={checkboxId}
                        className="text-sm font-normal"
                      >{tag}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      ))}
    </div>
  );
}
