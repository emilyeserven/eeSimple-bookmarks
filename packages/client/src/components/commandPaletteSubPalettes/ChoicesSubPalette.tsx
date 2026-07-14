import type { CustomProperty } from "@eesimple/types";

import {
  ArrowLeftIcon,
  CheckIcon,
  Circle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

export function ChoicesSubPalette({
  prop,
  pendingValues,
  onToggleValue,
  onBack,
  onSelectSingle,
  onDoneMultiple,
}: {
  prop: CustomProperty | undefined;
  pendingValues: string[];
  onToggleValue: (value: string) => void;
  onBack: () => void;
  onSelectSingle: (value: string) => void;
  onDoneMultiple: (values: string[]) => void;
}) {
  const {
    t,
  } = useTranslation();
  if (!prop) return null;
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
        {prop.choicesItems.map((item) => {
          const selected = pendingValues.includes(item.value);
          return (
            <CommandItem
              key={item.value}
              value={item.label}
              onSelect={() => {
                if (prop.choicesMultiple) {
                  onToggleValue(item.value);
                }
                else {
                  onSelectSingle(item.value);
                }
              }}
            >
              <Circle />
              {item.label}
              {selected && <CheckIcon className="ml-auto text-primary" />}
            </CommandItem>
          );
        })}
      </CommandGroup>
      {prop.choicesMultiple && (
        <>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem
              value="done save choices"
              onSelect={() => onDoneMultiple(pendingValues)}
            >
              <CheckIcon />
              {t("Done ({{count}} selected)", {
                count: pendingValues.length,
              })}
            </CommandItem>
          </CommandGroup>
        </>
      )}
    </>
  );
}
