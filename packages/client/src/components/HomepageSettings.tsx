import type { ConditionTree } from "@eesimple/types";

import { useState } from "react";

import { emptyConditionTree } from "@eesimple/types";

import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useHomepageFilter, useSetHomepageFilter } from "../hooks/useHomepageFilter";
import { useTagTree } from "../hooks/useTags";
import { ConditionsField } from "./conditions/ConditionsField";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Settings section: build the condition filter that decides which bookmarks show on the homepage. */
export function HomepageSettings() {
  const {
    data: saved,
  } = useHomepageFilter();
  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();
  const setFilter = useSetHomepageFilter();

  // Edit a local draft; fall back to the saved filter until the user changes something.
  const [draft, setDraft] = useState<ConditionTree | null>(null);
  const value = draft ?? saved ?? emptyConditionTree();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage</CardTitle>
        <CardDescription>
          Choose which bookmarks appear on your homepage by building a filter. Combine conditions
          with AND/OR.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ConditionsField
          value={value}
          onChange={setDraft}
          categories={categories ?? []}
          properties={properties ?? []}
          tagTree={tagTree ?? []}
        />
        <Button
          type="button"
          onClick={() => setFilter.mutate(value)}
          disabled={setFilter.isPending}
        >
          {setFilter.isPending ? "Saving…" : "Save homepage filter"}
        </Button>
      </CardContent>
    </Card>
  );
}
