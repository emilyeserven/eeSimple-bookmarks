import type { ColumnDef } from "@tanstack/react-table";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataTable } from "./data-table";

interface Row {
  id: string;
  name: string;
  children?: Row[];
}

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({
      row,
    }) => (
      <div>
        <span>{row.original.name}</span>
        <button
          type="button"
          data-no-row-click
          onClick={() => row.original}
        >
          {`action-${row.original.id}`}
        </button>
      </div>
    ),
  },
];

const data: Row[] = [
  {
    id: "1",
    name: "Alpha",
  },
  {
    id: "2",
    name: "Beta",
  },
];

describe("DataTable", () => {
  it("renders headers and a row per datum", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
      />,
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("shows the empty message when there are no rows", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="Nothing here"
      />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("fires onRowClick for a click on a plain cell", () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        onRowClick={onRowClick}
      />,
    );
    fireEvent.click(screen.getByText("Alpha"));
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick.mock.calls[0][0]).toEqual(data[0]);
  });

  it("does not fire onRowClick for clicks on a [data-no-row-click] control", () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        onRowClick={onRowClick}
      />,
    );
    fireEvent.click(screen.getByText("action-1"));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("renders nested rows when expanded via getSubRows", () => {
    const tree: Row[] = [
      {
        id: "p",
        name: "Parent",
        children: [
          {
            id: "c",
            name: "Child",
          },
        ],
      },
    ];
    render(
      <DataTable
        columns={[
          {
            id: "name",
            header: "Name",
            cell: ({
              row,
            }) => (
              <button
                type="button"
                onClick={row.getToggleExpandedHandler()}
              >
                {row.original.name}
              </button>
            ),
          },
        ]}
        data={tree}
        getSubRows={row => row.children}
      />,
    );
    // Collapsed by default: the child is not shown.
    expect(screen.queryByText("Child")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Parent"));
    expect(screen.getByText("Child")).toBeInTheDocument();
  });
});
