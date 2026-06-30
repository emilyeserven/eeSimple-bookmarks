import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { CreateAutofillRule } from "./AutofillRuleForms";
import { apiHandlers } from "../../test-utils/story-mocks";

const handlers = [
  ...apiHandlers,
  http.get("/api/locations/tree", () => HttpResponse.json([])),
];

const meta = {
  title: "Components/Panel/CreateAutofillRule",
  component: CreateAutofillRule,
  parameters: {
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof CreateAutofillRule>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The panel's inline create form for a new autofill rule. */
export const Default: Story = {};
