import { http, HttpResponse } from "msw";

import { makeItem } from "./factories";

/** Sample data shared by stories. */
export const sampleItems = [
  makeItem(),
  makeItem({
    id: "item-2",
    name: "Second item",
    slug: "second-item",
    description: "With a description",
  }),
];

/**
 * Default MSW handlers for data-driven stories (`parameters.msw.handlers`). MSW is a story-only tool
 * here — unit tests stub `fetch` or mock modules instead (see the `test-structure` skill).
 */
export const apiHandlers = [
  http.get("/api/items", () => HttpResponse.json(sampleItems)),
  http.post("/api/items", async ({
    request,
  }) => {
    const body = await request.json() as { name: string };
    return HttpResponse.json(makeItem({
      id: "item-new",
      name: body.name,
    }), {
      status: 201,
    });
  }),
  http.patch("/api/items/:id", () => HttpResponse.json(sampleItems[0])),
  http.delete("/api/items/:id", () => new HttpResponse(null, {
    status: 204,
  })),
];
