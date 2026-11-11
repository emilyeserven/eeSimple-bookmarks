import type { MymindImportInput, MymindImportResult } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MymindImportPanel } from "./MymindImportPanel";
import { renderWithRouter } from "../test-utils/router";
import { resetToastSpies } from "../test-utils/toastSpies";

const importMymind = vi.fn<(input: MymindImportInput) => Promise<MymindImportResult>>();

vi.mock("../hooks/useCategories", async importOriginal => ({
  ...await importOriginal<typeof import("../hooks/useCategories")>(),
  useCategories: () => ({
    data: [],
  }),
}));

vi.mock("../lib/api/imports", () => ({
  importApi: {
    importMymind: (input: MymindImportInput) => importMymind(input),
  },
}));

const CSV = [
  "﻿id,type,title,url,content,note,tags,created",
  "1,Article,Met identity,https://brand.test/met,,\"nice\",\"des: Wolff,museum\",2025-02-08T19:04:17Z",
  "2,Image,Hello sign,https://brand.test/met,,,\"typography\",2025-02-08T19:05:00Z",
  "3,Note,,,\"A quote\",,quote,2025-03-27T01:29:43Z",
].join("\n");

function upload(text: string, name = "cards.csv") {
  const file = new File([text], name, {
    type: "text/csv",
  });
  fireEvent.change(screen.getByLabelText("cards.csv"), {
    target: {
      files: [file],
    },
  });
}

describe("MymindImportPanel", () => {
  beforeEach(() => {
    importMymind.mockReset();
    resetToastSpies();
  });

  it("previews the parsed export and imports the merged cards", async () => {
    importMymind.mockImplementation(async input => ({
      createdTagCount: 3,
      results: input.cards.map(card => ({
        title: card.title,
        url: card.url,
        outcome: "created" as const,
        bookmarkId: "b",
        error: null,
      })),
    }));
    await renderWithRouter(<MymindImportPanel />, {
      paths: ["/bookmarks"],
    });
    upload(CSV);

    expect(await screen.findByText("3 cards → 2 bookmarks with 4 distinct tags.")).toBeInTheDocument();
    expect(screen.getByText("Nested tag groups: des (1)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", {
      name: "Import",
    }));
    await waitFor(() => expect(importMymind).toHaveBeenCalledTimes(1));
    const sent = importMymind.mock.calls[0]?.[0];
    expect(sent?.cards.map(card => card.title)).toEqual(["Met identity", "A quote"]);
    expect(sent?.options).not.toHaveProperty("includeUrlless");
    expect(await screen.findByText("2 bookmarks created, 0 already saved, 0 failed, 3 new tags.")).toBeInTheDocument();
  });

  it("skips URL-less cards when that option is turned off", async () => {
    importMymind.mockResolvedValue({
      createdTagCount: 0,
      results: [],
    });
    await renderWithRouter(<MymindImportPanel />);
    upload(CSV);
    fireEvent.click(await screen.findByLabelText("Import cards without a URL"));
    expect(await screen.findByText("1 cards without a URL will be skipped.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {
      name: "Import",
    }));
    await waitFor(() => expect(importMymind).toHaveBeenCalledTimes(1));
    expect(importMymind.mock.calls[0]?.[0].cards).toHaveLength(1);
  });

  it("rejects a CSV that isn't a mymind export", async () => {
    await renderWithRouter(<MymindImportPanel />);
    upload("name,link\nfoo,https://x.test\n", "other.csv");
    expect(await screen.findByText("This doesn't look like a mymind cards.csv export.")).toBeInTheDocument();
    expect(screen.queryByRole("button", {
      name: "Import",
    })).not.toBeInTheDocument();
  });
});
