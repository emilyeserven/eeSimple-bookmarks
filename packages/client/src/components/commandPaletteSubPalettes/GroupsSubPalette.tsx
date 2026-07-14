import type { Group } from "@eesimple/types";

import {
  ArrowLeftIcon,
  Building2,
  CheckIcon,
  PlusIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

export function GroupsSubPalette({
  groups,
  pendingGroupIds,
  onToggleGroup,
  onBack,
  onDone,
  onCreateNew,
}: {
  groups: Group[];
  pendingGroupIds: string[];
  onToggleGroup: (groupId: string) => void;
  onBack: () => void;
  onDone: (groupIds: string[]) => void;
  onCreateNew: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <>
      <CommandGroup heading={t("Groups")}>
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          {t("Back")}
        </CommandItem>
        <CommandItem
          value="new group"
          onSelect={onCreateNew}
        >
          <PlusIcon />
          {t("New group…")}
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading={t("Toggle groups")}>
        {groups.map((group) => {
          const selected = pendingGroupIds.includes(group.id);
          return (
            <CommandItem
              key={group.id}
              value={group.name}
              onSelect={() => onToggleGroup(group.id)}
            >
              <Building2 />
              {group.name}
              {selected && <CheckIcon className="ml-auto text-primary" />}
            </CommandItem>
          );
        })}
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup>
        <CommandItem
          value="done save groups"
          onSelect={() => onDone(pendingGroupIds)}
        >
          <CheckIcon />
          {t("Done ({{count}} selected)", {
            count: pendingGroupIds.length,
          })}
        </CommandItem>
      </CommandGroup>
    </>
  );
}
