import type {
  Category,
  MediaType,
  TagNode,
  YouTubeChannel,
} from "@eesimple/types";

import { DEFAULT_BOOKMARK_ADD_FORM_SETTINGS } from "@eesimple/types";
import { HttpResponse, http } from "msw";

import {
  makeBookmark,
  makeCategory,
  makeCustomProperty,
  makeMediaType,
  makeTag,
  makeYouTubeChannel,
} from "./factories";

const NOW = "2026-06-01T00:00:00.000Z";

export const sampleTagTree: TagNode[] = [
  {
    ...makeTag({
      id: "tag-dev",
      name: "dev",
      slug: "dev",
    }),
    children: [
      {
        ...makeTag({
          id: "tag-tools",
          name: "tools",
          slug: "tools",
          parentId: "tag-dev",
        }),
        children: [
          {
            ...makeTag({
              id: "tag-cli",
              name: "cli",
              slug: "cli",
              parentId: "tag-tools",
            }),
            children: [],
          },
        ],
      },
    ],
  },
];

export const sampleCategories: Category[] = [
  makeCategory({
    id: "cat-default",
    name: "Default",
    slug: "default",
    description: "The category bookmarks use when none is chosen.",
    builtIn: true,
    isHomepage: true,
  }),
  makeCategory({
    id: "cat-workflow",
    name: "Workflow",
    slug: "workflow",
    description: "Properties that drive triage and ordering.",
    icon: "Workflow",
  }),
  makeCategory({
    id: "cat-content",
    name: "Content",
    slug: "content",
    description: "Properties that describe what a bookmark is about.",
    icon: "BookOpen",
  }),
];

export const sampleProperties = [
  makeCustomProperty({
    id: "prop-priority",
    name: "Priority",
    slug: "priority",
    type: "number",
    numberMin: 0,
    numberMax: 10,
    categoryIds: ["cat-workflow"],
  }),
  makeCustomProperty({
    id: "prop-effort",
    name: "Effort",
    slug: "effort",
    type: "number",
    numberMin: 0,
    numberMax: 10,
    unitSingular: "point",
    unitPlural: "points",
    categoryIds: ["cat-workflow"],
  }),
  makeCustomProperty({
    id: "prop-score",
    name: "Score",
    slug: "score",
    type: "calculate",
    operandPropertyIds: ["prop-priority", "prop-effort"],
    categoryIds: ["cat-workflow"],
  }),
  makeCustomProperty({
    id: "prop-reviewed",
    name: "Reviewed",
    slug: "reviewed",
    type: "boolean",
    categoryIds: ["cat-content"],
    showInForm: true,
  }),
];

export const sampleMediaTypes: MediaType[] = [
  makeMediaType({
    id: "media-video",
    name: "Video",
    slug: "video",
    builtIn: true,
    bookmarkCount: 4,
  }),
  makeMediaType({
    id: "media-article",
    name: "Article",
    slug: "article",
    builtIn: true,
    sortOrder: 1,
    bookmarkCount: 7,
  }),
  makeMediaType({
    id: "media-newsletter",
    name: "Newsletter",
    slug: "newsletter",
    sortOrder: 2,
    bookmarkCount: 1,
  }),
];

export const sampleChannels: YouTubeChannel[] = [
  makeYouTubeChannel({
    id: "channel-veritasium",
    channelKey: "@veritasium",
    name: "Veritasium",
    slug: "veritasium",
    bookmarkCount: 3,
  }),
  makeYouTubeChannel({
    id: "channel-fireship",
    channelKey: "@fireship",
    name: "Fireship",
    slug: "fireship",
    bookmarkCount: 5,
  }),
];

export const sampleBookmark = makeBookmark({
  id: "bookmark-github",
  url: "https://github.com",
  title: "GitHub",
  description: "Where the code lives.",
  categoryId: "cat-workflow",
  website: {
    id: "site-github",
    domain: "github.com",
    siteName: "GitHub",
    slug: "github",
  },
  tags: [
    {
      id: "tag-cli",
      name: "cli",
      slug: "cli",
      parentId: "tag-tools",
    },
  ],
  numberValues: [
    {
      propertyId: "prop-priority",
      value: 8,
    },
    {
      propertyId: "prop-effort",
      value: 3,
    },
    {
      propertyId: "prop-score",
      value: 11,
    },
  ],
  booleanValues: [
    {
      propertyId: "prop-reviewed",
      value: true,
    },
  ],
  priority: 10,
});

/** MSW handlers covering every `/api/*` route the data-driven stories read. */
export const apiHandlers = [
  http.get("/api/tags", () => HttpResponse.json([])),
  http.get("/api/tags/tree", () => HttpResponse.json(sampleTagTree)),
  http.get("/api/custom-properties", () => HttpResponse.json(sampleProperties)),
  http.get("/api/categories", () => HttpResponse.json(sampleCategories)),
  http.get("/api/homepage-tags", () => HttpResponse.json({
    tagIds: [],
  })),
  http.get("/api/websites", () => HttpResponse.json(sampleBookmark.website
    ? [{
      ...sampleBookmark.website,
      createdAt: NOW,
    }]
    : [])),
  http.get("/api/websites/lookup", () => HttpResponse.json({
    domain: "github.com",
    exists: true,
    siteName: "GitHub",
  })),
  http.get("/api/media-types", () => HttpResponse.json(sampleMediaTypes)),
  http.get("/api/youtube-channels", () => HttpResponse.json(sampleChannels)),
  http.get("/api/app-settings/advanced", () => HttpResponse.json({
    coolifyLinkEnabled: true,
    coolifyUrl: "https://coolify.example.com",
    docsLinkEnabled: true,
    storybookLinkEnabled: true,
    drizzleGatewayLinkEnabled: true,
    drizzleGatewayUrl: "http://localhost:4983",
  })),
  http.get(
    "/api/app-settings/bookmark-add-form",
    () => HttpResponse.json(DEFAULT_BOOKMARK_ADD_FORM_SETTINGS),
  ),
  http.put(
    "/api/app-settings/bookmark-add-form",
    async ({
      request,
    }) => HttpResponse.json(await request.json()),
  ),
  http.put("/api/custom-properties/:id", () => HttpResponse.json(sampleProperties[0])),
  http.get("/api/bookmarks/homepage", () => HttpResponse.json([sampleBookmark])),
  http.post("/api/bookmarks", () => HttpResponse.json(sampleBookmark, {
    status: 201,
  })),
  http.post("/api/categories", () => HttpResponse.json(sampleCategories[0], {
    status: 201,
  })),
  http.post("/api/custom-properties", () => HttpResponse.json(sampleProperties[0], {
    status: 201,
  })),
];
