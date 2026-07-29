import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

import {
  BooleanRowCell,
  ChoicesRowCell,
  DateTimeRowCell,
  FileRowCell,
  NumberRowCell,
  ProgressRowCell,
  RatingRowCell,
  SectionsRowCell,
  TextRowCell,
} from "./bookmarkPropertyRowKinds";

/** A shared empty filter — the quick-filter link only needs a valid (possibly empty) search. */
const search: BookmarkSearch = {};

/** Property rows render `<dt>/<dd>` pairs, so wrap each story in a `<dl>` for valid markup. */
function Row({
  children,
}: { children: ReactNode }) {
  return <dl className="max-w-md">{children}</dl>;
}

const meta = {
  title: "Bookmarks/BookmarkPropertyRowKinds",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** A plain number property row. */
export const Number: Story = {
  render: () => (
    <Row>
      <NumberRowCell
        row={{
          id: "n1",
          name: "Pages",
          isCalculated: false,
          value: "384",
          search,
        }}
      />
    </Row>
  ),
};

/** A calculated number row (e.g. a derived reading time). */
export const CalculatedNumber: Story = {
  render: () => (
    <Row>
      <NumberRowCell
        row={{
          id: "n2",
          name: "Reading time",
          isCalculated: true,
          value: "6h 24m",
          search,
        }}
      />
    </Row>
  ),
};

/** A boolean row shown as Yes with a label colon. */
export const Boolean: Story = {
  render: () => (
    <Row>
      <BooleanRowCell
        row={{
          id: "b1",
          name: "Favorite",
          rawValue: true,
          value: "Yes",
          showLabelColon: true,
          showValueBeforeLabel: false,
          clickableInView: false,
          search,
        }}
      />
    </Row>
  ),
};

/** A date-time row with a formatted date value. */
export const DateTime: Story = {
  render: () => (
    <Row>
      <DateTimeRowCell
        row={{
          id: "d1",
          name: "Published",
          value: "Jan 4, 2026",
          search,
        }}
      />
    </Row>
  ),
};

/** A star-display rating row at 4 of 5 with half-steps allowed. */
export const Rating: Story = {
  render: () => (
    <Row>
      <RatingRowCell
        row={{
          id: "r1",
          name: "Rating",
          value: 4,
          valueEnd: null,
          max: 5,
          allowHalf: true,
          label: "4 of 5",
          caption: null,
          display: "stars",
          rangeIncludeStart: false,
          search,
        }}
      />
    </Row>
  ),
};

/** A non-image file row linking to the stored file. */
export const File: Story = {
  render: () => (
    <Row>
      <FileRowCell
        row={{
          id: "f1",
          name: "Manuscript",
          isImage: false,
          url: "https://example.com/manuscript.pdf",
          filename: "manuscript.pdf",
          search,
        }}
      />
    </Row>
  ),
};

/** A checkbox-display choices row with two selected options. */
export const Choices: Story = {
  render: () => (
    <Row>
      <ChoicesRowCell
        row={{
          id: "c1",
          name: "Genres",
          items: [
            {
              value: "sci-fi",
              label: "Sci-Fi",
            },
            {
              value: "fantasy",
              label: "Fantasy",
            },
          ],
          selectedValues: ["sci-fi", "fantasy"],
          displayMode: "checkbox",
          search,
        }}
      />
    </Row>
  ),
};

/** A progress row at 120 of 384 with the formatted percentage. */
export const Progress: Story = {
  render: () => (
    <Row>
      <ProgressRowCell
        row={{
          id: "p1",
          name: "Progress",
          current: 120,
          total: 384,
          formatted: "120 / 384 (31%)",
          search,
        }}
      />
    </Row>
  ),
};

/** A sections row listing two page-type chapter entries. */
export const Sections: Story = {
  render: () => (
    <Row>
      <SectionsRowCell
        row={{
          id: "s1",
          name: "Chapters",
          exhaustive: false,
          sections: [
            {
              id: "ch1",
              name: "Introduction",
              type: "page",
              startValue: "1",
              endValue: "12",
            },
            {
              id: "ch2",
              name: "Getting Started",
              type: "page",
              startValue: "13",
              endValue: "40",
            },
          ],
          formatted: "2 sections",
          search,
        }}
      />
    </Row>
  ),
};

/** A text row with an attached external link (an ISBN with a store link). */
export const Text: Story = {
  render: () => (
    <Row>
      <TextRowCell
        row={{
          id: "t1",
          name: "ISBN",
          value: "9780000000000",
          links: [
            {
              label: "Amazon",
              url: "https://www.amazon.com/dp/0000000000",
            },
          ],
        }}
      />
    </Row>
  ),
};
