import type { ExtensionFillRuleGroup, UpdateWebsiteInput, Website, WebsiteExtensionFillRule } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { useFieldAutoSave } from "./useFieldAutoSave";
import { useUpdateWebsite } from "./useWebsites";
import i18n from "../i18n";
import { normalizeExtensionFillRules } from "../lib/extensionFillForm";
import { materializeAll } from "../lib/extensionFillGroups";

/** Debounce window for the whole-rules/groups auto-save (the codebase convention). */
const SAVE_DEBOUNCE_MS = 700;

const LABELS: Partial<Record<keyof UpdateWebsiteInput, string>> = {
  extensionFillRules: i18n.t("Extension Fill Rules"),
  extensionFillRuleGroups: i18n.t("Extension Fill Groups"),
};

export interface EditorState {
  rules: WebsiteExtensionFillRule[];
  groups: ExtensionFillRuleGroup[];
}

/**
 * Owns the Website "Extension Fill" editor state — the fill rules **and** their groups — plus a
 * single debounced auto-save that PATCHes both fields. Rules are **materialized** against the groups
 * before every save (`materializeAll`) so each stored rule stays self-complete for the extension.
 *
 * Callers mutate through the three committers: {@link changeRules} (rule/membership edits),
 * {@link changeGroups} (re-materializes members so read-only fields update immediately), and
 * {@link replace} (a combined edit like deleting a group). Each schedules the debounced save.
 */
export function useExtensionFillRulesEditor(website: Website) {
  const updateWebsite = useUpdateWebsite();
  const [state, setState] = useState<EditorState>(() => ({
    rules: website.extensionFillRules,
    groups: website.extensionFillRuleGroups,
  }));

  const autoSave = useFieldAutoSave<UpdateWebsiteInput>({
    id: website.id,
    update: updateWebsite,
    labels: LABELS,
    initial: {
      extensionFillRules: normalizeExtensionFillRules(
        materializeAll(website.extensionFillRuleGroups, website.extensionFillRules),
      ),
      extensionFillRuleGroups: website.extensionFillRuleGroups,
    },
  });

  // Debounce the save so per-keystroke edits collapse into one PATCH + toast. The pending value is
  // held so a quick unmount (navigating away) still flushes; `saveField` itself dedups no-ops.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef<EditorState | null>(null);
  const saveFieldRef = useRef(autoSave.saveField);
  saveFieldRef.current = autoSave.saveField;

  function flush(): void {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
    if (pending.current === null) return;
    const {
      rules, groups,
    } = pending.current;
    saveFieldRef.current("extensionFillRuleGroups", groups);
    saveFieldRef.current("extensionFillRules", normalizeExtensionFillRules(materializeAll(groups, rules)));
    pending.current = null;
  }

  useEffect(() => flush, []);

  function commit(next: EditorState): void {
    setState(next);
    pending.current = next;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
  }

  /** Replace the rule list (rule/membership edits — no group change). */
  function changeRules(rules: WebsiteExtensionFillRule[]): void {
    commit({
      rules,
      groups: state.groups,
    });
  }

  /** Replace the groups; re-materialize members so their locked fields reflect the new values now. */
  function changeGroups(groups: ExtensionFillRuleGroup[]): void {
    commit({
      groups,
      rules: materializeAll(groups, state.rules),
    });
  }

  /** Replace both at once (e.g. deleting a group, which detaches members and re-homes children). */
  function replace(next: EditorState): void {
    commit(next);
  }

  return {
    rules: state.rules,
    groups: state.groups,
    changeRules,
    changeGroups,
    replace,
  };
}
