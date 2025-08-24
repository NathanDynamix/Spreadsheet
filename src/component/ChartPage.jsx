import React from 'react';
import { useLocation } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ChartPage = () => {
  const { state } = useLocation();
  // Retrieve the data passed via navigation; if none, use an empty array.
  const spreadsheetData = state?.data || [];

  // Map your spreadsheet data to chart data.
  // Adjust these mappings to suit your data structure.
  const chartData = {
    labels: spreadsheetData.map((entry) => entry.label),
    datasets: [
      {
        label: 'Spreadsheet Data',
        data: spreadsheetData.map((entry) => entry.value),
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Chart Page</h1>
      <div className="w-full max-w-xl">
        <Line data={chartData} />
      </div>
    </div>
  );
};

export default ChartPage;