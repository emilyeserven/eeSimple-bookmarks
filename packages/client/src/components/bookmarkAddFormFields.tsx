import type { SourceDefaults } from "./BookmarkAdvancedSection";
import type { ImageIntent } from "./bookmarkImageIntent";
import type { BookmarkTitleFieldProps } from "./BookmarkTitleField";
import type {
  BookmarkAddFormStandardField,
  BookmarkImage,
  Category,
  Group,
  ImageCandidate,
  MediaTypeNode,
  Person,
  TagNode,
} from "@eesimple/types";
import type { ReactNode } from "react";

import { Fragment } from "react";

import { BookmarkAdvancedCategoryField } from "./BookmarkAdvancedCategoryField";
import { BookmarkAdvancedDescriptionTagsField } from "./BookmarkAdvancedDescriptionTagsField";
import { BookmarkAdvancedGroupField } from "./BookmarkAdvancedGroupField";
import { BookmarkAdvancedMediaTypeField } from "./BookmarkAdvancedMediaTypeField";
import { BookmarkExcludedLocationsField } from "./BookmarkExcludedLocationsField";
import { BookmarkExcludedTagsField } from "./BookmarkExcludedTagsField";
import { BookmarkGenreMoodsField } from "./BookmarkGenreMoodsField";
import { BookmarkGroupsField } from "./BookmarkGroupsField";
import { BookmarkImageField } from "./BookmarkImageField";
import { BookmarkLocationsField } from "./BookmarkLocationsField";
import { BookmarkMediaLinkField } from "./BookmarkMediaLinkField";
import { BookmarkNamesField } from "./BookmarkNamesField";
import { BookmarkPeopleField } from "./BookmarkPeopleField";
import { BookmarkTitleField } from "./BookmarkTitleField";

/**
 * Everything the individual standard-field components need, gathered into one bag so the same
 * render-props can be threaded into any zone (the banner grid's Name cluster, the main-area zone,
 * and the Advanced section). The title-fetch handlers are optional (see {@link BookmarkTitleField}).
 */
export interface StandardFieldRenderProps extends Omit<BookmarkTitleFieldProps, "namesSlot"> {
  /** Hide the Name (title) field — set for plain-text entries, where the typed text is the name. */
  hideNameField?: boolean;
  lockedCategoryId?: string;
  categories: Category[];
  mediaTypes: MediaTypeNode[];
  groups?: Group[];
  sourceDefaults: SourceDefaults;
  tagTree: TagNode[];
  onTagToggle: (id: string) => void;
  onFetchDescription?: (url: string) => void;
  isFetchDescriptionPending?: boolean;
  people?: Person[];
  imageFieldKey: number;
  existingImages: BookmarkImage[];
  imageCandidates: ImageCandidate[];
  defaultAuto: boolean;
  autoGrabError: string | null;
  onImageIntentChange: (intent: ImageIntent) => void;
}

/**
 * Per-field renderer, exhaustive over {@link BookmarkAddFormStandardField} so a new standard field
 * fails `tsc` here until it has a renderer. Auto-gates compose with placement: `title` hides when
 * `hideNameField`; `personIds` hides when there are no people to pick.
 */
const FIELD_RENDERERS: Record<
  BookmarkAddFormStandardField,
  (props: StandardFieldRenderProps) => ReactNode
> = {
  title: props => (props.hideNameField ? null : <BookmarkTitleField {...props} />),
  names: props => <BookmarkNamesField form={props.form} />,
  categoryId: props => (
    <BookmarkAdvancedCategoryField
      form={props.form}
      lockedCategoryId={props.lockedCategoryId}
      categories={props.categories}
      sourceDefaults={props.sourceDefaults}
    />
  ),
  mediaTypeId: props => (
    <BookmarkAdvancedMediaTypeField
      form={props.form}
      mediaTypes={props.mediaTypes}
      sourceDefaults={props.sourceDefaults}
    />
  ),
  groupId: props => (
    <BookmarkAdvancedGroupField
      form={props.form}
      groups={props.groups ?? []}
    />
  ),
  descriptionTags: props => (
    <BookmarkAdvancedDescriptionTagsField
      form={props.form}
      tagTree={props.tagTree}
      onTagToggle={props.onTagToggle}
      sourceDefaults={props.sourceDefaults}
      onFetchDescription={props.onFetchDescription}
      isFetchDescriptionPending={props.isFetchDescriptionPending}
    />
  ),
  personIds: props => ((props.people?.length ?? 0) === 0
    ? null
    : (
      <BookmarkPeopleField
        form={props.form}
        people={props.people ?? []}
      />
    )),
  image: props => (
    <BookmarkImageField
      form={props.form}
      imageFieldKey={props.imageFieldKey}
      existingImages={props.existingImages}
      imageCandidates={props.imageCandidates}
      defaultAuto={props.defaultAuto}
      autoGrabError={props.autoGrabError}
      onImageIntentChange={props.onImageIntentChange}
    />
  ),
  groupIds: props => (
    <BookmarkGroupsField
      form={props.form}
      groups={props.groups ?? []}
    />
  ),
  genreMoodIds: props => <BookmarkGenreMoodsField form={props.form} />,
  locationIds: props => <BookmarkLocationsField form={props.form} />,
  mediaLink: props => <BookmarkMediaLinkField form={props.form} />,
  blacklistedTagIds: props => (
    <BookmarkExcludedTagsField
      form={props.form}
      tagTree={props.tagTree}
    />
  ),
  blacklistedLocationIds: props => <BookmarkExcludedLocationsField form={props.form} />,
};

interface BookmarkStandardFieldZoneProps extends StandardFieldRenderProps {
  /** The standard fields to render, in the order given (the resolver already orders by tuple). */
  fields: BookmarkAddFormStandardField[];
}

/**
 * Renders the given standard fields in order, dispatching each through {@link FIELD_RENDERERS}. Used
 * for both the main-area and Advanced zones of the Add Bookmark form.
 */
export function BookmarkStandardFieldZone({
  fields, ...renderProps
}: BookmarkStandardFieldZoneProps) {
  return (
    <>
      {fields.map(field => (
        <Fragment key={field}>{FIELD_RENDERERS[field](renderProps)}</Fragment>
      ))}
    </>
  );
}
