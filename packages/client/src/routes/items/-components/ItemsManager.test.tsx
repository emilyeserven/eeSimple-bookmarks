import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ItemsManager } from "./ItemsManager";

import { useNotificationStore } from "@/stores/notificationStore";
import { makeItem } from "@/test-utils/factories";
import { renderWithRouter } from "@/test-utils/router";

/**
 * Reference component test: stub `fetch` for the API, render inside the shared router harness, and
 * assert on the real notification store rather than mocking the toast stack.
 */
function stubApi(items = [makeItem()]) {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (method === "GET") return Response.json(items);
    if (method === "PATCH") return Response.json(items[0]);
    return new Response(null, {
      status: 204,
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ItemsManager", () => {
  it("lists items from the API", async () => {
    stubApi([makeItem({
      name: "Alpha",
    })]);
    await renderWithRouter(<ItemsManager />);
    expect(await screen.findByText("Alpha")).toBeInTheDocument();
  });

  it("auto-saves the description on blur and records a field-named toast", async () => {
    const fetchMock = stubApi();
    await renderWithRouter(<ItemsManager />);
    const textarea = await screen.findByLabelText("Description");
    fireEvent.change(textarea, {
      target: {
        value: "New text",
      },
    });
    fireEvent.blur(textarea);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/items/item-1", expect.objectContaining({
        method: "PATCH",
      }));
    });
    await waitFor(() => {
      expect(useNotificationStore.getState().notifications[0]?.message).toBe("Updated Description");
    });
  });
});
