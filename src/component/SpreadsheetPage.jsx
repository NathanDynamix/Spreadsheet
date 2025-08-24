// pages/SpreadsheetPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SpreadsheetPage = () => {
  const navigate = useNavigate();

  // Dynamic data (you could generate more rows as needed)
  const [rows, setRows] = useState([
    { label: 'Jan', value: 10 },
    { label: 'Feb', value: 20 },
    { label: 'Mar', value: 30 },
  ]);

  // Update individual row
  const handleChange = (index, key, newValue) => {
    const updated = [...rows];
    updated[index][key] = key === 'value' ? Number(newValue) : newValue;
    setRows(updated);
  };

  const handleChartClick = () => {
    navigate('/chart', { state: { data: rows } });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Spreadsheet</h1>
      <table className="table-auto w-full mb-4 border">
        <thead>
          <tr>
            <th className="border px-4 py-2">Label</th>
            <th className="border px-4 py-2">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">
                <input
                  value={row.label}
                  onChange={(e) => handleChange(index, 'label', e.target.value)}
                  className="border rounded p-1"
                />
              </td>
              <td className="border px-4 py-2">
                <input
                  type="number"
                  value={row.value}
                  onChange={(e) => handleChange(index, 'value', e.target.value)}
                  className="border rounded p-1"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleChartClick}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Show Chart
      </button>
    </div>
  );
};

export default SpreadsheetPage;