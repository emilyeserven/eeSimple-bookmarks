/**
 * Shared eeSimple Bookmarks domain types.
 *
 * These are consumed by both the Fastify API (`@eesimple/middleware`) and the React client
 * (`@eesimple/client`) so the wire contract stays in one place.
 */

/** A tag node in the hierarchical taxonomy. `parentId === null` marks a root tag. */
export interface Tag {
  id: string;
  /** Display name, unique among its siblings. */
  name: string;
  /** Parent tag id, or `null` for a root-level tag. */
  parentId: string | null;
  /** ISO-8601 timestamp of when the tag was created. */
  createdAt: string;
}

/** A tag with its children populated — used to render the taxonomy tree. */
export interface TagNode extends Tag {
  children: TagNode[];
}

/** Lightweight tag shape carried on a bookmark (enough to render and group). */
export type BookmarkTag = Pick<Tag, "id" | "name" | "parentId">;

/** Payload for creating a tag. */
export interface CreateTagInput {
  name: string;
  /** Parent tag id, or `null`/omitted for a root tag. */
  parentId?: string | null;
}

/** Payload for renaming and/or reparenting a tag. `parentId === null` moves it to root. */
export interface UpdateTagInput {
  name?: string;
  parentId?: string | null;
}

/** A single saved bookmark. */
export interface Bookmark {
  id: string;
  /** The bookmarked URL (http/https). */
  url: string;
  /** Human-friendly title, e.g. "GitHub". */
  title: string;
  /** Optional free-form description. */
  description: string | null;
  /** Id of the category this bookmark belongs to (always set; the built-in "Default" when unassigned). */
  categoryId: string;
  /** Tags assigned to this bookmark, drawn from the taxonomy. */
  tags: BookmarkTag[];
  /** Number-typed custom property values (includes computed `calculate` results) assigned to this bookmark. */
  numberValues: BookmarkNumberValue[];
  /** Boolean custom property values assigned to this bookmark. */
  booleanValues: BookmarkBooleanValue[];
  /** Homepage ordering weight; higher values appear first. */
  priority: number;
  /** ISO-8601 timestamp of when the bookmark was created. */
  createdAt: string;
}

/** Payload for creating a bookmark. */
export interface CreateBookmarkInput {
  url: string;
  title: string;
  description?: string | null;
  /** Id of the category to assign; omit to fall back to the built-in "Default" category. */
  categoryId?: string;
  /** Ids of tags to assign, drawn from the taxonomy. */
  tagIds?: string[];
  /** Number custom property values to assign (calculate results are computed server-side). */
  numberValues?: BookmarkNumberValue[];
  /** Boolean custom property values to assign. */
  booleanValues?: BookmarkBooleanValue[];
  /** Homepage ordering weight; higher values appear first. */
  priority?: number;
}

/** Payload for partially updating a bookmark. */
export type UpdateBookmarkInput = Partial<CreateBookmarkInput>;

/**
 * The kind of a user-defined custom property:
 * - `number` — a single numeric value per bookmark, filtered via a range slider.
 * - `boolean` — a single true/false value per bookmark.
 * - `calculate` — a numeric value derived from other `number` properties (Sum formula);
 *   computed and stored server-side so it filters and sorts like a `number`.
 */
export type CustomPropertyType = "number" | "boolean" | "calculate";

/** A user-defined custom property that becomes a dynamic bookmark filter. */
export interface CustomProperty {
  id: string;
  name: string;
  type: CustomPropertyType;
  /** Lower bound of a `number`/`calculate` range slider (`null` = no minimum / derive from data). */
  numberMin: number | null;
  /** Upper bound of a `number`/`calculate` range slider (`null` = no maximum / derive from data). */
  numberMax: number | null;
  /** Singular unit label for a `number`/`calculate` value (e.g. `"star"`), or `null`. */
  unitSingular: string | null;
  /** Plural unit label for a `number`/`calculate` value (e.g. `"stars"`), or `null`. */
  unitPlural: string | null;
  /** For a `calculate` property: ids of the `number` properties summed to produce its value. */
  operandPropertyIds: string[];
  /** Ids of the categories this property is assigned to (zero, one, or many). */
  categoryIds: string[];
  /** When true, the property's field shows in the main bookmark form; otherwise it lives in Advanced. */
  showInForm: boolean;
  createdAt: string;
}

/** Payload for creating a custom property. */
export interface CreateCustomPropertyInput {
  name: string;
  type: CustomPropertyType;
  numberMin?: number | null;
  numberMax?: number | null;
  unitSingular?: string | null;
  unitPlural?: string | null;
  /** For a `calculate` property: ids of the `number` properties to sum (at least two). */
  operandPropertyIds?: string[];
  /** Ids of categories to assign this property to. Omit to leave unassigned. */
  categoryIds?: string[];
  /** When true, the property's field shows in the main bookmark form; otherwise it lives in Advanced. */
  showInForm?: boolean;
}

/** Payload for updating a custom property. Its `type` is immutable. */
export type UpdateCustomPropertyInput = Partial<Omit<CreateCustomPropertyInput, "type">>;

/** A number custom property value carried on a bookmark. */
export interface BookmarkNumberValue {
  propertyId: string;
  value: number;
}

/** A boolean custom property value carried on a bookmark. */
export interface BookmarkBooleanValue {
  propertyId: string;
  value: boolean;
}

/**
 * A category groups custom properties and owns each bookmark assigned to it.
 * Properties may belong to zero, one, or many categories; each category carries an
 * optional Lucide icon shown in the sidebar.
 */
export interface Category {
  id: string;
  name: string;
  /** URL-friendly identifier derived from the name (e.g. `"recipes"`); unique across categories. */
  slug: string;
  /** Optional free-form description. */
  description: string | null;
  /** Name of a Lucide icon (e.g. `"Star"`), or `null` for the default icon. */
  icon: string | null;
  /** Whether this is a built-in category (the "Default"); built-ins cannot be renamed or deleted. */
  builtIn: boolean;
  /** Whether bookmarks in this category appear on the homepage. */
  isHomepage: boolean;
  createdAt: string;
}

/** Payload for creating a category. */
export interface CreateCategoryInput {
  name: string;
  description?: string | null;
  icon?: string | null;
  isHomepage?: boolean;
}

/** Payload for partially updating a category. */
export type UpdateCategoryInput = Partial<CreateCategoryInput>;

/** Payload for replacing a category's enabled root-tag allowlist (empty = all roots enabled). */
export interface UpdateCategoryRootTagsInput {
  tagIds: string[];
}

/** A category's default custom-property values, applied to new bookmarks added to it. */
export interface CategoryPropertyDefaults {
  /** Default number/calculate property values (calculate defaults are ignored on save). */
  numberValues: BookmarkNumberValue[];
  /** Default boolean property values. */
  booleanValues: BookmarkBooleanValue[];
}

/** Payload for replacing a category's default custom-property values. */
export type UpdateCategoryDefaultsInput = CategoryPropertyDefaults;

/** Which bookmark field an autofill rule tests its pattern against. */
export type AutofillField = "url" | "title";

/**
 * How an autofill rule's `pattern` is matched against the chosen field:
 * - `contains` — the field contains the pattern (case-insensitive substring).
 * - `starts_with` — the field starts with the pattern (case-insensitive).
 * - `regex` — the pattern is a JavaScript regular expression (case-insensitive); invalid
 *   patterns never match.
 * - `domain` — the URL's host (with a leading `www.` stripped) equals the pattern; implies the
 *   `url` field.
 */
export type AutofillOperator = "contains" | "starts_with" | "regex" | "domain";

/**
 * A rule that prefills the Add-Bookmark form: when a bookmark's URL/Title matches, the rule's
 * category, tags, and custom-property values are suggested in the form.
 */
export interface AutofillRule {
  id: string;
  /** Friendly label shown in the settings list. */
  name: string;
  field: AutofillField;
  operator: AutofillOperator;
  pattern: string;
  /** Category to assign, or `null` to leave the category unchanged. */
  setCategoryId: string | null;
  /** Tag ids to apply, drawn from the taxonomy. */
  tagIds: string[];
  /** Number custom-property values to apply. */
  numberValues: BookmarkNumberValue[];
  /** Boolean custom-property values to apply. */
  booleanValues: BookmarkBooleanValue[];
  /** Lower sorts first; later (higher) rules win for single-valued targets when several match. */
  sortOrder: number;
  createdAt: string;
}

/** Payload for creating an autofill rule. */
export interface CreateAutofillRuleInput {
  name: string;
  field: AutofillField;
  operator: AutofillOperator;
  pattern: string;
  setCategoryId?: string | null;
  tagIds?: string[];
  numberValues?: BookmarkNumberValue[];
  booleanValues?: BookmarkBooleanValue[];
  sortOrder?: number;
}

/** Payload for partially updating an autofill rule. */
export type UpdateAutofillRuleInput = Partial<CreateAutofillRuleInput>;

/** Standard error shape returned by the API. */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
