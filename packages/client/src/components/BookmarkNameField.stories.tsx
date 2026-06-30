import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { useBookmarkScanHandlers } from "./useBookmarkScanHandlers";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkNameField } from "./BookmarkNameField";
import { useFetchMetadata } from "../hooks/useFetchMetadata";
import { useFetchTitle } from "../hooks/useFetchTitle";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { apiHandlers } from "../test-utils/story-mocks";

type ScanHandlers = ReturnType<typeof useBookmarkScanHandlers>;
const noopRunFetchTitle = (async () => {}) as ScanHandlers["runFetchTitle"];
const noopRunYouTubeEnrichment = (async () => {}) as ScanHandlers["runYouTubeEnrichment"];

interface NameFieldHostProps {
  form: BookmarkFormApi;
  titleFetch?: { previous: string } | null;
}

/** Supplies the real fetch-title / fetch-metadata mutation results the field reads. */
function NameFieldHost({
  form, titleFetch = null,
}: NameFieldHostProps) {
  const fetchTitle = useFetchTitle();
  const fetchMetadata = useFetchMetadata();
  return (
    <div className="max-w-xl">
      <BookmarkNameField
        form={form}
        fetchTitle={fetchTitle}
        fetchMetadata={fetchMetadata}
        titleFetch={titleFetch}
        onTitleEdited={() => {}}
        undoTitleFetch={() => {}}
        runFetchTitle={noopRunFetchTitle}
        runYouTubeEnrichment={noopRunYouTubeEnrichment}
        isReportingTitle={false}
        setIsReportingTitle={() => {}}
        expectedTitle=""
        setExpectedTitle={() => {}}
        onNameBlur={() => {}}
      />
    </div>
  );
}

const meta = {
  title: "Bookmarks/BookmarkNameField",
  component: BookmarkNameField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkNameField>;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com/article",
        title: "An example article",
      }}
    >
      {form => <NameFieldHost form={form} />}
    </BookmarkFormHost>
  ),
};

export const AfterTitleFetch: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com/article",
        title: "Fetched title",
      }}
    >
      {form => (
        <NameFieldHost
          form={form}
          titleFetch={{
            previous: "Old title",
          }}
        />
      )}
    </BookmarkFormHost>
  ),
};
