import type { UpdateWebsiteInput, Website, WebsiteExtensionFillRule } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";

import { ExtensionFillRulesEditor } from "./extensionFill/ExtensionFillRulesEditor";
import { ExtensionFillRulesReadonly } from "./extensionFill/ExtensionFillRulesReadonly";
import { WebsiteBuiltInFillRules } from "./extensionFill/WebsiteBuiltInFillRules";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateWebsite } from "../hooks/useWebsites";
import i18n from "../i18n";
import { normalizeExtensionFillRules } from "../lib/extensionFillForm";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/** Debounce window for the whole-rules auto-save (the codebase convention). */
const SAVE_DEBOUNCE_MS = 700;

const LABELS: Partial<Record<keyof UpdateWebsiteInput, string>> = {
  extensionFillRules: i18n.t("Extension Fill Rules"),
};

interface Props {
  website: Website;
}

/** Edit a website's browser-extension "check & fill" extraction rules. Auto-saves on change. */
export function WebsiteExtensionFillRulesForm({
  website,
}: Props) {
  const {
    t,
  } = useTranslation();
  const updateWebsite = useUpdateWebsite();
  // The fiddly rules open read-only so they can't be changed by accident; Edit reveals the builder.
  const [isEditing, setIsEditing] = useState(false);
  const [rules, setRules] = useState<WebsiteExtensionFillRule[]>(() => website.extensionFillRules);

  const autoSave = useFieldAutoSave<UpdateWebsiteInput>({
    id: website.id,
    update: updateWebsite,
    labels: LABELS,
    initial: {
      extensionFillRules: normalizeExtensionFillRules(website.extensionFillRules),
    },
  });

  // Debounce the save so per-keystroke edits collapse into one PATCH + toast. The pending value is
  // held so a quick unmount (navigating away) still flushes; `saveField` itself dedups no-ops.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef<WebsiteExtensionFillRule[] | null>(null);
  const saveFieldRef = useRef(autoSave.saveField);
  saveFieldRef.current = autoSave.saveField;

  function flush(): void {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
    if (pending.current === null) return;
    saveFieldRef.current("extensionFillRules", normalizeExtensionFillRules(pending.current));
    pending.current = null;
  }

  useEffect(() => flush, []);

  function handleChange(next: WebsiteExtensionFillRule[]): void {
    setRules(next);
    pending.current = next;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
  }

  function handleDone(): void {
    flush();
    setIsEditing(false);
  }

  return (
    <div className="space-y-6">
      {isEditing
        ? (
          <ExtensionFillRulesEditor
            rules={rules}
            onChange={handleChange}
            action={(
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDone}
              >
                {t("Done")}
              </Button>
            )}
          />
        )
        : (
          <ExtensionFillRulesReadonly
            rules={rules}
            onEdit={() => setIsEditing(true)}
          />
        )}
      <Separator />
      <WebsiteBuiltInFillRules website={website} />
    </div>
  );
}
