import type { ImportItemAdvancedEditAddModalState } from "./useImportItemAdvancedEdit";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ImportItemAdvancedEditModals } from "./ImportItemAdvancedEditModals";
import { apiHandlers } from "../test-utils/story-mocks";

const noop = () => {};

/** A closed add-modal state with all six inline-create dialogs shut. */
function modalState(
  overrides: Partial<ImportItemAdvancedEditAddModalState> = {},
): ImportItemAdvancedEditAddModalState {
  return {
    addCategoryOpen: false,
    setAddCategoryOpen: noop,
    addMediaTypeOpen: false,
    setAddMediaTypeOpen: noop,
    addPublisherOpen: false,
    setAddPublisherOpen: noop,
    addAuthorOpen: false,
    setAddAuthorOpen: noop,
    addTagOpen: false,
    setAddTagOpen: noop,
    addLocationOpen: false,
    setAddLocationOpen: noop,
    ...overrides,
  };
}

const meta = {
  title: "Components/ImportItemAdvancedEditModals",
  component: ImportItemAdvancedEditModals,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    state: modalState(),
    tagIds: [],
    locationIds: [],
    authorIds: [],
    onCategoryChange: noop,
    onMediaTypeChange: noop,
    onTagsChange: noop,
    onLocationsChange: noop,
    onAuthorsChange: noop,
    onPublisherChange: noop,
  },
} satisfies Meta<typeof ImportItemAdvancedEditModals>;

export default meta;

type Story = StoryObj<typeof meta>;

/** All six inline-create modals closed (nothing visible). */
export const AllClosed: Story = {};

/** The "Create category" modal opened. */
export const AddCategoryOpen: Story = {
  args: {
    state: modalState({
      addCategoryOpen: true,
    }),
  },
};
