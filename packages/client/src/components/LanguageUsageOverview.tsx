import type { LanguageUsageGroup, LanguageUsageGroupMode } from "../lib/languageUsageGrouping";
import type { LanguageUsageKind } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { Captions, ChevronDown, ChevronRight, Languages, Pencil } from "lucide-react";

import { useExpandedSet } from "../hooks/useExpandedSet";
import { useLanguageUsageAssociations, useLanguageUsageLevels } from "../hooks/useLanguageUsageLevels";
import { groupLanguageUsages } from "../lib/languageUsageGrouping";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const KIND_SECTIONS: { kind: LanguageUsageKind;
  title: string;
  description: string; }[] = [
  {
    kind: "availability",
    title: "Availability",
    description: "How content offers a language — e.g. Dub, Subtitles, Explanations.",
  },
  {
    kind: "proficiency",
    title: "Proficiency",
    description: "A person's command of a language — e.g. Native, Fluent, Learning.",
  },
];

/**
 * The Language Usage Levels overview: browse the (language, level) pairings actually in use,
 * grouped by either the usage level or the language, sectioned by kind. Each group expands to reveal
 * the other dimension; clicking a leaf opens that language's bookmarks filtered to the level. The
 * vocabulary itself is edited on the linked Edit page.
 */
export function LanguageUsageOverview() {
  const [mode, setMode] = useState<LanguageUsageGroupMode>("level");
  const {
    data: associations = [],
  } = useLanguageUsageAssociations();
  const {
    data: levels = [],
  } = useLanguageUsageLevels();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Language Usage Levels</h1>
          <p className="text-sm text-muted-foreground">
            Browse which languages are used at each level. Edit the vocabulary itself on the Edit
            page.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link to="/taxonomies/language-usage-levels/edit">
            <Pencil className="size-4" />
            Edit levels
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Group by</span>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={mode}
          onValueChange={(value) => {
            if (value === "level" || value === "language") setMode(value);
          }}
          aria-label="Group by"
        >
          <ToggleGroupItem value="level">Usage level</ToggleGroupItem>
          <ToggleGroupItem value="language">Language</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {KIND_SECTIONS.map((section, index) => (
        <div key={section.kind}>
          {index > 0 ? <Separator className="mb-6" /> : null}
          <KindSection
            title={section.title}
            description={section.description}
            groups={groupLanguageUsages(
              associations.filter(a => a.level.kind === section.kind),
              mode,
              mode === "level" ? levels.filter(l => l.kind === section.kind) : [],
            )}
            mode={mode}
          />
        </div>
      ))}
    </div>
  );
}

function KindSection({
  title, description, groups, mode,
}: {
  title: string;
  description: string;
  groups: LanguageUsageGroup[];
  mode: LanguageUsageGroupMode;
}) {
  const {
    expanded, onToggle,
  } = useExpandedSet([]);

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {groups.length === 0
        ? <p className="text-sm text-muted-foreground">Nothing here yet.</p>
        : groups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            mode={mode}
            isOpen={expanded.has(group.id)}
            onToggle={() => onToggle(group.id)}
          />
        ))}
    </section>
  );
}

function GroupCard({
  group, mode, isOpen, onToggle,
}: {
  group: LanguageUsageGroup;
  mode: LanguageUsageGroupMode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const hasChildren = group.children.length > 0;
  const GroupIcon = mode === "level" ? Captions : Languages;

  return (
    <RowCard className="overflow-hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        disabled={!hasChildren}
        onClick={onToggle}
        className="
          flex w-full items-center gap-2 p-4 text-left
          hover:bg-accent/50
          disabled:cursor-default
          disabled:hover:bg-transparent
        "
      >
        {hasChildren
          ? (isOpen
            ? <ChevronDown className="size-4 shrink-0" />
            : (
              <ChevronRight
                className="size-4 shrink-0"
              />
            ))
          : (
            <span
              className="inline-block size-4 shrink-0"
              aria-hidden
            />
          )}
        <GroupIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate font-medium">{group.name}</span>
        <Badge variant="outline">{group.count}</Badge>
      </button>
      {isOpen && hasChildren
        ? (
          <ul className="divide-y border-t">
            {group.children.map(leaf => (
              <li key={leaf.id}>
                <Link
                  to="/taxonomies/languages/$languageSlug"
                  params={{
                    languageSlug: leaf.languageSlug,
                  }}
                  search={{
                    usageLevel: leaf.levelSlug,
                  }}
                  className="
                    flex items-center gap-2 py-2 pr-4 pl-12 text-sm
                    hover:bg-accent hover:text-accent-foreground
                  "
                >
                  <span className="flex-1 truncate">{leaf.name}</span>
                  <Badge variant="secondary">{leaf.count}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )
        : null}
    </RowCard>
  );
}
