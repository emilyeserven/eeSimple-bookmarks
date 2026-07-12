import type { Website } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { ExtensionFillRulesEditor } from "./extensionFill/ExtensionFillRulesEditor";
import { ExtensionFillGroupsBoard } from "./extensionFill/groups/ExtensionFillGroupsBoard";
import { WebsiteBuiltInFillRules } from "./extensionFill/WebsiteBuiltInFillRules";
import { navLinkClass } from "./TabbedShell";
import { useExtensionFillRulesEditor } from "../hooks/useExtensionFillRulesEditor";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Props {
  website: Website;
}

type SubTab = "rules" | "groups";

/**
 * Edit a website's browser-extension "check & fill" extraction rules — a self-contained vertical
 * two-tab rail (mirroring `VerticalTabbedLayout` without routing): **Rules** (the grouped rule list +
 * built-in rules) and **Groups** (manage rule groups + their option overrides). Both share one
 * debounced auto-save via {@link useExtensionFillRulesEditor}.
 */
export function WebsiteExtensionFillRulesForm({
  website,
}: Props) {
  const {
    t,
  } = useTranslation();
  const editor = useExtensionFillRulesEditor(website);
  const [tab, setTab] = useState<SubTab>("rules");

  const tabs: { key: SubTab;
    label: string; }[] = [
    {
      key: "rules",
      label: t("Rules"),
    },
    {
      key: "groups",
      label: t("Groups"),
    },
  ];

  return (
    <div
      className="
        flex flex-col gap-6
        md:flex-row
      "
    >
      <nav
        aria-label={t("Extension fill sections")}
        className="
          flex flex-row gap-1 overflow-x-auto border-b pb-1
          md:w-48 md:shrink-0 md:flex-col md:border-b-0 md:pb-0
        "
      >
        {tabs.map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              navLinkClass,
              `
                text-left
                md:w-full
              `,
              tab === item.key ? "bg-accent text-accent-foreground" : "",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="min-w-0 flex-1">
        {tab === "rules"
          ? (
            <div className="space-y-6">
              <ExtensionFillRulesEditor
                rules={editor.rules}
                groups={editor.groups}
                onChange={editor.changeRules}
              />
              <Separator />
              <WebsiteBuiltInFillRules website={website} />
            </div>
          )
          : (
            <ExtensionFillGroupsBoard
              rules={editor.rules}
              groups={editor.groups}
              onRulesChange={editor.changeRules}
              onGroupsChange={editor.changeGroups}
              onReplace={editor.replace}
            />
          )}
      </div>
    </div>
  );
}
