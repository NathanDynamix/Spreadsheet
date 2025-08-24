import React, { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const SimpleSpreadsheetSort = () => {
  const [cells, setCells] = useState({
    '0,0': { value: 'Banana' },
    '1,0': { value: 'Apple' },
    '2,0': { value: 'Zebra' },
    '3,0': { value: 'Lemon' },
  });

  const ROWS = 4;
  const COLS = 1;

  const sortColumn = (order = 'asc') => {
    const sorted = Object.entries(cells)
      .filter(([key]) => key.endsWith(',0'))
      .sort(([aKey, aVal], [bKey, bVal]) => {
        const valA = aVal.value.toLowerCase();
        const valB = bVal.value.toLowerCase();
        return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });

    const newCells = { ...cells };
    sorted.forEach(([_, cell], index) => {
      newCells[`${index},0`] = { value: cell.value };
    });

    setCells(newCells);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4">Simple Sheet Sort</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => sortColumn('asc')}
          className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <ArrowUp size={16} className="mr-1" /> A → Z
        </button>
        <button
          onClick={() => sortColumn('desc')}
          className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <ArrowDown size={16} className="mr-1" /> Z → A
        </button>
      </div>

      <table className="w-full border border-gray-300">
        <thead>
          <tr><th className="border bg-gray-200 p-2">Item</th></tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }).map((_, row) => (
            <tr key={row}>
              <td className="border p-2">
                {cells[`${row},0`]?.value || ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SimpleSpreadsheetSort;