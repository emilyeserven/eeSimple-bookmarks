/**
 * ISO 639 language-code normalization shared by the metadata scan (`<html lang>` / `og:locale`),
 * the YouTube Data API (`defaultLanguage` / `defaultAudioLanguage`), and the ISBN providers (Open
 * Library's MARC/ISO 639-2 bibliographic codes, Google Books' ISO 639-1 codes). Every detected code
 * is normalized to a 2-letter ISO 639-1 code when one is known; otherwise the code is passed through
 * unchanged so the client can still create a language row for it.
 */

/** `{ code, altCodes, name }` for the built-in seeded vocabulary — also the normalization table. */
export interface LanguageCodeEntry {
  /** Canonical ISO 639-1 code (e.g. `"en"`). */
  code: string;
  /** Other codes that should normalize to `code`: the ISO 639-2/T code and, where it differs, the
   * ISO 639-2/B (MARC/bibliographic) code Open Library reports (e.g. `"eng"`, or `"fre"`/`"fra"` for
   * French). */
  altCodes: string[];
  /** English display name, used to seed the built-in row. */
  name: string;
}

/**
 * The seeded built-in vocabulary, in display order. Covers the languages most likely to appear in
 * bookmarked content. A handful of extra bibliographic-code entries below (not built-in) exist only
 * so a detected MARC code still normalizes to the right ISO 639-1 code even when the language isn't
 * seeded.
 */
export const LANGUAGE_CODES: LanguageCodeEntry[] = [
  {
    code: "en",
    altCodes: ["eng"],
    name: "English",
  },
  {
    code: "es",
    altCodes: ["spa"],
    name: "Spanish",
  },
  {
    code: "fr",
    altCodes: ["fra", "fre"],
    name: "French",
  },
  {
    code: "de",
    altCodes: ["deu", "ger"],
    name: "German",
  },
  {
    code: "it",
    altCodes: ["ita"],
    name: "Italian",
  },
  {
    code: "pt",
    altCodes: ["por"],
    name: "Portuguese",
  },
  {
    code: "nl",
    altCodes: ["nld", "dut"],
    name: "Dutch",
  },
  {
    code: "ru",
    altCodes: ["rus"],
    name: "Russian",
  },
  {
    code: "pl",
    altCodes: ["pol"],
    name: "Polish",
  },
  {
    code: "sv",
    altCodes: ["swe"],
    name: "Swedish",
  },
  {
    code: "no",
    altCodes: ["nor"],
    name: "Norwegian",
  },
  {
    code: "da",
    altCodes: ["dan"],
    name: "Danish",
  },
  {
    code: "fi",
    altCodes: ["fin"],
    name: "Finnish",
  },
  {
    code: "is",
    altCodes: ["isl", "ice"],
    name: "Icelandic",
  },
  {
    code: "el",
    altCodes: ["ell", "gre"],
    name: "Greek",
  },
  {
    code: "tr",
    altCodes: ["tur"],
    name: "Turkish",
  },
  {
    code: "he",
    altCodes: ["heb"],
    name: "Hebrew",
  },
  {
    code: "ar",
    altCodes: ["ara"],
    name: "Arabic",
  },
  {
    code: "fa",
    altCodes: ["fas", "per"],
    name: "Persian",
  },
  {
    code: "hi",
    altCodes: ["hin"],
    name: "Hindi",
  },
  {
    code: "bn",
    altCodes: ["ben"],
    name: "Bengali",
  },
  {
    code: "ur",
    altCodes: ["urd"],
    name: "Urdu",
  },
  {
    code: "pa",
    altCodes: ["pan"],
    name: "Punjabi",
  },
  {
    code: "ta",
    altCodes: ["tam"],
    name: "Tamil",
  },
  {
    code: "te",
    altCodes: ["tel"],
    name: "Telugu",
  },
  {
    code: "mr",
    altCodes: ["mar"],
    name: "Marathi",
  },
  {
    code: "gu",
    altCodes: ["guj"],
    name: "Gujarati",
  },
  {
    code: "zh",
    altCodes: ["zho", "chi"],
    name: "Chinese",
  },
  {
    code: "ja",
    altCodes: ["jpn"],
    name: "Japanese",
  },
  {
    code: "ko",
    altCodes: ["kor"],
    name: "Korean",
  },
  {
    code: "vi",
    altCodes: ["vie"],
    name: "Vietnamese",
  },
  {
    code: "th",
    altCodes: ["tha"],
    name: "Thai",
  },
  {
    code: "id",
    altCodes: ["ind"],
    name: "Indonesian",
  },
  {
    code: "ms",
    altCodes: ["msa", "may"],
    name: "Malay",
  },
  {
    code: "tl",
    altCodes: ["tgl"],
    name: "Filipino",
  },
  {
    code: "cs",
    altCodes: ["ces", "cze"],
    name: "Czech",
  },
  {
    code: "sk",
    altCodes: ["slk", "slo"],
    name: "Slovak",
  },
  {
    code: "hu",
    altCodes: ["hun"],
    name: "Hungarian",
  },
  {
    code: "ro",
    altCodes: ["ron", "rum"],
    name: "Romanian",
  },
  {
    code: "bg",
    altCodes: ["bul"],
    name: "Bulgarian",
  },
  {
    code: "uk",
    altCodes: ["ukr"],
    name: "Ukrainian",
  },
  {
    code: "hr",
    altCodes: ["hrv"],
    name: "Croatian",
  },
  {
    code: "sr",
    altCodes: ["srp"],
    name: "Serbian",
  },
  {
    code: "sl",
    altCodes: ["slv"],
    name: "Slovenian",
  },
  {
    code: "lt",
    altCodes: ["lit"],
    name: "Lithuanian",
  },
  {
    code: "lv",
    altCodes: ["lav"],
    name: "Latvian",
  },
  {
    code: "et",
    altCodes: ["est"],
    name: "Estonian",
  },
  {
    code: "ca",
    altCodes: ["cat"],
    name: "Catalan",
  },
  {
    code: "eu",
    altCodes: ["eus", "baq"],
    name: "Basque",
  },
  {
    code: "gl",
    altCodes: ["glg"],
    name: "Galician",
  },
  {
    code: "cy",
    altCodes: ["cym", "wel"],
    name: "Welsh",
  },
  {
    code: "ga",
    altCodes: ["gle"],
    name: "Irish",
  },
  {
    code: "sw",
    altCodes: ["swa"],
    name: "Swahili",
  },
  {
    code: "af",
    altCodes: ["afr"],
    name: "Afrikaans",
  },
];

/**
 * Extra bibliographic (ISO 639-2/B) codes for languages outside the built-in list, so a detected
 * Open Library `/languages/xxx` code still normalizes to the correct ISO 639-1 code instead of being
 * kept as a non-standard 3-letter code.
 */
const EXTRA_ALT_CODES: Record<string, string> = {
  alb: "sq",
  arm: "hy",
  bur: "my",
  geo: "ka",
  mac: "mk",
};

/** `altCode → canonical ISO 639-1 code`, built once from `LANGUAGE_CODES` + `EXTRA_ALT_CODES`. */
const ALT_CODE_TO_ISO1 = new Map<string, string>([
  ...LANGUAGE_CODES.flatMap(entry => entry.altCodes.map((alt): [string, string] => [alt, entry.code])),
  ...Object.entries(EXTRA_ALT_CODES),
]);

/**
 * Normalize a detected language code (a BCP-47 tag like `"en-US"`/`"en_US"`, or an ISO 639-2/T or
 * ISO 639-2/B three-letter code) to a canonical form: the ISO 639-1 code when one is known, else the
 * lowercased primary subtag unchanged. Returns `null` for blank/unusable input.
 */
export function normalizeLanguageCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const primary = raw.trim().toLowerCase().replace(/_/g, "-").split("-")[0];
  if (!primary || primary.length < 2) return null;
  return ALT_CODE_TO_ISO1.get(primary) ?? primary;
}
