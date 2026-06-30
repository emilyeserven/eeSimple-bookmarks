import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { ImportForm } from "./ImportForm";
import { apiHandlers } from "../test-utils/story-mocks";

const handlers = [
  ...apiHandlers,
  http.get("/api/newsletters", () =>
    HttpResponse.json([
      {
        id: "nl-brew",
        name: "Morning Brew",
        slug: "morning-brew",
        defaultCategoryId: null,
        createdAt: "2026-06-01T00:00:00.000Z",
      },
    ])),
];

const meta = {
  title: "Components/ImportForm",
  component: ImportForm,
  parameters: {
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof ImportForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The submit-style create form, defaulting to the "Paste content" source. */
export const Default: Story = {};

/** Arriving with an import group preselected (the Advanced section opens). */
export const PreselectedGroup: Story = {
  args: {
    initialNewsletterId: "nl-brew",
  },
};
