import type { SectionEntry } from "@eesimple/types";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionEntryList } from "./bookmarkPropertyRowKinds";

const entry = (overrides: Partial<SectionEntry> = {}): SectionEntry => ({
  id: "s1",
  name: "Chapter 1",
  type: "page",
  startValue: "1",
  ...overrides,
});

describe("SectionEntryList", () => {
  it("renders an entry's name as a link when it has an explicit url", () => {
    render(
      <SectionEntryList
        sections={[entry({
          name: "Intro",
          type: "timestamp",
          startValue: "0",
          url: "https://example.com/watch",
        })]}
      />,
    );
    const link = screen.getByRole("link", {
      name: "Intro",
    });
    expect(link).toHaveAttribute("href", "https://example.com/watch");
  });

  it("links a legacy url-type entry via its startValue", () => {
    render(
      <SectionEntryList
        sections={[entry({
          name: "Docs",
          type: "url",
          startValue: "https://legacy.example/page",
        })]}
      />,
    );
    expect(screen.getByRole("link", {
      name: "Docs",
    })).toHaveAttribute("href", "https://legacy.example/page");
  });

  it("renders a non-linked entry as plain text with its positional value", () => {
    render(
      <SectionEntryList
        sections={[entry({
          name: "Chapter 2",
          type: "page",
          startValue: "1",
          endValue: "10",
        })]}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Chapter 2")).toBeInTheDocument();
    expect(screen.getByText("1–10")).toBeInTheDocument();
  });

  it("renders children as a nested second tier, each with its own link", () => {
    render(
      <SectionEntryList
        sections={[entry({
          name: "Chapter 1",
          type: "url",
          startValue: "",
          children: [
            entry({
              id: "c1",
              name: "Flipper basics",
              type: "url",
              startValue: "",
              url: "https://example.com/v1",
            }),
            entry({
              id: "c2",
              name: "First flash",
              type: "url",
              startValue: "",
              url: "https://example.com/v2",
            }),
          ],
        })]}
      />,
    );
    expect(screen.getByRole("link", {
      name: "Flipper basics",
    })).toHaveAttribute("href", "https://example.com/v1");
    expect(screen.getByRole("link", {
      name: "First flash",
    })).toHaveAttribute("href", "https://example.com/v2");
  });

  it("shows an empty state when there are no sections", () => {
    render(<SectionEntryList sections={[]} />);
    expect(screen.getByText("No sections")).toBeInTheDocument();
  });
});
