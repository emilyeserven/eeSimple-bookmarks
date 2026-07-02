import type { AutomationSettings } from "@eesimple/types";

import { useAutomationSettings, useUpdateAutomationSettings } from "../hooks/useAppSettings";
import { useBackfillTitleLocations, useBackfillTitleTags } from "../hooks/useBookmarks";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const DEFAULTS: AutomationSettings = {
  autoFetchTitle: true,
  autoFetchImage: true,
  autoApplyTitleTags: false,
  autoApplyTitleLocations: false,
  sidebarOpenModifier: "alt",
};

/** Shared by both title-backfill cards: persist a single automation-settings field + named toast. */
function useSaveAutomationSetting() {
  const {
    data,
  } = useAutomationSettings();
  const update = useUpdateAutomationSettings();
  const settings = data ?? DEFAULTS;

  function save(patch: Partial<AutomationSettings>, message: string): void {
    update.mutate({
      input: {
        ...settings,
        ...patch,
      },
      successMessage: message,
    });
  }

  return {
    settings,
    save,
  };
}

export function TitleTagBackfillCard() {
  const {
    settings, save,
  } = useSaveAutomationSetting();
  const backfillTags = useBackfillTitleTags();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-tag from title</CardTitle>
        <CardDescription>
          When enabled, saving a bookmark whose title contains an existing tag’s name automatically
          applies that tag. Matching is case-insensitive and only counts whole words, so a tag named
          “art” won’t match “Martin”.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Checkbox
            id="auto-apply-title-tags"
            checked={settings.autoApplyTitleTags}
            onCheckedChange={(checked) => {
              const enabled = checked === true;
              save(
                {
                  autoApplyTitleTags: enabled,
                },
                enabled ? "Auto-tag from title on" : "Auto-tag from title off",
              );
            }}
          />
          <Label htmlFor="auto-apply-title-tags">
            Apply tags whose name appears in the bookmark title
          </Label>
        </div>
        <div className="mt-4 flex flex-col items-start gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={backfillTags.isPending}
            onClick={() => backfillTags.mutate()}
          >
            {backfillTags.isPending ? "Backfilling…" : "Backfill existing bookmarks"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Scan every existing bookmark now and apply any tags whose name appears in its title.
            Existing tags are kept — this only adds matches.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function TitleLocationBackfillCard() {
  const {
    settings, save,
  } = useSaveAutomationSetting();
  const backfillLocations = useBackfillTitleLocations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-apply locations from title</CardTitle>
        <CardDescription>
          When enabled, saving a bookmark whose title contains an existing location’s name
          automatically applies that location. Matching is case-insensitive and only counts whole
          words.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Checkbox
            id="auto-apply-title-locations"
            checked={settings.autoApplyTitleLocations}
            onCheckedChange={(checked) => {
              const enabled = checked === true;
              save(
                {
                  autoApplyTitleLocations: enabled,
                },
                enabled ? "Auto-apply locations from title on" : "Auto-apply locations from title off",
              );
            }}
          />
          <Label htmlFor="auto-apply-title-locations">
            Apply locations whose name appears in the bookmark title
          </Label>
        </div>
        <div className="mt-4 flex flex-col items-start gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={backfillLocations.isPending}
            onClick={() => backfillLocations.mutate()}
          >
            {backfillLocations.isPending ? "Backfilling…" : "Backfill existing bookmarks"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Scan every existing bookmark now and apply any locations whose name appears in its
            title. Existing locations are kept — this only adds matches.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
