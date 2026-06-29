import type { AdvancedSettings as AdvancedSettingsValues } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useAdvancedSettings, useUpdateAdvancedSettings } from "../hooks/useAppSettings";
import { notifyError, notifySuccess } from "../lib/notifications";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULTS: AdvancedSettingsValues = {
  coolifyLinkEnabled: false,
  coolifyUrl: "",
  docsLinkEnabled: false,
  storybookLinkEnabled: false,
  drizzleGatewayLinkEnabled: false,
  drizzleGatewayUrl: "",
  githubLinkEnabled: false,
};

/**
 * Opt-in sidebar links (Coolify, Docs, Storybook, Drizzle Gateway, GitHub). Persisted server-side
 * (the `app_settings` "advanced" group) so the choices stick across devices and browsers. Each
 * change saves on its own and fires a specific, recorded toast (no Save button): toggles save on
 * change, the URL fields save on blur. Surfaced under Settings → Display → Sidebar; the sidebar's
 * Advanced section reads the same settings to render the links.
 */
export function SidebarExternalLinksSettings() {
  const {
    data, isLoading,
  } = useAdvancedSettings();
  const update = useUpdateAdvancedSettings();
  const settings = data ?? DEFAULTS;
  // Local mirror of the Coolify URL so typing stays smooth; persisted on blur.
  const [coolifyUrl, setCoolifyUrl] = useState(settings.coolifyUrl);
  // Local mirror of the Drizzle Gateway URL so typing stays smooth; persisted on blur.
  const [drizzleGatewayUrl, setDrizzleGatewayUrl] = useState(settings.drizzleGatewayUrl);

  // Re-seed the URL fields whenever the saved settings load / change server-side.
  useEffect(() => {
    if (data) {
      setCoolifyUrl(data.coolifyUrl);
      setDrizzleGatewayUrl(data.drizzleGatewayUrl);
    }
  }, [data]);

  /** Persist a single-field change, merging the latest typed URLs, and fire the named toast. */
  function save(patch: Partial<AdvancedSettingsValues>, message: string): void {
    update.mutate({
      ...settings,
      coolifyUrl,
      drizzleGatewayUrl,
      ...patch,
    }, {
      onSuccess: () => notifySuccess(message),
      onError: error => notifyError(error.message),
    });
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Coolify link</CardTitle>
          <CardDescription>
            Show a link to your Coolify instance in the sidebar. The link opens in a new tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="coolify-link-enabled"
              checked={settings.coolifyLinkEnabled}
              onCheckedChange={(checked) => {
                const enabled = checked === true;
                save(
                  {
                    coolifyLinkEnabled: enabled,
                  },
                  enabled ? "Coolify link shown" : "Coolify link hidden",
                );
              }}
            />
            <Label htmlFor="coolify-link-enabled">Show the Coolify link in the sidebar</Label>
          </div>
          <div className="space-y-1">
            <Label htmlFor="coolify-url">Coolify URL</Label>
            <Input
              id="coolify-url"
              type="url"
              placeholder="https://coolify.example.com"
              value={coolifyUrl}
              onChange={event => setCoolifyUrl(event.target.value)}
              onBlur={() => {
                if (coolifyUrl.trim() !== settings.coolifyUrl) {
                  save({
                    coolifyUrl,
                  }, "Coolify URL updated");
                }
              }}
              className="
                w-full
                sm:w-96
              "
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Docs link</CardTitle>
          <CardDescription>
            Show a link to the Swagger/OpenAPI docs (
            <code>/docs</code>
            ) in the sidebar. Only
            reachable when the deployment has the docs enabled. The link opens in a new tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="docs-link-enabled"
              checked={settings.docsLinkEnabled}
              onCheckedChange={(checked) => {
                const enabled = checked === true;
                save(
                  {
                    docsLinkEnabled: enabled,
                  },
                  enabled ? "Docs link shown" : "Docs link hidden",
                );
              }}
            />
            <Label htmlFor="docs-link-enabled">Show the Docs link in the sidebar</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storybook link</CardTitle>
          <CardDescription>
            Show a link to the Storybook UI (
            <code>/storybook</code>
            ) in the sidebar. Only reachable
            when the deployment has the docs enabled. The link opens in a new tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="storybook-link-enabled"
              checked={settings.storybookLinkEnabled}
              onCheckedChange={(checked) => {
                const enabled = checked === true;
                save(
                  {
                    storybookLinkEnabled: enabled,
                  },
                  enabled ? "Storybook link shown" : "Storybook link hidden",
                );
              }}
            />
            <Label htmlFor="storybook-link-enabled">Show the Storybook link in the sidebar</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drizzle Gateway link</CardTitle>
          <CardDescription>
            Show a link to your Drizzle Gateway instance in the sidebar. The link opens in a new tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="drizzle-gateway-link-enabled"
              checked={settings.drizzleGatewayLinkEnabled}
              onCheckedChange={(checked) => {
                const enabled = checked === true;
                save(
                  {
                    drizzleGatewayLinkEnabled: enabled,
                  },
                  enabled ? "Drizzle Gateway link shown" : "Drizzle Gateway link hidden",
                );
              }}
            />
            <Label htmlFor="drizzle-gateway-link-enabled">Show the Drizzle Gateway link in the sidebar</Label>
          </div>
          <div className="space-y-1">
            <Label htmlFor="drizzle-gateway-url">Drizzle Gateway URL</Label>
            <Input
              id="drizzle-gateway-url"
              type="url"
              placeholder="http://localhost:4983"
              value={drizzleGatewayUrl}
              onChange={event => setDrizzleGatewayUrl(event.target.value)}
              onBlur={() => {
                if (drizzleGatewayUrl.trim() !== settings.drizzleGatewayUrl) {
                  save({
                    drizzleGatewayUrl,
                  }, "Drizzle Gateway URL updated");
                }
              }}
              className="
                w-full
                sm:w-96
              "
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GitHub link</CardTitle>
          <CardDescription>
            Show a link to the eeSimple Bookmarks GitHub repository in the sidebar. The link opens
            in a new tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="github-link-enabled"
              checked={settings.githubLinkEnabled}
              onCheckedChange={(checked) => {
                const enabled = checked === true;
                save(
                  {
                    githubLinkEnabled: enabled,
                  },
                  enabled ? "GitHub link shown" : "GitHub link hidden",
                );
              }}
            />
            <Label htmlFor="github-link-enabled">Show the GitHub link in the sidebar</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
