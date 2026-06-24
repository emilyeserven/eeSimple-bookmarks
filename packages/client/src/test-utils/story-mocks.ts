import type {
  Category,
  MediaType,
  TagNode,
  YouTubeChannel,
} from "@eesimple/types";

import { HttpResponse, http } from "msw";

import { makeBookmark, makeCustomProperty } from "./factories";

const NOW = "2026-06-01T00:00:00.000Z";

export const sampleTagTree: TagNode[] = [
  {
    id: "tag-dev",
    name: "dev",
    slug: "dev",
    parentId: null,
    createdAt: NOW,
    children: [
      {
        id: "tag-tools",
        name: "tools",
        slug: "tools",
        parentId: "tag-dev",
        createdAt: NOW,
        children: [
          {
            id: "tag-cli",
            name: "cli",
            slug: "cli",
            parentId: "tag-tools",
            createdAt: NOW,
            children: [],
          },
        ],
      },
    ],
  },
];

export const sampleCategories: Category[] = [
  {
    id: "cat-default",
    name: "Default",
    slug: "default",
    description: "The category bookmarks use when none is chosen.",
    icon: null,
    builtIn: true,
    isHomepage: true,
    createdAt: NOW,
  },
  {
    id: "cat-workflow",
    name: "Workflow",
    slug: "workflow",
    description: "Properties that drive triage and ordering.",
    icon: "Workflow",
    builtIn: false,
    isHomepage: false,
    createdAt: NOW,
  },
  {
    id: "cat-content",
    name: "Content",
    slug: "content",
    description: "Properties that describe what a bookmark is about.",
    icon: "BookOpen",
    builtIn: false,
    isHomepage: false,
    createdAt: NOW,
  },
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
  {
    id: "media-video",
    name: "Video",
    slug: "video",
    icon: null,
    builtIn: true,
    sortOrder: 0,
    parentId: null,
    createdAt: NOW,
    bookmarkCount: 4,
  },
  {
    id: "media-article",
    name: "Article",
    slug: "article",
    icon: null,
    builtIn: true,
    sortOrder: 1,
    parentId: null,
    createdAt: NOW,
    bookmarkCount: 7,
  },
  {
    id: "media-newsletter",
    name: "Newsletter",
    slug: "newsletter",
    icon: null,
    builtIn: false,
    sortOrder: 2,
    parentId: null,
    createdAt: NOW,
    bookmarkCount: 1,
  },
];

export const sampleChannels: YouTubeChannel[] = [
  {
    id: "channel-veritasium",
    channelKey: "@veritasium",
    name: "Veritasium",
    slug: "veritasium",
    selfIds: [],
    createdAt: NOW,
    bookmarkCount: 3,
    authorIds: [],
    websiteIds: [],
    publisherIds: [],
  },
  {
    id: "channel-fireship",
    channelKey: "@fireship",
    name: "Fireship",
    slug: "fireship",
    selfIds: [],
    createdAt: NOW,
    bookmarkCount: 5,
    authorIds: [],
    websiteIds: [],
    publisherIds: [],
  },
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
  http.get("/api/categories/:id/root-tags", () => HttpResponse.json({
    tagIds: [],
  })),
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
  })),
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
