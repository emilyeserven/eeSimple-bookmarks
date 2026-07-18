import type { ReparentTagLine } from "../lib/tagReparent";
import type { TagReparentMove, TagReparentNewTag, TagNode } from "@eesimple/types";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { useTagReparentForm } from "../hooks/useTagReparentForm";
import { useApplyTagReparentPlan } from "../hooks/useTags";
import { describeError } from "../lib/apiError";
import { copyText } from "../lib/clipboard";
import { notifyError, notifySuccess } from "../lib/notifications";
import {
  buildReparentPrompt,
  describeReparentResult,
  parseReparentText,

} from "../lib/tagReparent";

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

/** Recursively flatten a subtree into prompt lines, prefixing each name with its ancestor path. */
function buildSubtreeLines(nodes: TagNode[], prefix: string): ReparentTagLine[] {
  return nodes.flatMap((node) => {
    const path = prefix ? `${prefix} / ${node.name}` : node.name;
    return [{
      id: node.id,
      path,
    }, ...buildSubtreeLines(node.children, path)];
  });
}

/**
 * The Reparent tab on a tag's page. Lists the tag's current subtags, takes a free-text note of the
 * subtags/groupings the user wants, and generates a ready-to-paste AI prompt asking for a cleaner
 * hierarchy. The user pastes the AI's `{ newTags, moves }` JSON back, reviews each proposed new tag /
 * move (checkboxes, all kept by default), and applies only the ones they keep — creating any new
 * grouping tags and reparenting existing tags in one server call. Mirrors {@link AiAutotagSettings}.
 */
export function TagReparentTab({
  tag,
}: { tag: TagNode }) {
  const {
    t,
  } = useTranslation();
  const {
    form, patchForm,
  } = useTagReparentForm();
  const applyPlan = useApplyTagReparentPlan();

  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [applyText, setApplyText] = useState("");
  // Excluded keys (a move's tag id, or a newTag's tempId) — everything is applied unless unchecked.
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const subtree = useMemo(() => buildSubtreeLines(tag.children, ""), [tag.children]);
  const nameById = useMemo(
    () => new Map([[tag.id, tag.name], ...subtree.map(line => [line.id, line.path] as const)]),
    [tag.id, tag.name, subtree],
  );
  const parseState = useMemo(() => parseReparentText(applyText), [applyText]);

  const generatedPrompt = buildReparentPrompt(form.tagReparentPrompt, {
    id: tag.id,
    name: tag.name,
  }, subtree, notes);

  function handleCopy(): void {
    copyText(generatedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => notifyError(t("Could not copy to clipboard")));
  }

  function toggle(key: string): void {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleApply(): void {
    if (parseState.kind !== "ok") {
      notifyError(t("Could not parse JSON. Paste the AI's JSON response."));
      return;
    }
    const newTags = parseState.plan.newTags.filter(item => !excluded.has(item.tempId));
    const moves = parseState.plan.moves.filter(item => !excluded.has(item.id));
    if (newTags.length === 0 && moves.length === 0) {
      notifyError(t("No changes selected to apply."));
      return;
    }
    applyPlan.mutate({
      newTags,
      moves,
    }, {
      onSuccess: (result) => {
        notifySuccess(describeReparentResult(result));
        setApplyText("");
        setExcluded(new Set());
      },
      onError: error => notifyError(describeError(error)),
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("Current Subtags")}</CardTitle>
          <CardDescription>
            {subtree.length > 0
              ? t("The tags currently nested under this tag, included in the prompt below.")
              : t("This tag has no subtags yet. Note the ones you want below, then generate the prompt.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subtree.length > 0
            ? (
              <ul className="space-y-1 text-sm">
                {subtree.map(line => (
                  <li
                    key={line.id}
                    className="font-mono text-xs text-muted-foreground"
                  >{line.path}
                  </li>
                ))}
              </ul>
            )
            : <p className="text-sm text-muted-foreground">{t("No subtags.")}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Subtags I Want")}</CardTitle>
          <CardDescription>
            {t("Describe any groupings or subtags you'd like — the AI uses these as goals when proposing a new hierarchy.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t("e.g. group the frontend frameworks under a \"Frontend\" tag, split tooling from libraries…")}
            rows={4}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Reparent Prompt")}</CardTitle>
          <CardDescription>
            {t("Ready to paste into your AI. It asks for JSON you can paste back below, then review and apply.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={generatedPrompt}
            readOnly
            rows={12}
            className="resize-none bg-muted/50 font-mono text-xs"
          />
          <div className="flex justify-end">
            <Button onClick={handleCopy}>
              {copied ? t("Copied!") : t("Copy Prompt")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Review & Apply")}</CardTitle>
          <CardDescription>
            {t("Paste the AI's JSON response here. Review the proposed new tags and moves, uncheck any you don't want, then apply.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={applyText}
            onChange={e => setApplyText(e.target.value)}
            placeholder={"{ \"newTags\": [], \"moves\": [{ \"id\": \"…\", \"parentId\": \"…\" }] }"}
            rows={8}
            className="font-mono text-xs"
          />
          {parseState.kind === "error" && (
            <p className="text-sm text-destructive">{t("Could not parse JSON. Paste the AI's JSON response.")}</p>
          )}
          {parseState.kind === "invalid" && (
            <p className="text-sm text-destructive">{t("JSON must be an object with newTags and moves arrays.")}</p>
          )}
          {parseState.kind === "ok" && (parseState.plan.newTags.length > 0 || parseState.plan.moves.length > 0) && (
            <ReparentReviewList
              newTags={parseState.plan.newTags}
              moves={parseState.plan.moves}
              nameById={nameById}
              excluded={excluded}
              onToggle={toggle}
            />
          )}
          <div className="flex justify-end">
            <Button
              onClick={handleApply}
              disabled={applyPlan.isPending || parseState.kind !== "ok"}
            >
              {applyPlan.isPending ? t("Applying…") : t("Apply Changes")}
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
            value={form.tagReparentPrompt}
            onChange={e => patchForm({
              tagReparentPrompt: e.target.value,
            })}
            placeholder={t("Enter instructions for the AI to follow when reorganizing this tag's hierarchy…")}
            rows={6}
          />
        </CardContent>
      </Card>
    </>
  );
}

interface ReparentReviewListProps {
  newTags: TagReparentNewTag[];
  moves: TagReparentMove[];
  nameById: Map<string, string>;
  excluded: Set<string>;
  onToggle: (key: string) => void;
}

/** Review the AI's proposed plan: each new grouping tag and each move is a checkbox, kept unless unchecked. */
function ReparentReviewList({
  newTags, moves, nameById, excluded, onToggle,
}: ReparentReviewListProps) {
  const {
    t,
  } = useTranslation();

  /** Resolve a parent reference to a display label: an existing tag name, a newTag name, or "Top level". */
  function parentLabel(parentId: string | null): string {
    if (parentId === null) return t("Top level");
    const existing = nameById.get(parentId);
    if (existing) return existing;
    const created = newTags.find(item => item.tempId === parentId);
    return created ? `${created.name} ${t("(new)")}` : parentId;
  }

  return (
    <div className="space-y-4 rounded-lg border p-3">
      {newTags.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t("New tags")}</p>
          {newTags.map((item) => {
            const checkboxId = `reparent-new-${item.tempId}`;
            return (
              <div
                key={item.tempId}
                className="flex items-center gap-1.5"
              >
                <Checkbox
                  id={checkboxId}
                  checked={!excluded.has(item.tempId)}
                  onCheckedChange={() => onToggle(item.tempId)}
                />
                <Label
                  htmlFor={checkboxId}
                  className="text-sm font-normal"
                >
                  {t("Create")}
                  {" "}
                  <span className="font-medium">{item.name}</span>
                  {" "}
                  {t("under")}
                  {" "}
                  {parentLabel(item.parentId)}
                </Label>
              </div>
            );
          })}
        </div>
      )}
      {moves.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t("Moves")}</p>
          {moves.map((item) => {
            const checkboxId = `reparent-move-${item.id}`;
            return (
              <div
                key={item.id}
                className="flex items-center gap-1.5"
              >
                <Checkbox
                  id={checkboxId}
                  checked={!excluded.has(item.id)}
                  onCheckedChange={() => onToggle(item.id)}
                />
                <Label
                  htmlFor={checkboxId}
                  className="text-sm font-normal"
                >
                  <span className="font-medium">{nameById.get(item.id) ?? item.id}</span>
                  {" "}
                  {t("under")}
                  {" "}
                  {parentLabel(item.parentId)}
                </Label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
