import type {
  ConditionNode,
  ConditionTree,
  MatchCondition,
  WebsiteCondition,
} from "@eesimple/types";

import { ChevronDown } from "lucide-react";

import { MatchConditionEditor } from "./MatchConditionEditor";
import { WebsiteConditionEditor } from "./WebsiteConditionEditor";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ImportConditionsFieldProps {
  value: ConditionTree;
  onChange: (next: ConditionTree) => void;
}

interface SectionProps {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({
  title, summary, defaultOpen, children,
}: SectionProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="rounded-md border"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="
            flex w-full items-center justify-between gap-2 p-3 text-left text-sm
            font-medium
          "
        >
          <span>
            {title}
            {summary ? <span className="ml-2 font-normal text-muted-foreground">{summary}</span> : null}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t p-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Conditions builder restricted to URL match (text/domain) and Website (domain picker) conditions.
 * Import items only have a URL and title at ingest time, so category/tags/properties etc. would
 * never match — this component hides them to avoid confusion.
 */
export function ImportConditionsField({
  value, onChange,
}: ImportConditionsFieldProps) {
  const urlMatches = value.children.filter(
    (child): child is MatchCondition => child.type === "match" && child.field === "url",
  );
  const titleMatches = value.children.filter(
    (child): child is MatchCondition => child.type === "match" && child.field === "title",
  );
  const websiteLeaf = value.children.find((child): child is WebsiteCondition => child.type === "website");
  // Preserve other node types so the tree round-trips without data loss.
  const otherChildren = value.children.filter(
    child => child.type !== "match" && child.type !== "website",
  );

  function commit(next: {
    urlMatches?: MatchCondition[];
    titleMatches?: MatchCondition[];
    website?: WebsiteCondition | null;
  }) {
    const nextUrlMatches = next.urlMatches ?? urlMatches;
    const nextTitleMatches = next.titleMatches ?? titleMatches;
    const nextWebsite = next.website === undefined ? websiteLeaf : next.website;
    const children: ConditionNode[] = [
      ...nextUrlMatches,
      ...nextTitleMatches,
      ...(nextWebsite && nextWebsite.domains.length > 0 ? [nextWebsite] : []),
      ...otherChildren,
    ];
    onChange({
      ...value,
      children,
    });
  }

  function renderMatchRows(
    matches: MatchCondition[],
    updateMatches: (next: MatchCondition[]) => void,
    addNew: MatchCondition,
    addLabel: string,
  ) {
    return (
      <div className="space-y-3">
        {matches.map((match, index) => (
          <div
            key={index}
            className="space-y-2 rounded-md border p-2"
          >
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => updateMatches(matches.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
            <MatchConditionEditor
              value={match}
              onChange={next => updateMatches(matches.map((existing, i) => (i === index ? next : existing)))}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => updateMatches([...matches, addNew])}
        >
          {addLabel}
        </Button>
      </div>
    );
  }

  const websiteCount = websiteLeaf?.domains.length ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Bookmark must match</span>
        <ToggleGroup
          type="single"
          size="sm"
          value={value.combinator}
          onValueChange={(next) => {
            if (next === "and" || next === "or") {
              onChange({
                ...value,
                combinator: next,
              });
            }
          }}
        >
          <ToggleGroupItem value="and">all (AND)</ToggleGroupItem>
          <ToggleGroupItem value="or">any (OR)</ToggleGroupItem>
        </ToggleGroup>
        <span className="text-sm text-muted-foreground">of the following:</span>
      </div>

      <Section
        title="URL"
        summary={urlMatches.length > 0 ? `${urlMatches.length}` : undefined}
        defaultOpen={urlMatches.length > 0}
      >
        {renderMatchRows(
          urlMatches,
          next => commit({
            urlMatches: next,
          }),
          {
            type: "match",
            field: "url",
            operator: "contains",
            pattern: "",
          },
          "Add URL condition",
        )}
      </Section>

      <Section
        title="Title"
        summary={titleMatches.length > 0 ? `${titleMatches.length}` : undefined}
        defaultOpen={titleMatches.length > 0}
      >
        {renderMatchRows(
          titleMatches,
          next => commit({
            titleMatches: next,
          }),
          {
            type: "match",
            field: "title",
            operator: "contains",
            pattern: "",
          },
          "Add Title condition",
        )}
      </Section>

      <Section
        title="Website"
        summary={websiteCount > 0 ? `${websiteCount} selected` : undefined}
        defaultOpen={websiteCount > 0}
      >
        <WebsiteConditionEditor
          value={websiteLeaf ?? {
            type: "website",
            domains: [],
          }}
          onChange={next =>
            commit({
              website: next.domains.length > 0 ? next : null,
            })}
        />
      </Section>
    </div>
  );
}
