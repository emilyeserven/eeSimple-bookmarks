import { useEffect, useState } from "react";

import { DEFAULT_LOCATION_MAP_COLOR } from "@eesimple/types";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

/**
 * Swatch + native color picker for a level's map color. Edits a local copy for a live preview and
 * auto-saves on blur (when the picker closes), matching the on-change/on-blur auto-save standard. The
 * trailing reset clears back to Leaflet's default blue.
 */
export function LevelColorControl({
  color, label, onChange,
}: {
  color: string | null | undefined;
  label: string;
  onChange: (color: string | null) => void;
}) {
  const [local, setLocal] = useState(color ?? DEFAULT_LOCATION_MAP_COLOR);
  const {
    t,
  } = useTranslation();
  useEffect(() => {
    setLocal(color ?? DEFAULT_LOCATION_MAP_COLOR);
  }, [color]);

  return (
    <div className="flex items-center gap-1">
      <label
        className="
          relative inline-flex size-9 cursor-pointer items-center justify-center
          rounded-md border bg-background
        "
        title={t("Map color")}
      >
        <span
          className="size-5 rounded-sm border"
          style={{
            backgroundColor: local,
          }}
        />
        <input
          type="color"
          value={local}
          onChange={event => setLocal(event.target.value)}
          onBlur={() => {
            if ((color ?? DEFAULT_LOCATION_MAP_COLOR) !== local) onChange(local);
          }}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={t("{{label}} map color", {
            label: label || t("Level"),
          })}
        />
      </label>
      {color
        ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={t("Reset {{label}} color", {
              label: label || t("level"),
            })}
            onClick={() => onChange(null)}
          >
            <X className="size-3.5" />
          </Button>
        )
        : null}
    </div>
  );
}
