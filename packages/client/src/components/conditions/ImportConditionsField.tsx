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
  const matches = value.children.filter((child): child is MatchCondition => child.type === "match");
  const websiteLeaf = value.children.find((child): child is WebsiteCondition => child.type === "website");
  // Preserve other node types so the tree round-trips without data loss.
  const otherChildren = value.children.filter(
    child => child.type !== "match" && child.type !== "website",
  );

  function commit(next: { matches?: MatchCondition[];
    website?: WebsiteCondition | null; }) {
    const nextMatches = next.matches ?? matches;
    const nextWebsite = next.website === undefined ? websiteLeaf : next.website;
    const children: ConditionNode[] = [
      ...nextMatches,
      ...(nextWebsite && nextWebsite.domains.length > 0 ? [nextWebsite] : []),
      ...otherChildren,
    ];
    onChange({
      ...value,
      children,
    });
  }

  const websiteCount = websiteLeaf?.domains.length ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">URL must match</span>
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
        title="URL / Title"
        summary={matches.length > 0 ? `${matches.length}` : undefined}
        defaultOpen={matches.length > 0}
      >
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
                  onClick={() =>
                    commit({
                      matches: matches.filter((_, current) => current !== index),
                    })}
                >
                  Remove
                </Button>
              </div>
              <MatchConditionEditor
                value={match}
                onChange={next =>
                  commit({
                    matches: matches.map((existing, current) => (current === index ? next : existing)),
                  })}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              commit({
                matches: [...matches, {
                  type: "match",
                  field: "url",
                  operator: "contains",
                  pattern: "",
                }],
              })}
          >
            Add URL condition
          </Button>
        </div>
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
