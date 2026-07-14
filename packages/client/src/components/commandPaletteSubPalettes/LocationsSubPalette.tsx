import type { FlatNode } from "@/lib/tagTree";
import type { LocationNode } from "@eesimple/types";

import {
  ArrowLeftIcon,
  CheckIcon,
  MapPin,
  PlusIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "../LocalizedNameLabel";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

export function LocationsSubPalette({
  flatLocations,
  pendingLocationIds,
  onToggleLocation,
  onBack,
  onDone,
  onCreateNew,
}: {
  flatLocations: FlatNode<LocationNode>[];
  pendingLocationIds: string[];
  onToggleLocation: (locationId: string) => void;
  onBack: () => void;
  onDone: (locationIds: string[]) => void;
  onCreateNew: () => void;
}) {
  const {
    t,
  } = useTranslation();
  const renderLocationItem = ({
    node: location, depth,
  }: FlatNode<LocationNode>) => {
    const selected = pendingLocationIds.includes(location.id);
    return (
      <CommandItem
        key={location.id}
        value={`${location.name} ${(location.names ?? []).map(n => n.value).join(" ")}`.trim()}
        onSelect={() => onToggleLocation(location.id)}
      >
        <MapPin />
        <span
          style={{
            paddingLeft: depth > 0 ? `${depth}rem` : undefined,
          }}
        >
          <LocalizedNameLabel
            names={location.names ?? []}
            base={location.name}
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
      <CommandGroup heading={t("Locations")}>
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          {t("Back")}
        </CommandItem>
        <CommandItem
          value="new location"
          onSelect={onCreateNew}
        >
          <PlusIcon />
          {t("New location…")}
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading={t("Toggle locations")}>
        {flatLocations.map(renderLocationItem)}
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup>
        <CommandItem
          value="done save locations"
          onSelect={() => onDone(pendingLocationIds)}
        >
          <CheckIcon />
          {t("Done ({{count}} selected)", {
            count: pendingLocationIds.length,
          })}
        </CommandItem>
      </CommandGroup>
    </>
  );
}
