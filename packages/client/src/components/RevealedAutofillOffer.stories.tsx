import type { Meta, StoryObj } from "@storybook/react-vite";

import { RevealedAutofillOffer } from "./RevealedAutofillOffer";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { makeRevealedProps, makeWebsiteLookup } from "../test-utils/revealedFixtures";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/Revealed/RevealedAutofillOffer",
  component: RevealedAutofillOffer,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof RevealedAutofillOffer>;

export default meta;

type Story = StoryObj;

/** Offer is shown only for a new site (exists === false) that resolved to a domain. */
export const NewSiteOffer: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://new-site.com",
        categoryId: "cat-workflow",
      }}
    >
      {form => (
        <RevealedAutofillOffer
          form={form}
          {...makeRevealedProps({
            websiteLookup: makeWebsiteLookup({
              domain: "new-site.com",
              exists: false,
              siteName: null,
              shortener: null,
            }),
          })}
        />
      )}
    </BookmarkFormHost>
  ),
};
