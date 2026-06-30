import { PlaceTypesCard } from "./PlaceTypesCard";
import { useLocationLevels } from "../hooks/useLocationLevels";

/** Settings → Locations → Place Types: thin data-wiring wrapper around {@link PlaceTypesCard}. */
export function LocationPlaceTypesSettings() {
  const {
    groups,
  } = useLocationLevels();

  return <PlaceTypesCard groups={groups} />;
}
