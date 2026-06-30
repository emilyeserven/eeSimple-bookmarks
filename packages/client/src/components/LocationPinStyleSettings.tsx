import { PlaceTypeIconsCard } from "./PlaceTypeIconsCard";
import { useLocationLevels } from "../hooks/useLocationLevels";

/** Settings → Locations → Pin Style: thin data-wiring wrapper around {@link PlaceTypeIconsCard}. */
export function LocationPinStyleSettings() {
  const {
    groups,
    placeTypeOptions,
    placeTypeIcons,
    setPlaceTypeIcon,
    resetPlaceTypeIcons,
    placeTypeColors,
    setPlaceTypeColor,
    resetPlaceTypeColors,
  } = useLocationLevels();

  return (
    <PlaceTypeIconsCard
      options={placeTypeOptions}
      groups={groups}
      icons={placeTypeIcons}
      onSetIcon={setPlaceTypeIcon}
      onReset={resetPlaceTypeIcons}
      colors={placeTypeColors}
      onSetColor={setPlaceTypeColor}
      onResetColors={resetPlaceTypeColors}
    />
  );
}
