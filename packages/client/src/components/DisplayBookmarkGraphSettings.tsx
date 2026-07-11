import type { BookmarkGraphSettings, BookmarkGraphWeight, BookmarkGraphWeights } from "@eesimple/types";
import type { LucideIcon } from "lucide-react";

import { DEFAULT_BOOKMARK_GRAPH_SETTINGS } from "@eesimple/types";
import {
  Clapperboard,
  Drama,
  FolderOpen,
  Globe,
  MonitorPlay,
  Tags,
  Users,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { SegmentedToggleRow } from "./SegmentedToggleRow";
import { useBookmarkGraphSettings, useUpdateBookmarkGraphSettings } from "../hooks/useAppSettings";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** The weighted relatedness dimensions, in display order, each with a label + hint + icon. */
const DIMENSIONS: readonly { key: keyof BookmarkGraphWeights;
  label: string;
  hint: string;
  icon: LucideIcon; }[] = [
  {
    key: "tags",
    label: "Shared tags",
    hint: "Bookmarks that share one or more tags.",
    icon: Tags,
  },
  {
    key: "category",
    label: "Same category",
    hint: "Bookmarks in the same category.",
    icon: FolderOpen,
  },
  {
    key: "mediaType",
    label: "Same media type",
    hint: "Bookmarks of the same media type.",
    icon: Clapperboard,
  },
  {
    key: "genreMoods",
    label: "Shared genres & moods",
    hint: "Bookmarks that share a genre or mood.",
    icon: Drama,
  },
  {
    key: "people",
    label: "Shared people",
    hint: "Bookmarks crediting the same people.",
    icon: UserRound,
  },
  {
    key: "groups",
    label: "Shared groups",
    hint: "Bookmarks crediting the same groups.",
    icon: Users,
  },
  {
    key: "website",
    label: "Same website",
    hint: "Bookmarks from the same website.",
    icon: Globe,
  },
  {
    key: "youtubeChannel",
    label: "Same YouTube channel",
    hint: "Bookmarks from the same channel.",
    icon: MonitorPlay,
  },
];

/** A relatedness weight rendered as a segmented-control string value. */
type WeightValue = "0" | "1" | "2" | "3";

function toWeight(value: string): BookmarkGraphWeight {
  return value === "1" || value === "2" || value === "3" ? Number(value) as BookmarkGraphWeight : 0;
}

/**
 * Settings → Display → Bookmark Graph: the per-dimension relatedness weights + the number of related
 * cards shown, backing the "Related bookmarks" section and the Graph tab on a bookmark's View page.
 * Persisted server-side (the `app_settings` singleton) so the choices stick across devices; each
 * change fires a recorded toast.
 */
export function DisplayBookmarkGraphSettings() {
  const {
    t,
  } = useTranslation();
  const {
    data,
  } = useBookmarkGraphSettings();
  const update = useUpdateBookmarkGraphSettings();
  const settings: BookmarkGraphSettings = data ?? DEFAULT_BOOKMARK_GRAPH_SETTINGS;

  const weightOptions = [
    {
      value: "0",
      label: t("Off"),
    },
    {
      value: "1",
      label: t("Low"),
    },
    {
      value: "2",
      label: t("Medium"),
    },
    {
      value: "3",
      label: t("High"),
    },
  ] as const satisfies readonly { value: WeightValue;
    label: string; }[];

  /** Persist one dimension's weight; the hook fires the field-named toast. */
  function saveWeight(key: keyof BookmarkGraphWeights, label: string, weight: BookmarkGraphWeight): void {
    update.mutate({
      input: {
        ...settings,
        weights: {
          ...settings.weights,
          [key]: weight,
        },
      },
      successMessage: t("{{field}} weight saved", {
        field: label,
      }),
    });
  }

  /** Persist the max-related count from the input's current value, clamped to 1–100. */
  function saveMaxRelated(raw: string): void {
    const parsed = Number.parseInt(raw, 10);
    const next = Number.isNaN(parsed) ? settings.maxRelated : Math.min(100, Math.max(1, parsed));
    if (next === settings.maxRelated) return;
    update.mutate({
      input: {
        ...settings,
        maxRelated: next,
      },
      successMessage: t("Number of related bookmarks saved"),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t("Bookmark Graph")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Choose how the “Related bookmarks” list and the Graph tab on a bookmark decide which bookmarks are related. A candidate’s relatedness is the sum of the weights below for everything it shares with the bookmark you’re viewing.")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("Relatedness weights")}</CardTitle>
          <CardDescription>
            {t("Give each dimension more or less influence. Set a dimension to Off to ignore it.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DIMENSIONS.map(({
            key, label, hint, icon: Icon,
          }) => (
            <SegmentedToggleRow
              key={key}
              label={t(label)}
              hint={t(hint)}
              icon={<Icon className="size-3.5 shrink-0 text-muted-foreground" />}
              options={weightOptions}
              value={String(settings.weights[key])}
              onChange={value => saveWeight(key, t(label), toWeight(value))}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Number of related bookmarks")}</CardTitle>
          <CardDescription>
            {t("The maximum number of related bookmark cards to show (1–100).")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="bookmark-graph-max"
              className="text-sm"
            >{t("Show up to")}
            </Label>
            <Input
              id="bookmark-graph-max"
              key={settings.maxRelated}
              type="number"
              min={1}
              max={100}
              defaultValue={settings.maxRelated}
              className="w-24"
              onBlur={event => saveMaxRelated(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
