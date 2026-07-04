import { MAP_PIN_SCALE_MAX, MAP_PIN_SCALE_MIN } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { PlaceTypeIconsCard } from "./PlaceTypeIconsCard";
import {
  useDisplayPreferenceSettings,
  useMapPinScale,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { useLocationLevels } from "../hooks/useLocationLevels";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

/** Settings → Locations → Pin Style "Pin size": a slider controlling every map pin's display size. */
function PinSizeCard() {
  const {
    t,
  } = useTranslation();
  const pinScale = useMapPinScale();
  const {
    data: displayPrefs,
  } = useDisplayPreferenceSettings();
  const updatePrefs = useUpdateDisplayPreferenceSettings();

  function commitScale(next: number) {
    if (next === pinScale || !displayPrefs) return;
    updatePrefs.mutate({
      input: {
        ...displayPrefs,
        mapPinScale: next,
      },
      successMessage: t("Pin size updated"),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("Pin Size")}</CardTitle>
        <CardDescription>
          {t("Adjust how large every pin renders on the Locations map.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <Label
          htmlFor="map-pin-scale"
          className="text-sm font-medium"
        >
          {t("Size")}
        </Label>
        <div className="flex items-center gap-3">
          <Slider
            id="map-pin-scale"
            min={MAP_PIN_SCALE_MIN}
            max={MAP_PIN_SCALE_MAX}
            step={0.1}
            value={[pinScale]}
            onValueChange={([next]) => next !== undefined && commitScale(next)}
            className="max-w-xs"
            aria-label={t("Map pin size")}
          />
          <span className="w-12 shrink-0 text-sm text-muted-foreground">
            {Math.round(pinScale * 100)}
            %
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/** Settings → Locations → Pin Style: pin size, plus a thin data-wiring wrapper around {@link PlaceTypeIconsCard}. */
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
    <div className="space-y-4">
      <PinSizeCard />
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
    </div>
  );
}
