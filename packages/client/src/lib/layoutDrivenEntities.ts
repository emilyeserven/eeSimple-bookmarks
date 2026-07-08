import type { LayoutFieldMeta } from "../components/LayoutBoard";
import type { WorkbenchField } from "../components/workbench/types";
import type { EntityLayout, LayoutableEntityKind } from "@eesimple/types";

import { useBookmarkDynamicFields } from "../components/BookmarkPropertyLayoutFields";
import { autofillWorkbench } from "../components/workbench/autofill";
import { bookmarkWorkbench } from "../components/workbench/bookmark";
import { cardDisplayRuleWorkbench } from "../components/workbench/cardDisplayRule";
import { categoryWorkbench } from "../components/workbench/category";
import { genreMoodWorkbench } from "../components/workbench/genreMood";
import { groupWorkbench } from "../components/workbench/group";
import { locationWorkbench } from "../components/workbench/location";
import { mediaTypeWorkbench } from "../components/workbench/mediaType";
import { newsletterWorkbench } from "../components/workbench/newsletter";
import { personWorkbench } from "../components/workbench/person";
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

/** Editor-facing view of a kind's dynamic (runtime-sourced) placeable fields: tray metas + home. */
export interface DynamicLayoutFields {
  metas: LayoutFieldMeta[];
  defaultHome: { tabKey: string;
    sectionKey: string; };
}

/**
 * The dynamic placeable fields per kind for the Page Layouts editor (tray + resolve). Each source hook
 * is called **unconditionally** so the hook order stays stable as the operator switches the selected
 * kind (only bookmark has a dynamic source today; add one line per new source). The render side reads
 * the same source via `useLayoutDrivenWorkbench`, so the editor and the live pages agree.
 */
export function useDynamicLayoutFieldsByKind(): Partial<Record<LayoutableEntityKind, DynamicLayoutFields>> {
  const bookmark = useBookmarkDynamicFields();
  return {
    bookmark: {
      metas: fieldsFromRegistry(bookmark.fields),
      defaultHome: bookmark.defaultHome,
    },
  };
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
    kind: "group",
    label: i18n.t("Group"),
    fields: fieldsFromRegistry(groupWorkbench.fields),
    defaultLayout: groupWorkbench.defaultLayout ?? {
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
  {
    kind: "person",
    label: i18n.t("Person"),
    fields: fieldsFromRegistry(personWorkbench.fields),
    defaultLayout: personWorkbench.defaultLayout ?? {
      tabs: [],
    },
  },
  {
    kind: "autofill",
    label: i18n.t("Autofill Rules"),
    fields: fieldsFromRegistry(autofillWorkbench.fields),
    defaultLayout: autofillWorkbench.defaultLayout ?? {
      tabs: [],
    },
  },
  {
    kind: "card-display-rule",
    label: i18n.t("Card Display Rule"),
    fields: fieldsFromRegistry(cardDisplayRuleWorkbench.fields),
    defaultLayout: cardDisplayRuleWorkbench.defaultLayout ?? {
      tabs: [],
    },
  },
];
