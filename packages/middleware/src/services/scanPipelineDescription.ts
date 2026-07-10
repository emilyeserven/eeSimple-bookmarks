/**
 * The static description of the `GET /api/scan` pipeline, served (live-decorated) by
 * `GET /api/scan-pipeline` for the Settings → Advanced → Scan Pipeline page.
 *
 * KEEP IN LOCKSTEP with the `/api/scan` handler in `routes/metadata.ts` — a change to the scan's
 * stage order, gating, or precedence chains must update this descriptor (and the pinned-order tests
 * in `tests/scanPipeline.test.ts`) in the same PR. This lives in the middleware, not
 * `@eesimple/types`, precisely so the pipeline code and its description sit in one review diff and
 * the client can only read it via the API.
 *
 * Every id here is stable — a future user-defined-rules system (issue #1281) targets stages and
 * precedence sources by id, so renames are breaking changes (bump `version`).
 */

import type { ScanPipelineDescription } from "@eesimple/types";

export const SCAN_PIPELINE_DESCRIPTION: ScanPipelineDescription = {
  pipelineId: "scan",
  version: 1,
  endpoint: "GET /api/scan",
  nodes: [
    {
      kind: "stage",
      stage: {
        id: "validate-url",
        name: "URL validation",
        summary: "The pasted URL must be a valid http(s) URL before any work runs.",
        detail: "Anything that isn't an absolute http(s) URL is rejected immediately with a validation error — nothing is fetched.",
        gate: {
          kind: "always",
        },
      },
    },
    {
      kind: "stage",
      stage: {
        id: "identity",
        name: "Identity fields",
        summary: "Optional ISBN / Plex / Kavita / feed-URL identity fields make the duplicate check identity-aware.",
        detail: "When any identity field is supplied, the scan cache is skipped for both read and write, so a stale cached result can never mask a fresh identity-based duplicate match.",
        gate: {
          kind: "urlPattern",
          description: "Identity fields supplied with the scan request",
        },
      },
    },
    {
      kind: "stage",
      stage: {
        id: "cache-lookup",
        name: "Scan cache lookup",
        summary: "A recent identical scan is served from a short-lived in-memory cache, so re-scans are instant.",
        detail: "Keyed by URL + site-name hint + the redirect flag — everything that affects the result. This cache holds display metadata only; it never interacts with bookmark data.",
        gate: {
          kind: "always",
        },
      },
    },
    {
      kind: "stage",
      stage: {
        id: "resolve-redirect",
        name: "Redirect resolution",
        summary: "Follows the URL's redirect chain to its real destination before anything else looks at it.",
        detail: "The client turns this off per scan for domains on the redirect ignore list (e.g. docs.google.com). On failure the original URL is kept and a user-facing note is attached.",
        gate: {
          kind: "queryParam",
          param: "resolveRedirect",
          defaultValue: true,
        },
        configurable: true,
        precedences: [
          {
            id: "redirect-resolvers",
            title: "Redirect resolvers (first success wins)",
            mode: "first-non-null",
            sources: [
              {
                id: "http-unwrap",
                label: "HTTP redirect unwrap",
                description: "Plain HTTP requests follow the Location-header chain.",
              },
              {
                id: "browserless",
                label: "Browserless fallback",
                description: "A headless browser navigates JS challenges and window.location redirects plain HTTP can't.",
                gate: {
                  kind: "connector",
                  connector: "hostedMetadata",
                },
              },
            ],
          },
        ],
      },
    },
    {
      kind: "stage",
      stage: {
        id: "website-lookup",
        name: "Website lookup",
        summary: "Matches the resolved URL against the Websites taxonomy (also recognizing link shorteners).",
        detail: "Runs before the parallel work on purpose: the matched website's \"Scan URL for ISBN\" flag gates every ISBN-detection step below.",
        gate: {
          kind: "always",
        },
      },
    },
    {
      kind: "stage",
      stage: {
        id: "isbn-from-url",
        name: "ISBN from the URL itself",
        summary: "Pure, fetch-free ISBN extraction from the URL for known shapes.",
        detail: "An Amazon ASIN is usually a valid ISBN-10 (converted to ISBN-13); O'Reilly product URLs embed the ISBN-13 directly in the path. Both are pure string parses — no page is fetched.",
        gate: {
          kind: "websiteFlag",
          flag: "scanUrlForIsbn",
        },
        precedences: [
          {
            id: "isbn-url-extractors",
            title: "URL extractors (each tried for its URL shape)",
            mode: "first-non-null",
            sources: [
              {
                id: "amazon-asin",
                label: "Amazon ASIN",
                gate: {
                  kind: "urlPattern",
                  description: "Amazon product URL",
                },
              },
              {
                id: "oreilly-path",
                label: "O'Reilly path segment",
                gate: {
                  kind: "urlPattern",
                  description: "O'Reilly product URL",
                },
              },
            ],
          },
        ],
      },
    },
    {
      kind: "parallel",
      id: "parallel-fanout",
      label: "Run in parallel",
      lanes: [
        {
          id: "lane-duplicate-check",
          label: "Duplicate check",
          stages: [
            {
              id: "duplicate-check",
              name: "Duplicate check",
              summary: "Checks the resolved URL (and any identity fields) against existing bookmarks.",
              gate: {
                kind: "always",
              },
            },
          ],
        },
        {
          id: "lane-metadata",
          label: "Page metadata",
          stages: [],
          branchSet: {
            id: "metadata-branch",
            chooser: "Is the URL a YouTube video watch page?",
            branches: [
              {
                id: "metadata-branch-youtube",
                label: "YouTube video",
                stages: [
                  {
                    id: "metadata-youtube",
                    name: "YouTube metadata",
                    summary: "Title/thumbnail/channel via keyless oEmbed; duration, publish date, and description via the video-data source below.",
                    detail: "The channel is matched against saved YouTube Channels, and a known channel's self-identifier suffixes are stripped from the title.",
                    gate: {
                      kind: "always",
                    },
                    precedences: [
                      {
                        id: "youtube-video-data",
                        title: "Video data source (first success wins)",
                        mode: "first-non-null",
                        sources: [
                          {
                            id: "youtube-data-api",
                            label: "YouTube Data API v3",
                            description: "Reliable duration/date/description when an API key is configured.",
                            gate: {
                              kind: "connector",
                              connector: "youtubeDataApi",
                            },
                          },
                          {
                            id: "watch-page-scrape",
                            label: "Watch-page scrape",
                            description: "Keyless fallback reading the watch page's embedded player data.",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: "metadata-branch-generic",
                label: "Any other page",
                stages: [
                  {
                    id: "metadata-generic",
                    name: "Generic page metadata",
                    summary: "Title, description, authors, language, and image candidates from the page itself, layered with oEmbed and the optional hosted provider.",
                    detail: "The scraped title has the site-name/brand suffix stripped (using the matched website's names). Image candidates are collected from og/twitter/JSON-LD/article images, SSRF- and blacklist-filtered.",
                    gate: {
                      kind: "always",
                    },
                    registryRef: "oembedProviders",
                    configurable: true,
                    precedences: [
                      {
                        id: "metadata-sources",
                        title: "Metadata sources (later sources refine earlier ones)",
                        mode: "layered-merge",
                        sources: [
                          {
                            id: "html-scrape",
                            label: "HTML scrape",
                            description: "The page's own <title>, meta description, author tags, and language.",
                          },
                          {
                            id: "oembed",
                            label: "oEmbed",
                            description: "Clean structured metadata from a known provider or <link rel=\"oembed\"> autodiscovery; its title wins, other fields fill gaps.",
                          },
                          {
                            id: "hosted-metadata",
                            label: "Hosted metadata provider",
                            description: "Handles JS-rendered / bot-protected pages; when configured, its values win.",
                            gate: {
                              kind: "connector",
                              connector: "hostedMetadata",
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
        {
          id: "lane-isbn-amazon",
          label: "Amazon page ISBN",
          stages: [
            {
              id: "isbn-amazon-page",
              name: "Amazon page scrape",
              summary: "Reads the ISBN out of an Amazon product page's structured details.",
              detail: "Only runs when the URL is an Amazon product page and the ASIN itself wasn't already a valid ISBN.",
              gate: {
                kind: "websiteFlag",
                flag: "scanUrlForIsbn",
              },
            },
          ],
        },
        {
          id: "lane-isbn-honto",
          label: "honto.jp page ISBN",
          stages: [
            {
              id: "isbn-honto-page",
              name: "honto.jp page scrape",
              summary: "Reads the ISBN out of a honto.jp product page (which has no ASIN equivalent).",
              detail: "Only runs when the URL is a honto.jp product page.",
              gate: {
                kind: "websiteFlag",
                flag: "scanUrlForIsbn",
              },
            },
          ],
        },
        {
          id: "lane-isbn-generic",
          label: "Generic page ISBN",
          stages: [
            {
              id: "isbn-generic-page",
              name: "Generic page scrape",
              summary: "For opted-in sites with no dedicated connector, scans the page HTML for an ISBN.",
              detail: "Only runs when the URL is not an Amazon/honto/O'Reilly product page (those have dedicated extractors).",
              gate: {
                kind: "websiteFlag",
                flag: "scanUrlForIsbn",
              },
              registryRef: "isbnHtmlStrategies",
            },
          ],
        },
      ],
    },
    {
      kind: "stage",
      stage: {
        id: "assemble-result",
        name: "Assemble the result",
        summary: "Combines everything: website match, duplicate status, metadata, the winning ISBN, social-account detection, a detected content kind, and an instant favicon.",
        detail: "The favicon comes from the DuckDuckGo icon service (no scrape). The detected content kind pre-selects a matching built-in Media Type on the create form.",
        gate: {
          kind: "always",
        },
        registryRef: "contentKinds",
        configurable: true,
        precedences: [
          {
            id: "isbn-sources",
            title: "ISBN sources (first match wins)",
            mode: "first-non-null",
            sources: [
              {
                id: "isbn-from-asin",
                label: "Amazon ASIN",
              },
              {
                id: "isbn-from-amazon-page",
                label: "Amazon page scrape",
              },
              {
                id: "isbn-from-honto-page",
                label: "honto.jp page scrape",
              },
              {
                id: "isbn-from-oreilly",
                label: "O'Reilly path segment",
              },
              {
                id: "isbn-from-generic-page",
                label: "Generic page scrape",
              },
            ],
          },
          {
            id: "isbn-lookup-providers",
            title: "Book metadata lookup for the resolved ISBN (a follow-up request, first match wins)",
            mode: "first-non-null",
            sources: [
              {
                id: "open-library",
                label: "Open Library",
              },
              {
                id: "google-books",
                label: "Google Books",
              },
              {
                id: "kavita-library",
                label: "Kavita library",
                gate: {
                  kind: "connector",
                  connector: "kavita",
                },
              },
            ],
          },
        ],
      },
    },
    {
      kind: "stage",
      stage: {
        id: "cache-store",
        name: "Scan cache store",
        summary: "The finished result is cached briefly so an immediate re-scan is served instantly.",
        detail: "Skipped when identity fields were supplied, so identity-aware duplicate results are never cached.",
        gate: {
          kind: "always",
        },
      },
    },
  ],
};
