import type { ReactNode } from 'react';
import { Table, Skeleton, Text } from '@mantine/core';
import { ThemedPaper } from '../ThemedPaper';

export interface Column<T> {
  key: string;
  header: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render: (item: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  getRowKey: (item: T) => string;
  skeletonRows?: number;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No data available',
  getRowKey,
  skeletonRows = 5,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <ThemedPaper p="md">
        <Table>
          <Table.Thead>
            <Table.Tr>
              {columns.map((column) => (
                <Table.Th key={column.key} w={column.width} ta={column.align}>
                  {column.header}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <Table.Tr key={rowIndex}>
                {columns.map((column) => (
                  <Table.Td key={column.key} ta={column.align}>
                    <Skeleton height={20} width="80%" />
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ThemedPaper>
    );
  }

  if (data.length === 0) {
    return (
      <ThemedPaper p="xl">
        <Text c="dimmed" ta="center">
          {emptyMessage}
        </Text>
      </ThemedPaper>
    );
  }

  return (
    <ThemedPaper p="md">
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={column.key} w={column.width} ta={column.align}>
                {column.header}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((item, index) => (
            <Table.Tr key={getRowKey(item)}>
              {columns.map((column) => (
                <Table.Td key={column.key} ta={column.align}>
                  {column.render(item, index)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ThemedPaper>
  );
}

export default DataTable;
