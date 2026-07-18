import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useAutomationSettingsForm, usePersonSourceLabelSettingsForm } from "../hooks/useAppSettings";
import { useCategories } from "../hooks/useCategories";
import { sortFavoritesFirst } from "../lib/favoritesOrder";
import { CategoryIcon } from "../lib/icons";

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

/**
 * Automation preferences for auto-fetching bookmark metadata. Persisted server-side (the
 * `app_settings` singleton) so the choices stick across devices, and each change fires a recorded
 * toast. The open-in-drawer modifier lives in the same server group but is edited on the Drawer page.
 */
export function AutomationsSettings() {
  const {
    t,
  } = useTranslation();
  const {
    settings, save,
  } = useAutomationSettingsForm();
  const {
    data: categories = [],
  } = useCategories();
  const defaultCategoryCreate = useEntityCreateOption("category", category =>
    save({
      defaultCategoryId: category.id,
    }, t("Default category updated")));
  const {
    settings: personSourceLabels, save: savePersonSourceLabels,
  } = usePersonSourceLabelSettingsForm();
  const [websiteLabel, setWebsiteLabel] = useState(personSourceLabels.websiteLabel);
  const [biographyLabel, setBiographyLabel] = useState(personSourceLabels.biographyLabel);

  useEffect(() => {
    setWebsiteLabel(personSourceLabels.websiteLabel);
  }, [personSourceLabels.websiteLabel]);
  useEffect(() => {
    setBiographyLabel(personSourceLabels.biographyLabel);
  }, [personSourceLabels.biographyLabel]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("Default category")}</CardTitle>
          <CardDescription>
            {t("The category new bookmarks land in when none is chosen. Leave unset to use the built-in \"Default\" category.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Combobox
            aria-label={t("Default category")}
            options={sortFavoritesFirst(categories).map(category => ({
              value: category.id,
              label: category.name,
              names: category.names,
              isFavorite: category.isFavorite,
              icon: (
                <CategoryIcon
                  name={category.icon}
                  className="size-4 shrink-0"
                />
              ),
            }))}
            value={settings.defaultCategoryId || undefined}
            placeholder={t("Built-in Default category")}
            searchPlaceholder={t("Search categories…")}
            emptyText={t("No categories found.")}
            createOption={defaultCategoryCreate.createOption}
            onValueChange={(value) => {
              save(
                {
                  defaultCategoryId: value || null,
                },
                t("Default category updated"),
              );
            }}
          />
        </CardContent>
      </Card>
      {defaultCategoryCreate.modal}
      <Card>
        <CardHeader>
          <CardTitle>{t("Auto-fetch title")}</CardTitle>
          <CardDescription>
            {t("When enabled, leaving the URL field while adding a bookmark fetches the page’s title automatically. You can always fetch it manually with the button next to the Name field.")}
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
                  enabled ? t("Auto-fetch title on") : t("Auto-fetch title off"),
                );
              }}
            />
            <Label htmlFor="auto-fetch-title">{t("Fetch the title when the URL field loses focus")}</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Fetch images by default")}</CardTitle>
          <CardDescription>
            {t("When enabled, the Images section of the Add Bookmark form is collapsed by default — the page’s preview image will be fetched automatically when you save. Disable to always show the Images section expanded.")}
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
                  enabled ? t("Auto-fetch image on") : t("Auto-fetch image off"),
                );
              }}
            />
            <Label htmlFor="auto-fetch-image">{t("Fetch the image when a bookmark is saved")}</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Shared links skip the Inbox")}</CardTitle>
          <CardDescription>
            {t("When enabled, links sent from the Android share sheet are added directly as bookmarks instead of waiting in the Inbox for review. The browser extension always offers both options with its own buttons.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="share-bypass-inbox"
              checked={settings.shareBypassInbox}
              onCheckedChange={(checked) => {
                const enabled = checked === true;
                save(
                  {
                    shareBypassInbox: enabled,
                  },
                  enabled ? t("Shared links skip the Inbox") : t("Shared links go to the Inbox"),
                );
              }}
            />
            <Label htmlFor="share-bypass-inbox">{t("Add shared links directly as bookmarks")}</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Person source-link matching")}</CardTitle>
          <CardDescription>
            {t("Which label on a Person’s linked websites is treated as their primary website / biography link — used when auto-fetching an avatar or detecting social links. Matching is case-insensitive.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="person-website-label">{t("Website label")}</Label>
            <Input
              id="person-website-label"
              value={websiteLabel}
              onChange={e => setWebsiteLabel(e.target.value)}
              onBlur={() => {
                const trimmed = websiteLabel.trim() || personSourceLabels.websiteLabel;
                setWebsiteLabel(trimmed);
                if (trimmed === personSourceLabels.websiteLabel) return;
                savePersonSourceLabels(
                  {
                    websiteLabel: trimmed,
                  },
                  t("Person website label"),
                );
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="person-biography-label">{t("Biography label")}</Label>
            <Input
              id="person-biography-label"
              value={biographyLabel}
              onChange={e => setBiographyLabel(e.target.value)}
              onBlur={() => {
                const trimmed = biographyLabel.trim() || personSourceLabels.biographyLabel;
                setBiographyLabel(trimmed);
                if (trimmed === personSourceLabels.biographyLabel) return;
                savePersonSourceLabels(
                  {
                    biographyLabel: trimmed,
                  },
                  t("Person biography label"),
                );
              }}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
