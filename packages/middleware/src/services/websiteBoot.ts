import { and, eq, sql } from "drizzle-orm";
import type { ShortenedLink, WebsiteParamRule } from "@eesimple/types";
import { db } from "@/db";
import { websites } from "@/db/schema";
import {
  type LegacyExtensionFillRule,
  migrateExtensionFillRules,
  slugFromDomain,
  takenWebsiteSlugs,
  uniqueWebsiteSlug,
} from "@/services/websiteHelpers";

/**
 * Seeded built-in websites, kept in sync at boot. Built-ins can't be renamed or deleted, but their
 * `shortenedLinks`/`paramRules` are seeded once (on insert) and stay user-editable thereafter.
 */
const BUILT_IN_WEBSITES: {
  domain: string;
  siteName: string;
  shortenedLinks: ShortenedLink[];
  paramRules: WebsiteParamRule[];
}[] = [
  {
    domain: "youtube.com",
    siteName: "YouTube",
    shortenedLinks: [
      {
        domain: "youtu.be",
        expandTo: "https://www.youtube.com/watch?v={id}",
        keepShortened: false,
      },
    ],
    paramRules: [
      {
        pathSuffix: "/watch",
        params: ["v"],
      },
      {
        pathSuffix: "/playlist",
        params: ["list"],
      },
    ],
  },
];

/**
 * Ensure the seeded built-in websites exist and are marked built-in. Idempotent and safe to call at
 * boot: inserts any missing built-in by domain, and upgrades a pre-existing auto-created row (e.g. a
 * youtube.com site created before seeding) to `builtIn` with the canonical site name. The slug is
 * only set on insert, preserving any slug an existing row already has.
 */
export async function ensureBuiltInWebsites(): Promise<void> {
  for (const {
    domain, siteName, shortenedLinks, paramRules,
  } of BUILT_IN_WEBSITES) {
    const taken = await takenWebsiteSlugs();
    const slug = uniqueWebsiteSlug(slugFromDomain(domain), taken);
    await db
      .insert(websites)
      .values({
        domain,
        siteName,
        slug,
        builtIn: true,
        // Rules are seeded on first insert only; they stay out of the conflict `set` below so a
        // user's later edits to the built-in site's shortened links / param rules are preserved.
        shortenedLinks,
        paramRules,
      })
      .onConflictDoUpdate({
        target: websites.domain,
        set: {
          builtIn: true,
          siteName,
        },
      });

    // Heal rows that predate rule seeding (e.g. a youtube.com site auto-created before the built-in
    // param rules existed): seed the rules only when the row never received them — both arrays still
    // empty — so deliberate user edits to a built-in's rules are left untouched.
    await db
      .update(websites)
      .set({
        shortenedLinks,
        paramRules,
      })
      .where(and(
        eq(websites.domain, domain),
        sql`${websites.shortenedLinks} = '[]'::jsonb`,
        sql`${websites.paramRules} = '[]'::jsonb`,
      ));
  }
}

/**
 * Migrate any stored extension-fill rules still using the retired `pathSuffix` gate to `pathMatch`.
 * Idempotent — only rows that actually change are written. jsonb shape change only; no drizzle
 * migration. Websites are a small, bounded set, so loading them all for a one-time boot step is fine.
 */
export async function backfillExtensionFillPathMatch(): Promise<void> {
  const rows = await db
    .select({
      id: websites.id,
      extensionFillRules: websites.extensionFillRules,
    })
    .from(websites);

  for (const row of rows) {
    if (!row.extensionFillRules) continue;
    const migrated = migrateExtensionFillRules(row.extensionFillRules as LegacyExtensionFillRule[]);
    if (!migrated) continue;
    await db
      .update(websites)
      .set({
        extensionFillRules: migrated,
      })
      .where(eq(websites.id, row.id));
  }
}
