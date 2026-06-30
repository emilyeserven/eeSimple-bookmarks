import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocationPlaceTypesSettings } from "./LocationPlaceTypesSettings";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Settings/LocationPlaceTypesSettings",
  component: LocationPlaceTypesSettings,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof LocationPlaceTypesSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
