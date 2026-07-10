import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ScanCacheStatsCard } from "./ScanCacheStatsCard";
import { ScanPipelineNodeList } from "./ScanPipelineNodeList";
import { ScanPipelineRegistriesCard } from "./ScanPipelineRegistriesCard";
import { useScanPipeline } from "../hooks/useScanPipeline";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * The Settings → Advanced → Scan Pipeline panel: a view-only visualization of the server's
 * `GET /api/scan` pipeline. The description, gate states, registries, and cache stats all come from
 * `GET /api/scan-pipeline` — nothing here mirrors server behavior statically. Stage/branch/chain
 * text is server-authored data and renders as-is; only the page chrome goes through i18n.
 */
export function ScanPipelineSettings() {
  const {
    t,
  } = useTranslation();
  const {
    data, isLoading, isError, error, isFetching, refetch,
  } = useScanPipeline();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Pipeline stages")}</CardTitle>
          <CardDescription>
            {t(
              "Each step a scanned URL goes through, in order. Expand a step for details; badges show whether a step is active, inactive, or depends on the URL being scanned.",
            )}
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              <RefreshCw
                className={`
                  size-4
                  ${isFetching ? "animate-spin" : ""}
                `}
              />
              {isFetching ? t("Refreshing…") : t("Refresh")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading
            ? <p className="text-sm text-muted-foreground">{t("Loading…")}</p>
            : isError
              ? (
                <p className="text-sm text-muted-foreground">
                  {t("Couldn't load the scan pipeline: {{message}}", {
                    message: error.message,
                  })}
                </p>
              )
              : data && <ScanPipelineNodeList nodes={data.description.nodes} />}
        </CardContent>
      </Card>
      {data && (
        <>
          <ScanCacheStatsCard cache={data.cache} />
          <ScanPipelineRegistriesCard registries={data.registries} />
        </>
      )}
    </div>
  );
}
