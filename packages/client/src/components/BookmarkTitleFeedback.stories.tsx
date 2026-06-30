import type { Meta, StoryObj } from "@storybook/react-vite";

import { TitleFetchFeedback } from "./BookmarkTitleFeedback";

const meta = {
  title: "Bookmarks/TitleFetchFeedback",
  component: TitleFetchFeedback,
  args: {
    isSuccess: false,
    isError: false,
    errorMessage: undefined,
    fetchedTitle: "Example Page Title",
    isReportingTitle: false,
    onStartReporting: () => {},
    expectedTitle: "",
    onExpectedTitleChange: () => {},
    onCancelReporting: () => {},
    getFormUrl: () => "https://example.com",
    getFormTitle: () => "Example Page Title",
  },
} satisfies Meta<typeof TitleFetchFeedback>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A successful fetch with the "Report it" prompt. */
export const Success: Story = {
  args: {
    isSuccess: true,
  },
};

/** The inline "report incorrect title" form expanded. */
export const Reporting: Story = {
  args: {
    isSuccess: true,
    isReportingTitle: true,
    expectedTitle: "The Real Title",
  },
};

/** A failed fetch with an error message and a file-issue button. */
export const Error: Story = {
  args: {
    isError: true,
    errorMessage: "Request timed out after 10s.",
  },
};
