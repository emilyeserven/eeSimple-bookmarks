import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BookmarkVideoEditForm } from "./BookmarkVideoEditForm";
import { makeBookmark } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

let connectorsEnabled = true;

vi.mock("../hooks/useConnectors", () => ({
  useConnectors: () => ({
    data: {
      instagramReelArchive: {
        enabled: connectorsEnabled,
      },
    },
  }),
}));

const DETAIL_PATH = "/bookmarks/$bookmarkId";

describe("BookmarkVideoEditForm", () => {
  it("explains that reel archiving isn't configured when the connector is off", async () => {
    connectorsEnabled = false;
    await renderWithRouter(
      <BookmarkVideoEditForm
        bookmark={makeBookmark({
          url: "https://www.instagram.com/reel/abc123/",
        })}
      />,
      {
        paths: [DETAIL_PATH],
      },
    );

    expect(screen.getByText(/isn't configured/)).toBeInTheDocument();
  });

  it("explains that a non-reel bookmark has nothing to archive", async () => {
    connectorsEnabled = true;
    await renderWithRouter(
      <BookmarkVideoEditForm
        bookmark={makeBookmark({
          url: "https://example.com",
          reelArchive: null,
        })}
      />,
      {
        paths: [DETAIL_PATH],
      },
    );

    expect(screen.getByText(/isn't an Instagram reel/)).toBeInTheDocument();
  });

  it("offers the archive trigger for a reel bookmark when the connector is enabled", async () => {
    connectorsEnabled = true;
    await renderWithRouter(
      <BookmarkVideoEditForm
        bookmark={makeBookmark({
          url: "https://www.instagram.com/reel/abc123/",
        })}
      />,
      {
        paths: [DETAIL_PATH],
      },
    );

    expect(screen.getByRole("button", {
      name: "Archive reel video",
    })).toBeInTheDocument();
  });

  it("offers a re-archive trigger and a player for a bookmark with an existing archive", async () => {
    connectorsEnabled = true;
    await renderWithRouter(
      <BookmarkVideoEditForm
        bookmark={makeBookmark({
          url: "https://www.instagram.com/reel/abc123/",
          reelArchive: {
            url: "/api/bookmarks/bm/reel-archive?v=1",
            contentType: "video/mp4",
            byteSize: 1024,
            width: 720,
            height: 1280,
            durationSeconds: null,
            sourceUrl: "https://www.instagram.com/reel/abc123/",
            createdAt: "2026-06-01T00:00:00.000Z",
          },
        })}
      />,
      {
        paths: [DETAIL_PATH],
      },
    );

    expect(screen.getByRole("button", {
      name: "Re-archive reel video",
    })).toBeInTheDocument();
    expect(screen.getByText("Archived reel")).toBeInTheDocument();
  });
});
