import type { SectionEntry } from "@eesimple/types";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

  it("collapses a single section to its own completed/unfinished summary", () => {
    render(
      <SectionEntryList
        sections={[entry({
          name: "Chapter 1",
          children: [
            entry({
              id: "c1",
              name: "Sub A",
              completed: true,
            }),
            entry({
              id: "c2",
              name: "Sub B",
              completed: false,
            }),
          ],
        })]}
      />,
    );
    // Children are visible while expanded.
    expect(screen.getByText("Sub A")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {
      name: "Collapse Chapter 1",
    }));
    // Children hidden, replaced by the section's own summary.
    expect(screen.queryByText("Sub A")).toBeNull();
    expect(screen.getByText("1 completed, 1 unfinished")).toBeInTheDocument();
  });

  it("collapses the whole block to a total summary across all entries", () => {
    render(
      <SectionEntryList
        sections={[
          entry({
            id: "s1",
            name: "One",
            completed: true,
          }),
          entry({
            id: "s2",
            name: "Two",
            completed: false,
          }),
          entry({
            id: "s3",
            name: "Three",
            completed: false,
          }),
        ]}
      />,
    );
    expect(screen.getByText("One")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {
      name: "Collapse all sections",
    }));
    expect(screen.queryByText("One")).toBeNull();
    expect(screen.getByText("1 completed, 2 unfinished")).toBeInTheDocument();
  });

  it("renders no checkboxes without onToggleCompleted (view stays read-only)", () => {
    render(
      <SectionEntryList
        sections={[entry({
          completed: true,
        })]}
      />,
    );
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("with onToggleCompleted, renders a clickable done-checkbox per entry and child", () => {
    const onToggle = vi.fn();
    render(
      <SectionEntryList
        sections={[entry({
          completed: true,
          children: [entry({
            id: "c1",
            name: "Sub",
          })],
        })]}
        onToggleCompleted={onToggle}
      />,
    );
    const boxes = screen.getAllByRole("checkbox", {
      name: "Completed",
    });
    expect(boxes).toHaveLength(2);
    expect(boxes[0]).toBeChecked();
    expect(boxes[1]).not.toBeChecked();
    // Unchecking the completed parent calls back with its id and the next state.
    fireEvent.click(boxes[0]);
    expect(onToggle).toHaveBeenCalledWith("s1", false);
    fireEvent.click(boxes[1]);
    expect(onToggle).toHaveBeenCalledWith("c1", true);
  });
});
