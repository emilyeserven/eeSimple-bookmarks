import type { FlatNode } from "@/lib/tagTree";
import type { MediaTypeNode } from "@eesimple/types";

import {
  ArrowLeftIcon,
  Ban,
  CheckIcon,
  Clapperboard,
  PlusIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

export function MediaTypeSubPalette({
  flatMediaTypes,
  currentMediaTypeId,
  onBack,
  onSelect,
  onCreateNew,
}: {
  flatMediaTypes: FlatNode<MediaTypeNode>[];
  currentMediaTypeId: string | null | undefined;
  onBack: () => void;
  onSelect: (mediaTypeId: string | null) => void;
  onCreateNew: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <>
      <CommandGroup heading={t("Media Type")}>
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          {t("Back")}
        </CommandItem>
        <CommandItem
          value="new media type"
          onSelect={onCreateNew}
        >
          <PlusIcon />
          {t("New media type…")}
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading={t("Select media type")}>
        <CommandItem
          value="None"
          onSelect={() => onSelect(null)}
        >
          <Ban />
          {t("None")}
          {currentMediaTypeId == null && (
            <CheckIcon className="ml-auto text-primary" />
          )}
        </CommandItem>
        {flatMediaTypes.map(({
          node: mt, depth,
        }) => (
          <CommandItem
            key={mt.id}
            value={mt.name}
            onSelect={() => onSelect(mt.id)}
          >
            <Clapperboard />
            <span
              style={{
                paddingLeft: depth > 0 ? `${depth}rem` : undefined,
              }}
            >
              {mt.name}
            </span>
            {currentMediaTypeId === mt.id && (
              <CheckIcon className="ml-auto text-primary" />
            )}
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
}
