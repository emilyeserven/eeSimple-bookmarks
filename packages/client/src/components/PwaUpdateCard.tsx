import { useTranslation } from "react-i18next";

import { usePwaUpdate } from "../hooks/usePwaUpdate";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * App-update controls for the installed PWA: force this device to check for a new version, see when
 * it last checked, and apply a waiting update. Mirrors the Card layout used by the other Advanced
 * settings sections. The check + timestamp are device-local (see `usePwaUpdate`).
 */
export function PwaUpdateCard() {
  const {
    t,
  } = useTranslation();
  const {
    updateAvailable, checking, lastChecked, lastUpdated, checkForUpdate, applyUpdate,
  } = usePwaUpdate();

  async function handleCheck(): Promise<void> {
    try {
      const outcome = await checkForUpdate();
      if (outcome === "updating") notifySuccess(t("Updating to the latest version…"));
      else if (outcome === "up-to-date") notifySuccess(t("You're already on the latest version."));
      else notifyError(t("App updates aren't available in this browser."));
    }
    catch (error) {
      notifyError(error instanceof Error ? error.message : t("Update check failed"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>App updates</CardTitle>
        <CardDescription>
          Force this device to check for a new version of the installed app and apply it. Updates
          normally install automatically; use this to update right away.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Last checked:
          {" "}
          <span className="font-medium text-foreground">
            {lastChecked === null ? "Never" : new Date(lastChecked).toLocaleString()}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Last updated:
          {" "}
          <span className="font-medium text-foreground">
            {lastUpdated === null ? "Never" : new Date(lastUpdated).toLocaleString()}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCheck}
            disabled={checking}
          >
            {checking ? "Checking…" : "Check for updates"}
          </Button>
          {updateAvailable && (
            <Button
              type="button"
              onClick={applyUpdate}
            >
              Update now
            </Button>
          )}
        </div>
        {updateAvailable && (
          <p className="text-sm text-muted-foreground">
            A new version is available. Click “Update now” to reload with the latest version.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
