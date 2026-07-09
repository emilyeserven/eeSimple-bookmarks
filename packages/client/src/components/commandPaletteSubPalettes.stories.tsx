import type { Person } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  PeopleSubPalette,
  CategorySubPalette,
} from "./commandPaletteSubPalettes";
import { makeCategory } from "../test-utils/factories";

import { Command, CommandList } from "@/components/ui/command";

const categories = [
  makeCategory({
    id: "c1",
    name: "Reading",
  }),
  makeCategory({
    id: "c2",
    name: "Watch Later",
  }),
];

const people = [
  {
    id: "a1",
    name: "Ada Lovelace",
  },
  {
    id: "a2",
    name: "Alan Turing",
  },
] as unknown as Person[];

/** Sub-palettes render `CommandGroup`/`CommandItem`, so they need a `Command` + `CommandList` host. */
function CommandHost({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="w-80 rounded-md border">
      <Command>
        <CommandList>{children}</CommandList>
      </Command>
    </div>
  );
}

const meta = {
  title: "Components/CommandPaletteSubPalettes",
  component: CategorySubPalette,
} satisfies Meta<typeof CategorySubPalette>;

export default meta;

/** The "change category" sub-palette with a Back row and the current selection checked. */
export const Category: StoryObj = {
  render: () => (
    <CommandHost>
      <CategorySubPalette
        categories={categories}
        currentCategoryId="c1"
        onBack={() => {}}
        onSelect={() => {}}
        onCreateNew={() => {}}
      />
    </CommandHost>
  ),
};

/** The multi-select people sub-palette with one person already toggled on. */
export const People: StoryObj = {
  render: () => (
    <CommandHost>
      <PeopleSubPalette
        people={people}
        pendingPersonIds={["a1"]}
        onTogglePerson={() => {}}
        onBack={() => {}}
        onDone={() => {}}
        onCreateNew={() => {}}
      />
    </CommandHost>
  ),
};
