import type { FlatNode } from "@/lib/tagTree";
import type { TagNode } from "@eesimple/types";

import { useMemo } from "react";

import {
  ArrowLeftIcon,
  CheckIcon,
  PlusIcon,
  Tags,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "../LocalizedNameLabel";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { subtreeIds } from "@/lib/tagTree";

function useTagsPalette(
  flatTags: FlatNode<TagNode>[],
  pendingTagIds: string[],
) {
  const allTagsById = useMemo(
    () => new Map(flatTags.map(({
      node,
    }) => [node.id, node])),
    [flatTags],
  );

  const {
    priorityTags, otherTags,
  } = useMemo(() => {
    if (pendingTagIds.length === 0) return {
      priorityTags: [],
      otherTags: flatTags,
    };
    const priorityIds = new Set<string>();
    for (const tagId of pendingTagIds) {
      priorityIds.add(tagId);
      let current = allTagsById.get(tagId);
      while (current?.parentId) {
        priorityIds.add(current.parentId);
        current = allTagsById.get(current.parentId);
      }
      const node = allTagsById.get(tagId);
      if (node) subtreeIds(node).forEach(id => priorityIds.add(id));
    }
    return {
      priorityTags: flatTags.filter(({
        node,
      }) => priorityIds.has(node.id)),
      otherTags: flatTags.filter(({
        node,
      }) => !priorityIds.has(node.id)),
    };
  }, [flatTags, pendingTagIds, allTagsById]);

  return {
    priorityTags,
    otherTags,
  };
}

export function TagsSubPalette({
  flatTags,
  pendingTagIds,
  onToggleTag,
  onBack,
  onDone,
  onCreateNew,
}: {
  flatTags: FlatNode<TagNode>[];
  pendingTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onBack: () => void;
  onDone: (tagIds: string[]) => void;
  onCreateNew: () => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    priorityTags, otherTags,
  } = useTagsPalette(flatTags, pendingTagIds);

  const renderTagItem = ({
    node: tag, depth,
  }: FlatNode<TagNode>) => {
    const selected = pendingTagIds.includes(tag.id);
    return (
      <CommandItem
        key={tag.id}
        value={`${tag.name} ${(tag.names ?? []).map(n => n.value).join(" ")}`.trim()}
        onSelect={() => onToggleTag(tag.id)}
      >
        <Tags />
        <span
          style={{
            paddingLeft: depth > 0 ? `${depth}rem` : undefined,
          }}
        >
          <LocalizedNameLabel
            names={tag.names ?? []}
            base={tag.name}
          />
        </span>
        {selected && (
          <CheckIcon
            className="ml-auto text-primary"
          />
        )}
      </CommandItem>
    );
  };

  return (
    <>
      <CommandGroup heading={t("Tags")}>
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          {t("Back")}
        </CommandItem>
        <CommandItem
          value="new tag"
          onSelect={onCreateNew}
        >
          <PlusIcon />
          {t("New tag…")}
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      {priorityTags.length > 0
        ? (
          <>
            <CommandGroup heading={t("Selected & related")}>
              {priorityTags.map(renderTagItem)}
            </CommandGroup>
            {otherTags.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t("Other tags")}>
                  {otherTags.map(renderTagItem)}
                </CommandGroup>
              </>
            )}
          </>
        )
        : (
          <CommandGroup heading={t("Toggle tags")}>
            {otherTags.map(renderTagItem)}
          </CommandGroup>
        )}
      <CommandSeparator />
      <CommandGroup>
        <CommandItem
          value="done save tags"
          onSelect={() => onDone(pendingTagIds)}
        >
          <CheckIcon />
          {t("Done ({{count}} selected)", {
            count: pendingTagIds.length,
          })}
        </CommandItem>
      </CommandGroup>
    </>
  );
}
