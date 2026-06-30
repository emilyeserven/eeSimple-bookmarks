import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const meta = {
  title: "UI/Table",
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Table className="w-96">
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Drizzle ORM</TableCell>
          <TableCell>Docs</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>TanStack Router</TableCell>
          <TableCell>Library</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
