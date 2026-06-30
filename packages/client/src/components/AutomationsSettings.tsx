import type { AutomationSettings } from "@eesimple/types";

import { useAutomationSettings, useUpdateAutomationSettings } from "../hooks/useAppSettings";
import { notifyError, notifySuccess } from "../lib/notifications";

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

/**
 * Automation preferences for auto-fetching bookmark metadata. Persisted server-side (the
 * `app_settings` singleton) so the choices stick across devices, and each change fires a recorded
 * toast. The open-in-drawer modifier lives in the same server group but is edited on the Drawer page.
 */
export function AutomationsSettings() {
  const {
    data,
  } = useAutomationSettings();
  const update = useUpdateAutomationSettings();
  const settings = data ?? DEFAULTS;

  /** Persist a single-field change and fire the named toast. */
  function save(patch: Partial<AutomationSettings>, message: string): void {
    update.mutate({
      ...settings,
      ...patch,
    }, {
      onSuccess: () => notifySuccess(message),
      onError: error => notifyError(error.message),
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Auto-fetch title</CardTitle>
          <CardDescription>
            When enabled, leaving the URL field while adding a bookmark fetches the page’s title
            automatically. You can always fetch it manually with the button next to the Name field.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-fetch-title"
              checked={settings.autoFetchTitle}
              onCheckedChange={(checked) => {
                const enabled = checked === true;
                save(
                  {
                    autoFetchTitle: enabled,
                  },
                  enabled ? "Auto-fetch title on" : "Auto-fetch title off",
                );
              }}
            />
            <Label htmlFor="auto-fetch-title">Fetch the title when the URL field loses focus</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fetch images by default</CardTitle>
          <CardDescription>
            When enabled, the Images section of the Add Bookmark form is collapsed by default — the
            page’s preview image will be fetched automatically when you save. Disable to always show
            the Images section expanded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-fetch-image"
              checked={settings.autoFetchImage}
              onCheckedChange={(checked) => {
                const enabled = checked === true;
                save(
                  {
                    autoFetchImage: enabled,
                  },
                  enabled ? "Auto-fetch image on" : "Auto-fetch image off",
                );
              }}
            />
            <Label htmlFor="auto-fetch-image">Fetch the image when a bookmark is saved</Label>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
