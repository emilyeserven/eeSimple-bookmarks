import type { CustomProperty } from "@eesimple/types";

import {
  ArrowLeftIcon,
  Ban,
  CheckIcon,
  Star,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

export function RatingSubPalette({
  prop,
  currentValue,
  onBack,
  onSelect,
}: {
  prop: CustomProperty | undefined;
  currentValue: number | null;
  onBack: () => void;
  onSelect: (value: number | null) => void;
}) {
  const {
    t,
  } = useTranslation();
  if (!prop) return null;
  const max = prop.ratingMax ?? 5;
  const allowZero = prop.ratingAllowZero ?? false;
  const options = Array.from({
    length: max,
  }, (_, i) => i + 1);
  return (
    <>
      <CommandGroup heading={prop.name}>
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          {t("Back")}
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup
        heading={t("Select {{name}}", {
          name: prop.name,
        })}
      >
        {allowZero && (
          <CommandItem
            value="No rating"
            onSelect={() => onSelect(null)}
          >
            <Ban />
            {t("No rating")}
            {currentValue === null && (
              <CheckIcon className="ml-auto text-primary" />
            )}
          </CommandItem>
        )}
        {options.map(n => (
          <CommandItem
            key={n}
            value={`${n.toString()} ${n === 1 ? "star" : "stars"}`}
            onSelect={() => onSelect(n)}
          >
            <Star />
            {"★".repeat(n)}
            {"☆".repeat(max - n)}
            {currentValue === n && <CheckIcon className="ml-auto text-primary" />}
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
}
