import { useTranslation } from "react-i18next";

import { LinkPreview } from "./LinkPreview";
import { useCustomStripParams, useShortenerIgnoreList } from "../hooks/useAppSettings";
import { useWebsites } from "../hooks/useWebsites";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** A link-preview tool: paste any URL to see which site it resolves to and how it would be canonicalized. */
export function CheckLinkSettings() {
  const {
    data: ignoreList = [],
  } = useShortenerIgnoreList();
  const {
    data: customStripParams = [],
  } = useCustomStripParams();
  const {
    data: websites = [],
  } = useWebsites();
  const {
    t,
  } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Check a link")}</CardTitle>
        <CardDescription>
          {t("Paste any URL to see which site it resolves to and how it would be canonicalized when saved — including verified short-link expansion and shortener nudges.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LinkPreview
          websites={websites}
          ignoreList={ignoreList}
          customStripParams={customStripParams}
          label={t("URL")}
          placeholder="https://www.youtube.com/watch?v=…"
        />
      </CardContent>
    </Card>
  );
}
