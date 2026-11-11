/**
 * mymind import (`POST /api/imports/mymind`): creates bookmarks directly from the cards the client
 * parsed out of a mymind `cards.csv` export (see `@eesimple/types` `mymindImport.ts` for the parsing
 * and same-URL merging). Card images are intentionally not imported.
 *
 * Each card goes through the ordinary `createBookmark` path (so website/YouTube enrichment, site
 * defaults and cache invalidation all apply), optionally with the autofill rules merged in like a
 * quick-added bookmark. Tags are matched by name or created; `prefix: value` tags can be nested under
 * a `prefix` root tag. A URL already saved as a bookmark is reported as a duplicate, not overwritten.
 */

import { and, eq, isNull } from "drizzle-orm";
import type {
  CreateBookmarkInput,
  MymindImportCard,
  MymindImportCardResult,
  MymindImportInput,
  MymindImportOptions,
  MymindImportResult,
} from "@eesimple/types";
import { mymindTypeMediaTypeCandidates, splitPrefixedTag } from "@eesimple/types";
import { db } from "@/db";
import { bookmarks, mediaTypes, tags } from "@/db/schema";
import { suggestAutofillForBookmark } from "@/services/autofill";
import { checkBookmarkUrlDuplicate, createBookmark, DuplicateUrlError } from "@/services/bookmarks";
import { createTag } from "@/services/tags";
import { isValidUrl } from "@/utils/url";

interface TagRef {
  id: string;
  name: string;
  parentId: string | null;
}

type CreateTagFn = (name: string, parentId: string | null) => Promise<string>;

/**
 * Resolves tag names to ids against a snapshot of the tag table, creating missing tags through
 * `create` and remembering them so a batch never creates the same tag twice. Plain names match any
 * existing tag case-insensitively (root tags win); with `nest`, a `prefix: value` name resolves to
 * the child `value` under a root tag `prefix`.
 */
export class MymindTagResolver {
  private readonly rootByName = new Map<string, string>();
  private readonly anyByName = new Map<string, string>();
  private readonly childByName = new Map<string, Map<string, string>>();
  createdCount = 0;

  constructor(existing: TagRef[], private readonly nest: boolean, private readonly create: CreateTagFn) {
    // Roots first so a plain-name lookup prefers a root tag over a same-named nested one.
    const ordered = [...existing].sort((a, b) => Number(a.parentId !== null) - Number(b.parentId !== null));
    for (const tag of ordered) this.remember(tag.name, tag.id, tag.parentId);
  }

  private remember(name: string, id: string, parentId: string | null): void {
    const key = name.toLowerCase();
    if (!this.anyByName.has(key)) this.anyByName.set(key, id);
    if (parentId === null) {
      if (!this.rootByName.has(key)) this.rootByName.set(key, id);
      return;
    }
    const siblings = this.childByName.get(parentId) ?? new Map<string, string>();
    if (!siblings.has(key)) siblings.set(key, id);
    this.childByName.set(parentId, siblings);
  }

  private async createAndRemember(name: string, parentId: string | null): Promise<string> {
    const id = await this.create(name, parentId);
    this.createdCount++;
    this.remember(name, id, parentId);
    return id;
  }

  private async resolveRoot(name: string): Promise<string> {
    return this.rootByName.get(name.toLowerCase()) ?? this.createAndRemember(name, null);
  }

  private async resolvePlain(name: string): Promise<string> {
    return this.anyByName.get(name.toLowerCase()) ?? this.createAndRemember(name, null);
  }

  private async resolveNested(parent: string, child: string): Promise<string> {
    const parentId = await this.resolveRoot(parent);
    const existing = this.childByName.get(parentId)?.get(child.toLowerCase());
    return existing ?? this.createAndRemember(child, parentId);
  }

  async resolve(name: string): Promise<string> {
    const split = this.nest ? splitPrefixedTag(name) : null;
    return split ? this.resolveNested(split.parent, split.child) : this.resolvePlain(name);
  }

  async resolveAll(names: string[]): Promise<string[]> {
    const ids: string[] = [];
    for (const name of names) {
      const id = await this.resolve(name);
      if (!ids.includes(id)) ids.push(id);
    }
    return ids;
  }
}

/** The first non-hidden media type whose name matches one of the card type's candidates. */
export function matchMymindMediaType(
  type: string,
  available: { id: string;
    name: string;
    hidden: boolean | null; }[],
): string | null {
  const byName = new Map<string, string>();
  for (const mediaType of available) {
    if (!mediaType.hidden) byName.set(mediaType.name.toLowerCase(), mediaType.id);
  }
  for (const candidate of mymindTypeMediaTypeCandidates(type)) {
    const hit = byName.get(candidate.toLowerCase());
    if (hit) return hit;
  }
  return null;
}

function union(...lists: (string[] | undefined)[]): string[] {
  return [...new Set(lists.flatMap(list => list ?? []))];
}

interface ImportContext {
  options: MymindImportOptions;
  tagResolver: MymindTagResolver;
  mediaTypeRows: { id: string;
    name: string;
    hidden: boolean | null; }[];
}

/** Build the `createBookmark` input for one card (tags, media type, category, autofill merge). */
async function buildCardInput(card: MymindImportCard, ctx: ImportContext): Promise<CreateBookmarkInput> {
  const {
    options,
  } = ctx;
  const autofill = options.applyAutofill
    ? await suggestAutofillForBookmark({
      url: card.url ?? "",
      title: card.title,
    })
    : null;
  const tagIds = union(autofill?.tagIds, await ctx.tagResolver.resolveAll(card.tags));
  const mediaTypeId = autofill?.mediaTypeId
    ?? (options.matchMediaTypes ? matchMymindMediaType(card.type, ctx.mediaTypeRows) : null);
  const categoryId = options.categoryId ?? autofill?.categoryId ?? null;
  return {
    url: card.url,
    title: card.title,
    description: card.description,
    categoryId: categoryId ?? undefined,
    mediaTypeId: mediaTypeId ?? undefined,
    tagIds,
    locationIds: autofill?.locationIds,
    numberValues: autofill?.numberValues.length ? autofill.numberValues : undefined,
    booleanValues: autofill?.booleanValues.length ? autofill.booleanValues : undefined,
    dateTimeValues: autofill?.dateTimeValues.length ? autofill.dateTimeValues : undefined,
  };
}

/**
 * The bookmark a card was already imported as: an exact URL match, or — for a URL-less card, which
 * has nothing unique to key on — a link-less bookmark with the same title and description, so
 * re-importing the same export doesn't duplicate its image/note cards.
 */
async function findExistingBookmarkId(card: MymindImportCard): Promise<string | null> {
  if (card.url) {
    const dup = await checkBookmarkUrlDuplicate(card.url);
    return dup.exactMatch?.id ?? null;
  }
  const [match] = await db.select({
    id: bookmarks.id,
  })
    .from(bookmarks)
    .where(and(
      isNull(bookmarks.url),
      eq(bookmarks.title, card.title),
      card.description === null ? isNull(bookmarks.description) : eq(bookmarks.description, card.description),
    ))
    .limit(1);
  return match?.id ?? null;
}

async function importOneCard(card: MymindImportCard, ctx: ImportContext): Promise<MymindImportCardResult> {
  const base = {
    title: card.title,
    url: card.url,
  };
  if (card.url && !isValidUrl(card.url)) {
    return {
      ...base,
      outcome: "failed",
      bookmarkId: null,
      error: "Invalid URL",
    };
  }
  const existingId = await findExistingBookmarkId(card);
  if (existingId) {
    return {
      ...base,
      outcome: "duplicate",
      bookmarkId: existingId,
      error: null,
    };
  }
  try {
    const bookmark = await createBookmark(await buildCardInput(card, ctx));
    if (ctx.options.keepCreatedDate && card.createdAt && !Number.isNaN(Date.parse(card.createdAt))) {
      // Display-only timestamp: no matchable data changes, so no cache invalidation is needed.
      await db.update(bookmarks)
        .set({
          createdAt: new Date(card.createdAt),
        })
        .where(eq(bookmarks.id, bookmark.id));
    }
    return {
      ...base,
      outcome: "created",
      bookmarkId: bookmark.id,
      error: null,
    };
  }
  catch (err) {
    if (err instanceof DuplicateUrlError) {
      return {
        ...base,
        outcome: "duplicate",
        bookmarkId: null,
        error: null,
      };
    }
    return {
      ...base,
      outcome: "failed",
      bookmarkId: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Import one batch of mymind cards, sequentially (tag creation must not race within a batch). */
export async function importMymindCards(input: MymindImportInput): Promise<MymindImportResult> {
  const [tagRows, mediaTypeRows] = await Promise.all([
    db.select({
      id: tags.id,
      name: tags.name,
      parentId: tags.parentId,
    }).from(tags),
    db.select({
      id: mediaTypes.id,
      name: mediaTypes.name,
      hidden: mediaTypes.hidden,
    }).from(mediaTypes),
  ]);
  const tagResolver = new MymindTagResolver(tagRows, input.options.nestPrefixedTags, async (name, parentId) => {
    const tag = await createTag({
      name,
      parentId,
    });
    return tag.id;
  });
  const ctx: ImportContext = {
    options: input.options,
    tagResolver,
    mediaTypeRows,
  };

  const results: MymindImportCardResult[] = [];
  for (const card of input.cards) results.push(await importOneCard(card, ctx));
  return {
    results,
    createdTagCount: tagResolver.createdCount,
  };
}
