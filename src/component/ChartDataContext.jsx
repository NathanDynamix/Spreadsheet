import { createContext, useContext, useState } from 'react';

const ChartDataContext = createContext();

export const ChartDataProvider = ({ children }) => {
  const [chartData, setChartData] = useState(null);
  const [source, setSource] = useState('');

  return (
    <ChartDataContext.Provider value={{ chartData, setChartData, source, setSource }}>
      {children}
    </ChartDataContext.Provider>
  );
};

// Create and export the custom hook
export function useChartData() {
  const context = useContext(ChartDataContext);
  if (context === undefined) {
    throw new Error('useChartData must be used within a ChartDataProvider');
  }
  return context;
}