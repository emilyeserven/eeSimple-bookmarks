import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { LocationForm } from "./LocationForm";
import { apiHandlers } from "../test-utils/story-mocks";

const handlers = [
  ...apiHandlers,
  http.get("/api/locations", () => HttpResponse.json([])),
  http.get("/api/locations/tree", () => HttpResponse.json([])),
];

const meta = {
  title: "Components/LocationForm",
  component: LocationForm,
  args: {
    onCreated: () => {},
  },
  parameters: {
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof LocationForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The submit-driven create form: geocoder lookup, fields, parent picker, and ancestor-chain editor. */
export const Default: Story = {};
