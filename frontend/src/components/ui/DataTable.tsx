import React from 'react';

export const DataTable = ({ columns, data }: { columns: any[]; data: any[] }) => {
  if (!data) {
    return null;
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((column) => (
            <th
              key={column.header}
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column) => (
              <td key={column.accessorKey} className="px-6 py-4 whitespace-nowrap">
                {column.cell ? column.cell({ row: { original: row } }) : row[column.accessorKey]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
