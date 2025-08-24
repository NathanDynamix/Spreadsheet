
import { createContext, useContext, useState } from 'react';

// 1. Create the context
const SpreadsheetDataContext = createContext();

// 2. Create the provider component
export function SpreadsheetDataProvider({ children }) {
  const [spreadsheetData, setSpreadsheetData] = useState(null);
  const [dataSource, setDataSource] = useState('');

  return (
    <SpreadsheetDataContext.Provider 
      value={{ spreadsheetData, setSpreadsheetData, dataSource, setDataSource }}
    >
      {children}
    </SpreadsheetDataContext.Provider>
  );
}

// 3. Create custom hook for easy access
export function useSpreadsheetData() {
  const context = useContext(SpreadsheetDataContext);
  if (!context) {
    throw new Error('useSpreadsheetData must be used within a SpreadsheetDataProvider');
  }
  return context;
}