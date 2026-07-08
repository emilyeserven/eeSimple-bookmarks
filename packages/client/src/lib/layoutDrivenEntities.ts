import type { LayoutFieldMeta } from "../components/LayoutBoard";
import type { WorkbenchField } from "../components/workbench/types";
import type { EntityLayout, LayoutableEntityKind } from "@eesimple/types";

import { bookmarkWorkbench } from "../components/workbench/bookmark";
import { categoryWorkbench } from "../components/workbench/category";
import { genreMoodWorkbench } from "../components/workbench/genreMood";
import { locationWorkbench } from "../components/workbench/location";
import { mediaTypeWorkbench } from "../components/workbench/mediaType";
import { newsletterWorkbench } from "../components/workbench/newsletter";
import { propertyWorkbench } from "../components/workbench/property";
import { tagWorkbench } from "../components/workbench/tag";
import { websiteWorkbench } from "../components/workbench/website";
import { youtubeChannelWorkbench } from "../components/workbench/youtubeChannel";
import i18n from "../i18n";

/** One entity kind selectable on the Page Layouts settings page. */
export interface LayoutDrivenEntity {
  kind: LayoutableEntityKind;
  label: string;
  fields: LayoutFieldMeta[];
  defaultLayout: EntityLayout;
}

function fieldsFromRegistry<E>(fields: Record<string, WorkbenchField<E>> | undefined): LayoutFieldMeta[] {
  return Object.values(fields ?? {}).map(field => ({
    key: field.key,
    label: field.label,
    icon: field.icon,
  }));
}

/**
 * Entity kinds whose field registry (#1159) has landed — the Page Layouts settings page (#1162)
 * only lists these, per `LAYOUTABLE_ENTITY_KINDS`' own doc note that not every kind has a registry
 * yet. Add an entry here as each entity's workbench gains `layoutKind`/`fields`/`defaultLayout`
 * (see CLAUDE.md "Entity page layouts").
 */
export const LAYOUT_DRIVEN_ENTITIES: LayoutDrivenEntity[] = [
  {
    kind: "category",
    label: i18n.t("Category"),
    fields: fieldsFromRegistry(categoryWorkbench.fields),
    defaultLayout: categoryWorkbench.defaultLayout ?? {
      tabs: [],
    },
  },
  {
    kind: "newsletter",
    label: i18n.t("Newsletter"),
    fields: fieldsFromRegistry(newsletterWorkbench.fields),
    defaultLayout: newsletterWorkbench.defaultLayout ?? {
      tabs: [],
    },
  },
  {
    kind: "bookmark",
    label: i18n.t("Bookmark"),
    fields: fieldsFromRegistry(bookmarkWorkbench.fields),
    defaultLayout: bookmarkWorkbench.defaultLayout ?? {
      tabs: [],
    },
  },
  {
    kind: "custom-property",
    label: i18n.t("Custom Property"),
    fields: fieldsFromRegistry(propertyWorkbench.fields),
    defaultLayout: propertyWorkbench.defaultLayout ?? {
      tabs: [],
    },
  },
  {
    kind: "genre-mood",
    label: i18n.t("Genres & Moods"),
    fields: fieldsFromRegistry(genreMoodWorkbench.fields),
    defaultLayout: genreMoodWorkbench.defaultLayout ?? {
      tabs: [],
    },
  },
  {
    kind: "tag",
    label: i18n.t("Tag"),
    fields: fieldsFromRegistry(tagWorkbench.fields),
    defaultLayout: tagWorkbench.defaultLayout ?? {
      tabs: [],
    },
  },
  {
    kind: "website",
    label: i18n.t("Website"),
    fields: fieldsFromRegistry(websiteWorkbench.fields),
    defaultLayout: websiteWorkbench.defaultLayout ?? {
      tabs: [],
    },
  },
  {
    kind: "media-type",
    label: i18n.t("Media Type"),
    fields: fieldsFromRegistry(mediaTypeWorkbench.fields),
    defaultLayout: mediaTypeWorkbench.defaultLayout ?? {
      tabs: [],
    },
  },
  {
    kind: "location",
    label: i18n.t("Location"),
    fields: fieldsFromRegistry(locationWorkbench.fields),
    defaultLayout: locationWorkbench.defaultLayout ?? {
      tabs: [],
    },
  },
  {
    kind: "youtube-channel",
    label: i18n.t("YouTube Channel"),
    fields: fieldsFromRegistry(youtubeChannelWorkbench.fields),
    defaultLayout: youtubeChannelWorkbench.defaultLayout ?? {
      tabs: [],
    },
  },
];
