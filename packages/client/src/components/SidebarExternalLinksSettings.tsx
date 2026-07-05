import type { AdvancedSettings as AdvancedSettingsValues } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { SegmentedToggleRow } from "./SegmentedToggleRow";
import { useAdvancedSettings, useUpdateAdvancedSettings } from "../hooks/useAppSettings";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const DEFAULTS: AdvancedSettingsValues = {
  coolifyLinkEnabled: false,
  coolifyUrl: "",
  docsLinkEnabled: false,
  storybookLinkEnabled: false,
  drizzleGatewayLinkEnabled: false,
  drizzleGatewayUrl: "",
  githubLinkEnabled: false,
};

type LinkMode = "visible" | "hidden";

/** The two Show/Hide options shared by every row in this section. */
function useLinkModeOptions(): { value: LinkMode;
  label: string; }[] {
  const {
    t,
  } = useTranslation();
  return [
    {
      value: "visible",
      label: t("Show"),
    },
    {
      value: "hidden",
      label: t("Hide"),
    },
  ];
}

/**
 * Opt-in sidebar links (Coolify, Docs, Storybook, Drizzle Gateway, GitHub). Persisted server-side
 * (the `app_settings` "advanced" group) so the choices stick across devices and browsers. Each
 * change saves on its own and fires a specific, recorded toast (no Save button): toggles save on
 * change, the URL fields save on blur. Surfaced under Settings → Display → Sidebar; the sidebar's
 * Advanced section reads the same settings to render the links.
 */
export function SidebarExternalLinksSettings() {
  const {
    t,
  } = useTranslation();
  const {
    data, isLoading,
  } = useAdvancedSettings();
  const update = useUpdateAdvancedSettings();
  const settings = data ?? DEFAULTS;
  const options = useLinkModeOptions();
  // Local mirror of the Coolify URL so typing stays smooth; persisted on blur.
  const [coolifyUrl, setCoolifyUrl] = useState(settings.coolifyUrl);
  // Local mirror of the Drizzle Gateway URL so typing stays smooth; persisted on blur.
  const [drizzleGatewayUrl, setDrizzleGatewayUrl] = useState(settings.drizzleGatewayUrl);
  // Whether the URL input is revealed — collapsed by default, expanded on request or when the
  // link is shown with no URL set yet.
  const [coolifyUrlExpanded, setCoolifyUrlExpanded] = useState(false);
  const [drizzleGatewayUrlExpanded, setDrizzleGatewayUrlExpanded] = useState(false);

  // Re-seed the URL fields whenever the saved settings load / change server-side.
  useEffect(() => {
    if (data) {
      setCoolifyUrl(data.coolifyUrl);
      setDrizzleGatewayUrl(data.drizzleGatewayUrl);
    }
  }, [data]);

  // Force the URL field open when its link is shown but no URL has been provided yet.
  useEffect(() => {
    if (settings.coolifyLinkEnabled && settings.coolifyUrl.trim() === "") {
      setCoolifyUrlExpanded(true);
    }
  }, [settings.coolifyLinkEnabled, settings.coolifyUrl]);
  useEffect(() => {
    if (settings.drizzleGatewayLinkEnabled && settings.drizzleGatewayUrl.trim() === "") {
      setDrizzleGatewayUrlExpanded(true);
    }
  }, [settings.drizzleGatewayLinkEnabled, settings.drizzleGatewayUrl]);

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
    <Card>
      <CardHeader>
        <CardTitle>{t("Advanced Links")}</CardTitle>
        <CardDescription>
          {t("Opt-in links shown in the sidebar’s Advanced section. Each opens in a new tab.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <SegmentedToggleRow
            label={t("Coolify link")}
            hint={t("Show a link to your Coolify instance in the sidebar.")}
            options={options}
            value={settings.coolifyLinkEnabled ? "visible" : "hidden"}
            onChange={(mode) => {
              const enabled = mode === "visible";
              save(
                {
                  coolifyLinkEnabled: enabled,
                },
                enabled ? t("Coolify link shown") : t("Coolify link hidden"),
              );
            }}
          />
          {coolifyUrlExpanded
            ? (
              <div className="space-y-1">
                <Label htmlFor="coolify-url">{t("Coolify URL")}</Label>
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
                      }, t("Coolify URL updated"));
                    }
                  }}
                  className="
                    w-full
                    sm:w-96
                  "
                />
              </div>
            )
            : (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => setCoolifyUrlExpanded(true)}
              >
                {t("Set URL")}
              </Button>
            )}
        </div>

        <Separator />

        <SegmentedToggleRow
          label={t("Docs link")}
          hint={t("Show a link to the Swagger/OpenAPI docs in the sidebar.")}
          options={options}
          value={settings.docsLinkEnabled ? "visible" : "hidden"}
          onChange={(mode) => {
            const enabled = mode === "visible";
            save(
              {
                docsLinkEnabled: enabled,
              },
              enabled ? t("Docs link shown") : t("Docs link hidden"),
            );
          }}
        />

        <Separator />

        <SegmentedToggleRow
          label={t("Storybook link")}
          hint={t("Show a link to the Storybook UI in the sidebar.")}
          options={options}
          value={settings.storybookLinkEnabled ? "visible" : "hidden"}
          onChange={(mode) => {
            const enabled = mode === "visible";
            save(
              {
                storybookLinkEnabled: enabled,
              },
              enabled ? t("Storybook link shown") : t("Storybook link hidden"),
            );
          }}
        />

        <Separator />

        <div className="space-y-2">
          <SegmentedToggleRow
            label={t("Drizzle Gateway link")}
            hint={t("Show a link to your Drizzle Gateway instance in the sidebar.")}
            options={options}
            value={settings.drizzleGatewayLinkEnabled ? "visible" : "hidden"}
            onChange={(mode) => {
              const enabled = mode === "visible";
              save(
                {
                  drizzleGatewayLinkEnabled: enabled,
                },
                enabled ? t("Drizzle Gateway link shown") : t("Drizzle Gateway link hidden"),
              );
            }}
          />
          {drizzleGatewayUrlExpanded
            ? (
              <div className="space-y-1">
                <Label htmlFor="drizzle-gateway-url">{t("Drizzle Gateway URL")}</Label>
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
                      }, t("Drizzle Gateway URL updated"));
                    }
                  }}
                  className="
                    w-full
                    sm:w-96
                  "
                />
              </div>
            )
            : (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => setDrizzleGatewayUrlExpanded(true)}
              >
                {t("Set URL")}
              </Button>
            )}
        </div>

        <Separator />

        <SegmentedToggleRow
          label={t("GitHub link")}
          hint={t("Show a link to the eeSimple Bookmarks GitHub repository in the sidebar.")}
          options={options}
          value={settings.githubLinkEnabled ? "visible" : "hidden"}
          onChange={(mode) => {
            const enabled = mode === "visible";
            save(
              {
                githubLinkEnabled: enabled,
              },
              enabled ? t("GitHub link shown") : t("GitHub link hidden"),
            );
          }}
        />
      </CardContent>
    </Card>
  );
}
