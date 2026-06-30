import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { LinkParsingSettings } from "./LinkParsingSettings";

const handlers = [
  http.get("/api/app-settings/shortener-ignore-list", () =>
    HttpResponse.json(["bit.ly", "t.co"])),
  http.get("/api/app-settings/redirect-ignore-list", () =>
    HttpResponse.json(["docs.google.com"])),
  http.get("/api/app-settings/custom-strip-params", () =>
    HttpResponse.json(["ref", "source"])),
];

const meta = {
  title: "Components/LinkParsingSettings",
  component: LinkParsingSettings,
  parameters: {
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof LinkParsingSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The three URL-parsing cards populated with a few configured domains/params. */
export const Default: Story = {};

/** All three lists empty — each card shows its "none configured" empty state. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/shortener-ignore-list", () => HttpResponse.json([])),
        http.get("/api/app-settings/redirect-ignore-list", () => HttpResponse.json([])),
        http.get("/api/app-settings/custom-strip-params", () => HttpResponse.json([])),
      ],
    },
  },
};
