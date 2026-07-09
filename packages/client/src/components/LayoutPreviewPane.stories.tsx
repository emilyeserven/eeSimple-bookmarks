import type { Meta, StoryObj } from "@storybook/react-vite";

import { http, HttpResponse } from "msw";

import { LayoutPreviewPane } from "./LayoutPreviewPane";
import { categoryWorkbench } from "./workbench/category";
import { apiHandlers } from "../test-utils/story-mocks";

/**
 * The Page Layouts preview pane (#1225) rendered for the Category kind. The "Sample — all fields filled
 * in" entity is selected by default, so the preview shows every placeable field with content regardless
 * of the mocked data; use the View/Edit toggle and the picker to explore. Renders through the same
 * `LayoutDrivenTabBody` the real Category View/Edit pages use, so what you see matches the live pages.
 */
const meta = {
  title: "Components/LayoutPreviewPane",
  component: LayoutPreviewPane,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/entity-layouts", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
  args: {
    kind: "category",
    layout: categoryWorkbench.defaultLayout ?? {
      tabs: [],
    },
  },
} satisfies Meta<typeof LayoutPreviewPane>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Category preview — Sample entity, View mode by default. */
export const Category: Story = {};
