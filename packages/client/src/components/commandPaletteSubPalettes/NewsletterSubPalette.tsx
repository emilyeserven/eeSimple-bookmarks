import type { Newsletter } from "@eesimple/types";

import {
  ArrowLeftIcon,
  Ban,
  CheckIcon,
  Mail,
  PlusIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

export function NewsletterSubPalette({
  newsletters,
  currentNewsletterId,
  onBack,
  onSelect,
  onCreateNew,
}: {
  newsletters: Newsletter[];
  currentNewsletterId: string | null | undefined;
  onBack: () => void;
  onSelect: (newsletterId: string | null) => void;
  onCreateNew: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <>
      <CommandGroup heading={t("Newsletter")}>
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          {t("Back")}
        </CommandItem>
        <CommandItem
          value="new newsletter"
          onSelect={onCreateNew}
        >
          <PlusIcon />
          {t("New newsletter…")}
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading={t("Select newsletter")}>
        <CommandItem
          value="None"
          onSelect={() => onSelect(null)}
        >
          <Ban />
          {t("None")}
          {currentNewsletterId == null && (
            <CheckIcon className="ml-auto text-primary" />
          )}
        </CommandItem>
        {newsletters.map(nl => (
          <CommandItem
            key={nl.id}
            value={nl.name}
            onSelect={() => onSelect(nl.id)}
          >
            <Mail />
            {nl.name}
            {currentNewsletterId === nl.id && (
              <CheckIcon className="ml-auto text-primary" />
            )}
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
}
