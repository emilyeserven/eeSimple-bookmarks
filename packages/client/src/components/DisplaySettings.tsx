import type { Theme } from "../stores/uiStore";

import { useUiStore } from "../stores/uiStore";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const THEME_LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

/** Display preferences — currently a theme switcher (light / dark / system). */
export function DisplaySettings() {
  const theme = useUiStore(state => state.theme);
  const setTheme = useUiStore(state => state.setTheme);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>
          Choose a color theme. “System” follows your operating system setting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <Label htmlFor="theme-select">Theme</Label>
        <Select
          value={theme}
          onValueChange={value => setTheme(value as Theme)}
        >
          <SelectTrigger
            id="theme-select"
            className="
              w-full
              sm:w-60
            "
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(THEME_LABELS) as Theme[]).map(value => (
              <SelectItem
                key={value}
                value={value}
              >
                {THEME_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
