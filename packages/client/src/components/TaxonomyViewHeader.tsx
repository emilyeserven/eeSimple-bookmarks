import type { createTaxonomyImageApi } from "../lib/api/taxonomyImages";
import type { ReactNode } from "react";

import { useTaxonomyImages } from "../hooks/useTaxonomyImages";

/** How the header resolves the entity's image: from the taxonomy-image gallery, or a plain URL field. */
export type TaxonomyHeaderImage
  = | {
    kind: "taxonomyImages";
    /** The entity id once loaded; the image is fetched only when it's known. */
    ownerId: string | undefined;
    imagesApi: ReturnType<typeof createTaxonomyImageApi>;
    queryKeyPrefix: string;
  }
  | {
    kind: "url";
    url: string | null | undefined;
  };

const imageClass = "max-h-72 w-full rounded-md border object-contain @2xl:w-72 @2xl:shrink-0";

/** The entity's main taxonomy-gallery image (à la the bookmark detail), laid out beside the title. */
function TaxonomyImagesPoster({
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
      className={imageClass}
    />
  );
}

function HeaderImage({
  image,
}: {
  image: TaxonomyHeaderImage;
}) {
  if (image.kind === "url") {
    if (!image.url) return null;
    return (
      <img
        src={image.url}
        alt=""
        className={imageClass}
      />
    );
  }
  if (!image.ownerId) return null;
  return (
    <TaxonomyImagesPoster
      ownerId={image.ownerId}
      imagesApi={image.imagesApi}
      queryKeyPrefix={image.queryKeyPrefix}
    />
  );
}

/**
 * Shared header for a taxonomy entity's tabbed view/edit pages: the entity title (with an optional
 * muted subtitle) on the left, vertically centered against the entity's main image on the right at the
 * `@2xl` container breakpoint — mirroring the bookmark detail header. The image comes either from the
 * taxonomy-image gallery (`kind: "taxonomyImages"`, e.g. Plex posters / book covers) or a plain URL
 * field (`kind: "url"`, e.g. website favicon / channel-person-group avatar). Edit/Delete live in the
 * app-header toolbar strip and the edit tab's danger zone, not here; navigation back to the listing is
 * handled by the breadcrumbs.
 */
export function TaxonomyViewHeader({
  image,
  title,
  subtitle,
}: {
  image: TaxonomyHeaderImage;
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <div className="@container space-y-1">
      <div
        className="
          flex flex-col gap-4
          @2xl:flex-row @2xl:items-center
        "
      >
        <div className="min-w-0 flex-1 space-y-1">
          <h1
            className="
              flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
            "
          >
            {title}
          </h1>
          {subtitle
            ? <p className="text-sm text-muted-foreground">{subtitle}</p>
            : null}
        </div>
        <HeaderImage image={image} />
      </div>
    </div>
  );
}
