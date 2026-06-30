import { FetchProgressPopover } from "./ImageFetchProgressIndicator";
import { useBackfillChannelImagesCompletionToast, useBackfillChannelImagesStatus } from "../hooks/useYouTubeChannels";

/**
 * Header-stripe indicator for the background YouTube-channel-avatar backfill job. Renders nothing
 * when no job is running; otherwise shows a spinner + processed/total count that opens a popover
 * with details. The completion toast is fired app-wide by the mounted completion-toast hook.
 */
export function ChannelImageFetchProgressIndicator() {
  const {
    data: status,
  } = useBackfillChannelImagesStatus();
  useBackfillChannelImagesCompletionToast(status);

  if (status?.status === "running") {
    return (
      <FetchProgressPopover
        label="Fetching channel avatars"
        totalCount={status.totalCount}
        processedCount={status.processedCount}
      />
    );
  }

  return null;
}
