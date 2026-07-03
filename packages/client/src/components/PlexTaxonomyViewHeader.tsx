import type { createTaxonomyImageApi } from "../lib/api/taxonomyImages";
import type { ReactNode } from "react";

import { useTaxonomyImages } from "../hooks/useTaxonomyImages";

/** The entity's main taxonomy image, laid out to the right of the title (à la the bookmark detail). */
function TaxonomyPoster({
  ownerId,
  imagesApi,
  queryKeyPrefix,
}: {
  ownerId: string;
  imagesApi: ReturnType<typeof createTaxonomyImageApi>;
  queryKeyPrefix: string;
}) {
  const {
    images,
  } = useTaxonomyImages(imagesApi, ownerId, [queryKeyPrefix, ownerId]);
  const poster = images.find(image => image.isMain) ?? images[0];
  if (!poster) return null;
  return (
    <img
      src={poster.url}
      alt=""
      className="
        max-h-72 w-full rounded-md border object-contain
        @2xl:w-72 @2xl:shrink-0
      "
    />
  );
}

/**
 * Shared header for a Plex-backed media taxonomy's tabbed view/edit pages: a back link, the entity
 * title (left) with its actions, and the entity's main image to the right at the `@2xl` container
 * breakpoint — mirroring the bookmark detail header. The typed router `<Link>`s stay in each route's
 * `_view.tsx` (passed in as `backLink` / `actions`); this component only owns the layout + image.
 */
export function PlexTaxonomyViewHeader({
  ownerId,
  imagesApi,
  queryKeyPrefix,
  backLink,
  title,
  actions,
}: {
  /** The entity id once loaded; the image is fetched only when it's known. */
  ownerId: string | undefined;
  imagesApi: ReturnType<typeof createTaxonomyImageApi>;
  queryKeyPrefix: string;
  backLink: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="@container space-y-1">
      {backLink}
      <div
        className="
          flex flex-col gap-4
          @2xl:flex-row @2xl:items-start
        "
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {title}
            </h1>
            {actions
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  {actions}
                </div>
              )
              : null}
          </div>
        </div>
        {ownerId
          ? (
            <TaxonomyPoster
              ownerId={ownerId}
              imagesApi={imagesApi}
              queryKeyPrefix={queryKeyPrefix}
            />
          )
          : null}
      </div>
    </div>
  );
}
