import type { Person } from "@eesimple/types";

import {
  ArrowLeftIcon,
  CheckIcon,
  PlusIcon,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

export function PeopleSubPalette({
  people,
  pendingPersonIds,
  onTogglePerson,
  onBack,
  onDone,
  onCreateNew,
}: {
  people: Person[];
  pendingPersonIds: string[];
  onTogglePerson: (personId: string) => void;
  onBack: () => void;
  onDone: (personIds: string[]) => void;
  onCreateNew: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <>
      <CommandGroup heading={t("People")}>
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          {t("Back")}
        </CommandItem>
        <CommandItem
          value="new person"
          onSelect={onCreateNew}
        >
          <PlusIcon />
          {t("New person…")}
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading={t("Toggle people")}>
        {people.map((person) => {
          const selected = pendingPersonIds.includes(person.id);
          return (
            <CommandItem
              key={person.id}
              value={person.name}
              onSelect={() => onTogglePerson(person.id)}
            >
              <UserRound />
              {person.name}
              {selected && <CheckIcon className="ml-auto text-primary" />}
            </CommandItem>
          );
        })}
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup>
        <CommandItem
          value="done save people"
          onSelect={() => onDone(pendingPersonIds)}
        >
          <CheckIcon />
          {t("Done ({{count}} selected)", {
            count: pendingPersonIds.length,
          })}
        </CommandItem>
      </CommandGroup>
    </>
  );
}
