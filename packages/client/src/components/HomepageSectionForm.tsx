import type { ConditionTree, HomepageSection } from "@eesimple/types";

import { useState } from "react";

import { emptyConditionTree } from "@eesimple/types";

import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";
import { ConditionsField } from "./conditions/ConditionsField";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface HomepageSectionFormProps {
  section?: HomepageSection;
  onSave: (values: { title: string;
    description: string | null;
    conditions: ConditionTree;
    hideIfEmpty: boolean; }) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function HomepageSectionForm({
  section, onSave, onCancel, isPending,
}: HomepageSectionFormProps) {
  const [title, setTitle] = useState(section?.title ?? "");
  const [description, setDescription] = useState(section?.description ?? "");
  const [conditions, setConditions] = useState<ConditionTree>(
    section?.conditions ?? emptyConditionTree(),
  );
  const [hideIfEmpty, setHideIfEmpty] = useState(section?.hideIfEmpty ?? false);

  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      conditions,
      hideIfEmpty,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-1">
        <Label htmlFor="section-title">Title</Label>
        <Input
          id="section-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Section title"
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="section-description">Description</Label>
        <Textarea
          id="section-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional description shown above the bookmarks"
          rows={2}
        />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Filter</p>
        <p className="text-sm text-muted-foreground">
          Choose which bookmarks appear in this section. Combine conditions with AND/OR.
        </p>
        <ConditionsField
          value={conditions}
          onChange={setConditions}
          categories={categories ?? []}
          properties={properties ?? []}
          tagTree={tagTree ?? []}
        />
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="section-hide-if-empty"
          checked={hideIfEmpty}
          onCheckedChange={checked => setHideIfEmpty(checked === true)}
        />
        <div className="space-y-0.5">
          <Label
            htmlFor="section-hide-if-empty"
            className="cursor-pointer"
          >
            Hide when empty
          </Label>
          <p className="text-sm text-muted-foreground">
            Don&rsquo;t show this section when no bookmarks match its filter.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isPending || !title.trim()}
        >
          {isPending ? "Saving…" : "Save section"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
