import type { Meta, StoryObj } from "@storybook/react-vite";

import { RevealedWebsiteBanner } from "./RevealedWebsiteBanner";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { makeRevealedProps, makeWebsiteLookup } from "../test-utils/revealedFixtures";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/Revealed/RevealedWebsiteBanner",
  component: RevealedWebsiteBanner,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof RevealedWebsiteBanner>;

export default meta;

type Story = StoryObj;

export const ExistingWebsite: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com",
      }}
    >
      {() => (
        <RevealedWebsiteBanner
          {...makeRevealedProps({
            websiteLookup: makeWebsiteLookup({
              domain: "example.com",
              exists: true,
              siteName: "Example",
              mediaTypeId: null,
              shortener: null,
            }),
          })}
        />
      )}
    </BookmarkFormHost>
  ),
};

export const NewWebsite: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://new-site.com",
      }}
    >
      {() => (
        <RevealedWebsiteBanner
          {...makeRevealedProps({
            websiteSiteName: "New Site",
            websiteLookup: makeWebsiteLookup({
              domain: "new-site.com",
              exists: false,
              siteName: null,
              mediaTypeId: null,
              shortener: null,
            }),
          })}
        />
      )}
    </BookmarkFormHost>
  ),
};
