import { ChannelImageFetchProgressIndicator } from "@/components/ChannelImageFetchProgressIndicator";
import { ImageFetchProgressIndicator } from "@/components/ImageFetchProgressIndicator";
import { ImportProgressIndicator } from "@/components/ImportProgressIndicator";

/** The inline app-header progress indicators (image auto-capture + in-flight imports). */
export function HeaderProgressIndicators() {
  return (
    <>
      <ImageFetchProgressIndicator />
      <ChannelImageFetchProgressIndicator />
      <ImportProgressIndicator />
    </>
  );
}
