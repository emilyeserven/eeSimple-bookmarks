/**
 * Script → primary-language classification for an entity's name/title.
 *
 * This is the canonical classifier for *new* code (the `entity_names` backfill). It uses Node 22
 * Unicode property escapes (`\p{Script=…}`) so the block boundaries are precise and self-documenting.
 * The legacy char-class range regexes in `services/wikidata.ts` are a separate, intentionally
 * behavior-frozen path (they pick the Wikidata query language and are covered by their own tests) —
 * do not unify the two by swapping wikidata's ranges for `\p{}`, which would broaden its matches.
 */

/** Any Hangul (Korean) letter or syllable. */
export const hasHangul = (text: string): boolean => /\p{Script=Hangul}/u.test(text);

/** Any Hiragana or Katakana (Japanese kana) — the unambiguous marker of Japanese vs. Chinese. */
export const hasKana = (text: string): boolean => /\p{Script=Hiragana}|\p{Script=Katakana}/u.test(text);

/** Any Han (CJK) ideograph — shared by Japanese, Korean hanja, and Chinese, so ambiguous alone. */
export const hasHan = (text: string): boolean => /\p{Script=Han}/u.test(text);

const LETTER = /\p{L}/u;
const LATIN_LETTER = /\p{Script=Latin}/u;

/**
 * Detect the primary language of an entity's current name/title from its script:
 *
 * - any Hangul → `"ko"`
 * - any kana (with or without kanji) → `"ja"` (kanji+kana ⇒ Japanese)
 * - Han present but **no** kana → `hanFallback` — ambiguous Japanese/Chinese, so the caller decides
 *   (an operator-configured preference, default `null` = undetermined; never guessed from the script)
 * - otherwise Latin-dominant (every letter is Latin, ignoring digits/punctuation) → `"en"`
 * - else → `null` (empty, digits/punctuation only, other scripts, or mixed/unknown)
 *
 * Returning `null` means "undetermined": the caller leaves the base column as the display source
 * rather than mislabelling the name's language.
 */
export function detectNameLanguage(
  text: string,
  hanFallback: "ja" | "zh" | null = null,
): "ko" | "ja" | "en" | "zh" | null {
  if (hasHangul(text)) return "ko";
  if (hasKana(text)) return "ja";
  if (hasHan(text)) return hanFallback;
  const letters = [...text].filter(char => LETTER.test(char));
  if (letters.length > 0 && letters.every(char => LATIN_LETTER.test(char))) return "en";
  return null;
}
