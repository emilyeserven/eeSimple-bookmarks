/**
 * Re-export of the shared romanized display/sort helpers from `@eesimple/types`, kept at this path so
 * the client's existing importers (`RomanizedLabel`, `CrumbLabel`, `tagTree`) don't churn. The single
 * implementation now lives in the shared package so the middleware geocoders use the same rules.
 */
export type { RomanizedDisplay } from "@eesimple/types";
export { cleanRomanized, deriveRomanizedName, orderRomanized, romanizedSortKey } from "@eesimple/types";
