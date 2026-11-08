import type { Theme } from "@/stores/uiStore";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useUiStore } from "@/stores/uiStore";

const THEME_OPTIONS = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
  },
] as const satisfies readonly { value: Theme;
  label: string;
  icon: unknown; }[];

/** Light / dark / system switch — a device-local pref, so it saves instantly with no toast. */
export function ThemeToggle() {
  const {
    t,
  } = useTranslation();
  const theme = useUiStore(state => state.theme);
  const setTheme = useUiStore(state => state.setTheme);
  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={value => value && setTheme(value as Theme)}
      aria-label={t("Theme")}
    >
      {THEME_OPTIONS.map(option => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={t(option.label)}
        >
          <option.icon />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
