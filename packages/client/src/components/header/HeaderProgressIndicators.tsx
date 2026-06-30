import { ChannelImageFetchProgressIndicator } from "@/components/ChannelImageFetchProgressIndicator";
import { ImageFetchProgressIndicator } from "@/components/ImageFetchProgressIndicator";
import { ImportProgressIndicator } from "@/components/ImportProgressIndicator";
import { ReelArchiveProgressIndicator } from "@/components/ReelArchiveProgressIndicator";

/** The inline app-header progress indicators (image auto-capture + in-flight imports + reel archiving). */
export function HeaderProgressIndicators() {
  return (
    <>
      <ImageFetchProgressIndicator />
      <ChannelImageFetchProgressIndicator />
      <ImportProgressIndicator />
      <ReelArchiveProgressIndicator />
    </>
  );
}
