import type {
  Bookmark,
  Category,
  CustomProperty,
  CustomPropertyTagNode,
  TagNode,
} from "@eesimple/types";

import { HttpResponse, http } from "msw";

const NOW = "2026-06-01T00:00:00.000Z";

export const sampleTagTree: TagNode[] = [
  {
    id: "tag-dev",
    name: "dev",
    parentId: null,
    createdAt: NOW,
    children: [
      {
        id: "tag-tools",
        name: "tools",
        parentId: "tag-dev",
        createdAt: NOW,
        children: [
          {
            id: "tag-cli",
            name: "cli",
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
    id: "cat-workflow",
    name: "Workflow",
    description: "Properties that drive triage and ordering.",
    icon: "Workflow",
    createdAt: NOW,
  },
  {
    id: "cat-content",
    name: "Content",
    description: "Properties that describe what a bookmark is about.",
    icon: "BookOpen",
    createdAt: NOW,
  },
];

export const sampleProperties: CustomProperty[] = [
  {
    id: "prop-priority",
    name: "Priority",
    type: "number",
    numberMin: 0,
    numberMax: 10,
    categoryIds: ["cat-workflow"],
    createdAt: NOW,
  },
  {
    id: "prop-topic",
    name: "Topic",
    type: "tiered_tags",
    numberMin: null,
    numberMax: null,
    categoryIds: ["cat-content"],
    createdAt: NOW,
  },
];

export const samplePropertyTagTree: CustomPropertyTagNode[] = [
  {
    id: "ptag-web",
    propertyId: "prop-topic",
    name: "web",
    parentId: null,
    createdAt: NOW,
    children: [
      {
        id: "ptag-frontend",
        propertyId: "prop-topic",
        name: "frontend",
        parentId: "ptag-web",
        createdAt: NOW,
        children: [],
      },
    ],
  },
];

export const sampleBookmark: Bookmark = {
  id: "bookmark-github",
  url: "https://github.com",
  title: "GitHub",
  description: "Where the code lives.",
  tags: [
    {
      id: "tag-cli",
      name: "cli",
      parentId: "tag-tools",
    },
  ],
  numberValues: [
    {
      propertyId: "prop-priority",
      value: 8,
    },
  ],
  propertyTags: [
    {
      propertyId: "prop-topic",
      id: "ptag-frontend",
      name: "frontend",
      parentId: "ptag-web",
    },
  ],
  favorite: true,
  pinned: true,
  priority: 10,
  createdAt: NOW,
};

/** MSW handlers covering every `/api/*` route the data-driven stories read. */
export const apiHandlers = [
  http.get("/api/tags", () => HttpResponse.json([])),
  http.get("/api/tags/tree", () => HttpResponse.json(sampleTagTree)),
  http.get("/api/custom-properties", () => HttpResponse.json(sampleProperties)),
  http.get("/api/custom-properties/:id/tags", () => HttpResponse.json(samplePropertyTagTree)),
  http.get("/api/categories", () => HttpResponse.json(sampleCategories)),
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
