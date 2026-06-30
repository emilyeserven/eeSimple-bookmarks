import { Link } from "@tanstack/react-router";
import { Download, Sparkles } from "lucide-react";

import { useAutoFetchImages, useAutoFetchStatus, useAutoFetchWithFallback, useAutoFetchWithFallbackStatus, useGallery } from "../hooks/useGallery";
import { useBackfillChannelImages, useBackfillChannelImagesStatus, useMissingChannelImageCount } from "../hooks/useYouTubeChannels";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ChannelImageBackfillCard() {
  const {
    data, isLoading,
  } = useMissingChannelImageCount();
  const missingCount = data?.count ?? 0;
  const backfillChannelImages = useBackfillChannelImages();
  const {
    data: channelImageStatus,
  } = useBackfillChannelImagesStatus();
  const channelImagesRunning = channelImageStatus?.status === "running";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backfill YouTube channel images</CardTitle>
        <CardDescription>
          Fetch a channel avatar (from its public channel page) for every YouTube channel that
          doesn’t have one yet. Runs as a background job, batched to avoid YouTube rate-limiting —
          progress shows in the header while it runs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={backfillChannelImages.isPending || channelImagesRunning || isLoading || !missingCount}
            onClick={() => backfillChannelImages.mutate()}
          >
            <Sparkles className="size-4" />
            {channelImagesRunning ? "Fetching…" : "Queue missing channel avatars"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Checking for missing avatars…"
              : missingCount
                ? `${missingCount} channel${missingCount === 1 ? "" : "s"} missing an avatar.`
                : "Every channel already has an avatar."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function BookmarkImageBackfillCard() {
  const {
    data: catalog,
  } = useGallery();
  const autoFetch = useAutoFetchImages();
  const {
    data: autoFetchStatus,
  } = useAutoFetchStatus();
  const autoFetchRunning = autoFetchStatus?.status === "running";
  const autoFetchWithFallback = useAutoFetchWithFallback();
  const {
    data: autoFetchWithFallbackStatus,
  } = useAutoFetchWithFallbackStatus();
  const autoFetchWithFallbackRunning = autoFetchWithFallbackStatus?.status === "running";
  const eitherJobRunning = autoFetchRunning || autoFetchWithFallbackRunning;
  const pendingAutoFetchCount = catalog?.pendingAutoFetchCount ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backfill bookmark images</CardTitle>
        <CardDescription>
          Fetch a page preview image for every bookmark that doesn’t have one yet. The same job as
          on the
          {" "}
          <Link
            to="/settings/advanced/manage-media"
            className="underline underline-offset-2"
          >
            Manage Media
          </Link>
          {" "}
          page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start gap-2">
          {pendingAutoFetchCount > 0
            ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={autoFetch.isPending || eitherJobRunning}
                  onClick={() => autoFetch.mutate()}
                >
                  <Download className="size-4" />
                  {autoFetchRunning ? "Fetching…" : "Fetch missing images"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={autoFetchWithFallback.isPending || eitherJobRunning}
                  onClick={() => autoFetchWithFallback.mutate()}
                >
                  <Download className="size-4" />
                  {autoFetchWithFallbackRunning ? "Fetching…" : "Fetch missing images (screenshot fallback)"}
                </Button>
              </div>
            )
            : null}
          <p className="text-sm text-muted-foreground">
            {pendingAutoFetchCount > 0
              ? `${pendingAutoFetchCount} bookmark${pendingAutoFetchCount === 1 ? "" : "s"} missing an image.`
              : "Every bookmark already has an image."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
