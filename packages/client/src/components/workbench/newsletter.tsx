/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, Newsletter } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import i18n from "../../i18n";
import {
  NewsletterCategoryEdit,
  NewsletterDescriptionEdit,
  NewsletterGenreMoodEdit,
  NewsletterMediaTypeEdit,
  NewsletterNameField,
  NewsletterTagsEdit,
} from "../NewsletterGeneralForm";
import { SourceAutofillDefaults } from "../SourceAutofillDefaults";

import { useDeleteNewsletter, useNewsletterById, useNewsletterBySlug } from "@/hooks/useNewsletters";

/** Read-only metadata (Added / Slug / Bookmarks) — the `metadata` view-only field. */
function NewsletterMetadataView({
  newsletter,
}: {
  newsletter: Newsletter;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">{t("Added")}</dt>
      <dd>{new Date(newsletter.createdAt).toLocaleDateString()}</dd>
      <dt className="text-muted-foreground">{t("Slug")}</dt>
      <dd className="font-mono">{newsletter.slug}</dd>
      {newsletter.bookmarkCount != null
        ? (
          <>
            <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
            <dd>{newsletter.bookmarkCount}</dd>
          </>
        )
        : null}
    </dl>
  );
}

/**
 * The newsletter workbench's field registry (#1106 layout editor). The old `general` view/edit panes
 * become placeable, mode-aware {@link WorkbenchField}s; the mode picks the `view`/`edit` renderer, so
 * parity is by construction: `name`/`category`/`mediaType`/`tags`/`genreMoods` are **edit-only**,
 * `metadata`/`sourceDefaults` are **view-only**, and `description` carries both. `category`/`mediaType`
 * (#1187) are the granular replacement for the old bundled `sourceDefaults` *edit* renderer —
 * `sourceDefaults` itself stays as the view-only combined "applied automatically" summary. Ordered so
 * the default layout renders byte-identically to the old view (`description → metadata → defaults`)
 * and, for edit, puts `category`/`mediaType` where the old bundled defaults editor sat (`name →
 * description → category → mediaType → tags → genres`). Authored as an exhaustive
 * `Record<NewsletterFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type NewsletterFieldKey
  = | "name"
    | "description"
    | "metadata"
    | "sourceDefaults"
    | "category"
    | "mediaType"
    | "tags"
    | "genreMoods";

const newsletterFields = {
  name: {
    key: "name",
    label: i18n.t("Newsletter name"),
    edit: ({
      entity,
    }) => <NewsletterNameField newsletter={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: ({
      entity,
    }) => (entity.description
      ? <p className="text-sm text-muted-foreground">{entity.description}</p>
      : null),
    edit: ({
      entity,
    }) => <NewsletterDescriptionEdit newsletter={entity} />,
  },
  metadata: {
    key: "metadata",
    label: i18n.t("Details"),
    view: ({
      entity,
    }) => <NewsletterMetadataView newsletter={entity} />,
  },
  sourceDefaults: {
    key: "sourceDefaults",
    label: i18n.t("Defaults"),
    view: ({
      entity,
    }) => (
      <SourceAutofillDefaults
        kind="newsletter"
        category={entity.category}
        mediaTypeId={entity.mediaTypeId}
        tagIds={entity.tagIds}
      />
    ),
  },
  category: {
    key: "category",
    label: i18n.t("Default category"),
    edit: ({
      entity,
    }) => <NewsletterCategoryEdit newsletter={entity} />,
  },
  mediaType: {
    key: "mediaType",
    label: i18n.t("Default media type"),
    edit: ({
      entity,
    }) => <NewsletterMediaTypeEdit newsletter={entity} />,
  },
  tags: {
    key: "tags",
    label: i18n.t("Default tags"),
    edit: ({
      entity,
    }) => <NewsletterTagsEdit newsletter={entity} />,
  },
  genreMoods: {
    key: "genreMoods",
    label: i18n.t("Genres & moods"),
    edit: ({
      entity,
    }) => <NewsletterGenreMoodEdit newsletter={entity} />,
  },
} satisfies Record<NewsletterFieldKey, WorkbenchField<Newsletter>>;

/** The code default layout: the single General tab, one untitled section, fields in current order. */
const NEWSLETTER_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["name", "description", "metadata", "sourceDefaults", "category", "mediaType", "tags", "genreMoods"] satisfies NewsletterFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for a newsletter's tabbed view/edit UI (main pane routes + right panel). */
export const newsletterWorkbench: EntityWorkbench<Newsletter> = {
  useBySlug: (slug) => {
    const {
      newsletter, isLoading,
    } = useNewsletterBySlug(slug);
    return {
      entity: newsletter,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      newsletter, isLoading, error,
    } = useNewsletterById(id);
    return {
      entity: newsletter,
      isLoading,
      error,
    };
  },
  name: newsletter => newsletter.name,
  useDelete: () => {
    const mutation = useDeleteNewsletter();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Newsletter not found."),
  navAriaLabel: i18n.t("Newsletter sections"),
  listingPath: "/taxonomies/newsletters",
  getSlug: newsletter => newsletter.slug,
  layoutKind: "newsletter",
  fields: newsletterFields,
  defaultLayout: NEWSLETTER_DEFAULT_LAYOUT,
  // Layout-driven: the body comes from `fields` + `defaultLayout`. A single tab needs no `group`, so
  // `tabs` is a thin placeholder retained only for the descriptor's type requirement.
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
  ],
};
