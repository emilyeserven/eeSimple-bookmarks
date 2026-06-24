import type { ComboboxOption } from "./Combobox";
import type { RuleAttrLabels } from "../lib/cardDisplayRuleAttrFormat";
import type { BookmarkRuleInspection } from "../lib/cardDisplayRules";
import type { Bookmark } from "@eesimple/types";

import { useMemo, useState } from "react";

import { buildTagDescendants } from "@eesimple/types";
import { ChevronDown } from "lucide-react";

import { Combobox } from "./Combobox";
import { useCroppedHeight, useCroppedWidth } from "../hooks/useAppSettings";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCardDisplayRules } from "../hooks/useCardDisplayRules";
import { useCustomAspectRatios } from "../hooks/useCustomAspectRatios";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTags } from "../hooks/useTags";
import { buildAspectOptions } from "../lib/aspectOptions";
import { STANDARD_CARD_FIELDS } from "../lib/bookmarkCardFields";
import { formatRuleAttrValue } from "../lib/cardDisplayRuleAttrFormat";
import { inspectBookmarkRules } from "../lib/cardDisplayRules";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Sort rules into priority order: non-default first (lowest sortOrder first), the Default rule last. */
function byPriority(
  a: { isDefault: boolean;
    sortOrder: number; },
  b: { isDefault: boolean;
    sortOrder: number; },
): number {
  if (a.isDefault !== b.isDefault) return a.isDefault ? 1 : -1;
  return a.sortOrder - b.sortOrder;
}

/** The bookmark host, for disambiguating same-titled bookmarks in the picker. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  }
  catch {
    return url;
  }
}

/** All the loaded data + derived lookups the inspector needs, gathered into one hook to keep the view thin. */
function useCardRuleInspectorData() {
  const {
    data: bookmarks = [],
  } = useBookmarks();
  const {
    data: rules = [],
  } = useCardDisplayRules();
  const {
    data: tags = [],
  } = useTags();
  const {
    data: properties = [],
  } = useCustomProperties();
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();
  const croppedWidth = useCroppedWidth();
  const croppedHeight = useCroppedHeight();

  const options = useMemo<ComboboxOption[]>(
    () => bookmarks.map(bookmark => ({
      value: bookmark.id,
      label: `${bookmark.title || bookmark.url || ""} — ${hostOf(bookmark.url ?? "")}`,
    })),
    [bookmarks],
  );

  const sortedRules = useMemo(() => [...rules].sort(byPriority), [rules]);
  const tagDescendants = useMemo(
    () => buildTagDescendants(tags.map(tag => ({
      id: tag.id,
      parentId: tag.parentId,
    }))),
    [tags],
  );

  const ruleNameById = useMemo(
    () => new Map(rules.map(rule => [rule.id, rule.name])),
    [rules],
  );

  const labels = useMemo<RuleAttrLabels>(() => {
    const aspectOptions = buildAspectOptions(croppedWidth, croppedHeight, customRatios);
    const fieldLabel = new Map<string, string>(STANDARD_CARD_FIELDS.map(f => [f.key, f.label]));
    for (const property of properties) fieldLabel.set(property.id, property.name);
    return {
      aspectLabel: new Map(aspectOptions.map(opt => [opt.value, opt.label])),
      fieldLabel,
    };
  }, [croppedWidth, croppedHeight, customRatios, properties]);

  return {
    bookmarks,
    options,
    sortedRules,
    tagDescendants,
    ruleNameById,
    labels,
  };
}

/**
 * Settings inspector: pick a bookmark and see which card display rules apply to it, what each
 * matching rule sets, and which attributes were overridden by a higher-priority rule. A pure view
 * over the same `resolveCardDisplay` provenance the listing cards use, so the two always agree.
 */
export function CardDisplayRuleInspector() {
  const {
    bookmarks,
    options,
    sortedRules,
    tagDescendants,
    ruleNameById,
    labels,
  } = useCardRuleInspectorData();

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const selectedBookmark: Bookmark | undefined = selectedId
    ? bookmarks.find(bookmark => bookmark.id === selectedId)
    : undefined;

  const inspection: BookmarkRuleInspection | null = useMemo(
    () => (selectedBookmark
      ? inspectBookmarkRules(selectedBookmark, sortedRules, tagDescendants)
      : null),
    [selectedBookmark, sortedRules, tagDescendants],
  );

  const matchedRules = inspection?.rules.filter(ri => ri.matched) ?? [];
  const unmatchedRules = inspection?.rules.filter(ri => !ri.matched) ?? [];

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="card-rule-inspector">Inspect a bookmark</Label>
        <p className="text-sm text-muted-foreground">
          Pick a bookmark to see which rules apply to it — and what each rule sets versus what a
          higher-priority rule overrode.
        </p>
        <Combobox
          id="card-rule-inspector"
          options={options}
          value={selectedId}
          onValueChange={setSelectedId}
          placeholder="Search for a bookmark…"
          searchPlaceholder="Search bookmarks…"
          emptyText="No bookmarks found."
        />
      </div>

      {inspection
        ? (
          <div className="space-y-3">
            {matchedRules.map(ri => (
              <div
                key={ri.rule.id}
                className="space-y-2 rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{ri.rule.name}</span>
                  {ri.rule.isDefault
                    ? <Badge variant="secondary">Default</Badge>
                    : null}
                </div>
                {ri.attrs.length === 0
                  ? (
                    <p className="text-sm text-muted-foreground">
                      Matches, but sets no display attributes.
                    </p>
                  )
                  : (
                    <ul className="space-y-1">
                      {ri.attrs.map(attr => (
                        <li
                          key={attr.key}
                          className="
                            flex items-start justify-between gap-2 text-sm
                          "
                        >
                          <span
                            className={cn(
                              "min-w-0",
                              attr.status === "overridden" && `
                                text-muted-foreground line-through
                              `,
                            )}
                          >
                            <span className="font-medium">{attr.label}:</span>
                            {" "}
                            {formatRuleAttrValue(attr, labels)}
                          </span>
                          {attr.status === "applied"
                            ? <Badge className="shrink-0 bg-green-600">Applied</Badge>
                            : (
                              <Badge
                                variant="outline"
                                className="shrink-0 text-muted-foreground"
                              >
                                Overridden by
                                {" "}
                                {ruleNameById.get(attr.overriddenBy ?? "") ?? "a higher rule"}
                              </Badge>
                            )}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            ))}

            {unmatchedRules.length > 0
              ? (
                <Collapsible>
                  <CollapsibleTrigger
                    className="
                      group flex items-center gap-1 text-sm
                      text-muted-foreground
                      hover:text-foreground
                    "
                  >
                    <ChevronDown
                      className="
                        size-4 transition-transform
                        group-data-[state=open]:rotate-180
                      "
                    />
                    {unmatchedRules.length}
                    {" "}
                    rule
                    {unmatchedRules.length === 1 ? "" : "s"}
                    {" "}
                    don&rsquo;t apply
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 pl-5">
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {unmatchedRules.map(ri => <li key={ri.rule.id}>{ri.rule.name}</li>)}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              )
              : null}
          </div>
        )
        : selectedId
          ? <p className="text-sm text-muted-foreground">Bookmark not found.</p>
          : null}
    </div>
  );
}
