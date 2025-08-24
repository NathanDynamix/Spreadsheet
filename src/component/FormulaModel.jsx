import React, { useState, useEffect, useCallback } from 'react';
import {
  Download, Upload, Share2, BarChart3, Calculator, Grid, Save, Plus, Trash2,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, PieChart,
  LineChart, TrendingUp, FunctionSquare, X, Search, DollarSign, Percent,Palette, Calendar,ChevronDown
} from 'lucide-react';


const SpreadsheetApp = () => {
  const [cells, setCells] = useState({});
  const [selectedCell, setSelectedCell] = useState('A1');
  const [formulaBar, setFormulaBar] = useState('');
  const [sheets, setSheets] = useState([{ id: 1, name: 'Sheet1', active: true }]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeSheet, setActiveSheet] = useState(1);
  const [chartData, setChartData] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState('bar');
  const [showFunctions, setShowFunctions] = useState(false);
  const [functionSearch, setFunctionSearch] = useState('');
  const [selectedRange, setSelectedRange] = useState('');

  const ROWS = 100;
  const COLS = 26;

  // Comprehensive function library
  const FUNCTIONS = {
    'Mathematical': {
      'SUM': { syntax: 'SUM(range)', description: 'Adds all numbers in a range', example: '=SUM(A1:A10)' },
      'AVERAGE': { syntax: 'AVERAGE(range)', description: 'Calculates the average of numbers', example: '=AVERAGE(A1:A10)' },
      'COUNT': { syntax: 'COUNT(range)', description: 'Counts cells containing numbers', example: '=COUNT(A1:A10)' },
      'COUNTA': { syntax: 'COUNTA(range)', description: 'Counts non-empty cells', example: '=COUNTA(A1:A10)' },
      'MAX': { syntax: 'MAX(range)', description: 'Returns the largest value', example: '=MAX(A1:A10)' },
      'MIN': { syntax: 'MIN(range)', description: 'Returns the smallest value', example: '=MIN(A1:A10)' },
      'ROUND': { syntax: 'ROUND(number, digits)', description: 'Rounds to specified digits', example: '=ROUND(3.14159, 2)' },
      'ABS': { syntax: 'ABS(number)', description: 'Returns absolute value', example: '=ABS(-5)' },
      'SQRT': { syntax: 'SQRT(number)', description: 'Returns square root', example: '=SQRT(16)' },
      'POWER': { syntax: 'POWER(base, exponent)', description: 'Raises number to power', example: '=POWER(2, 3)' },
      'PI': { syntax: 'PI()', description: 'Returns value of π', example: '=PI()' },
      'RAND': { syntax: 'RAND()', description: 'Random number 0-1', example: '=RAND()' },
      'RANDBETWEEN': { syntax: 'RANDBETWEEN(low, high)', description: 'Random integer in range', example: '=RANDBETWEEN(1, 100)' }
    },
    'Financial': {
      'PV': { syntax: 'PV(rate, nper, pmt, fv, type)', description: 'Present value of investment', example: '=PV(0.05, 10, -1000, 0, 0)' },
      'FV': { syntax: 'FV(rate, nper, pmt, pv, type)', description: 'Future value of investment', example: '=FV(0.05, 10, -100, 0, 0)' },
      'PMT': { syntax: 'PMT(rate, nper, pv, fv, type)', description: 'Payment for loan', example: '=PMT(0.05/12, 360, 100000)' },
      'SLN': { syntax: 'SLN(cost, salvage, life)', description: 'Straight-line depreciation', example: '=SLN(10000, 1000, 5)' }
    },
    'Date & Time': {
      'TODAY': { syntax: 'TODAY()', description: 'Current date', example: '=TODAY()' },
      'NOW': { syntax: 'NOW()', description: 'Current date and time', example: '=NOW()' },
      'DATE': { syntax: 'DATE(year, month, day)', description: 'Creates date', example: '=DATE(2024, 12, 25)' },
      'YEAR': { syntax: 'YEAR(date)', description: 'Extracts year', example: '=YEAR(TODAY())' },
      'MONTH': { syntax: 'MONTH(date)', description: 'Extracts month', example: '=MONTH(TODAY())' },
      'DAY': { syntax: 'DAY(date)', description: 'Extracts day', example: '=DAY(TODAY())' }
    },
    'Text': {
      'CONCATENATE': { syntax: 'CONCATENATE(text1, text2, ...)', description: 'Joins text strings', example: '=CONCATENATE("Hello", " ", "World")' },
      'LEFT': { syntax: 'LEFT(text, num_chars)', description: 'Left characters', example: '=LEFT("Hello", 2)' },
      'RIGHT': { syntax: 'RIGHT(text, num_chars)', description: 'Right characters', example: '=RIGHT("Hello", 2)' },
      'LEN': { syntax: 'LEN(text)', description: 'Length of text', example: '=LEN("Hello")' },
      'UPPER': { syntax: 'UPPER(text)', description: 'Converts to uppercase', example: '=UPPER("hello")' },
      'LOWER': { syntax: 'LOWER(text)', description: 'Converts to lowercase', example: '=LOWER("HELLO")' },
      'TRIM': { syntax: 'TRIM(text)', description: 'Removes extra spaces', example: '=TRIM(" hello ")' }
    },
    'Logical': {
      'IF': { syntax: 'IF(condition, true_value, false_value)', description: 'Conditional logic', example: '=IF(A1>10, "High", "Low")' },
      'AND': { syntax: 'AND(condition1, condition2, ...)', description: 'All conditions true', example: '=AND(A1>0, B1<10)' },
      'OR': { syntax: 'OR(condition1, condition2, ...)', description: 'Any condition true', example: '=OR(A1>0, B1<10)' },
      'NOT': { syntax: 'NOT(condition)', description: 'Reverses logic', example: '=NOT(A1>10)' }
    }
  };
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
const formatCell = (style) => {
  if (!selectedCell) return;
  
  setCells(prevCells => {
    const newCells = { ...prevCells };
    newCells[selectedCell] = {
      ...newCells[selectedCell] || { value: '', formula: '', display: '' },
      style: {
        ...(newCells[selectedCell]?.style || {}),
        ...style
      }
    };
    return newCells;
  });
};



  // Generate column headers (A, B, C, ..., Z)
  const getColumnHeader = (index) => String.fromCharCode(65 + index);

  // Convert cell reference to coordinates
  const cellToCoords = (cellRef) => {
    const col = cellRef.charCodeAt(0) - 65;
    const row = parseInt(cellRef.slice(1)) - 1;
    return { row, col };
  };

  // Convert coordinates to cell reference
  const coordsToCell = (row, col) => {
    return getColumnHeader(col) + (row + 1);
  };

  // Initialize cells with empty values
  useEffect(() => {
    const initialCells = {};
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cellRef = coordsToCell(row, col);
        initialCells[cellRef] = { value: '', formula: '', display: '' };
      }
    }
    setCells(initialCells);
  }, []);

  // Get numeric value from cell, handling formulas and text
  const getCellNumericValue = (cellRef) => {
    const cell = cells[cellRef];
    if (!cell) return 0;
    
    const value = cell.display || cell.value || '';
    const numValue = parseFloat(value);
    return isNaN(numValue) ? 0 : numValue;
  };

  // Advanced formula evaluation
  const evaluateFormula = useCallback((formula, cellRef) => {
    if (!formula.startsWith('=')) return formula;
    
    try {
      let expression = formula.slice(1).toUpperCase();
      
      // Handle range-based functions
      const handleRangeFunction = (funcName, callback) => {
        const regex = new RegExp(`${funcName}\\(([A-Z]\\d+):([A-Z]\\d+)\\)`, 'g');
        return expression.replace(regex, (match, startCell, endCell) => {
          const startCoords = cellToCoords(startCell);
          const endCoords = cellToCoords(endCell);
          
          const values = [];
          for (let row = startCoords.row; row <= endCoords.row; row++) {
            for (let col = startCoords.col; col <= endCoords.col; col++) {
              const cellKey = coordsToCell(row, col);
              if (cellKey !== cellRef) { // Avoid circular reference
                const cellValue = getCellNumericValue(cellKey);
                if (cellValue !== 0 || cells[cellKey]?.value === '0') {
                  values.push(cellValue);
                }
              }
            }
          }
          
          return callback(values);
        });
      };

      // Mathematical Functions
      expression = handleRangeFunction('SUM', (values) => {
        return values.reduce((sum, val) => sum + val, 0).toString();
      });

      expression = handleRangeFunction('AVERAGE', (values) => {
        return values.length > 0 ? (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2) : '0';
      });

      expression = handleRangeFunction('COUNT', (values) => {
        return values.length.toString();
      });

      expression = handleRangeFunction('MAX', (values) => {
        return values.length > 0 ? Math.max(...values).toString() : '0';
      });

      expression = handleRangeFunction('MIN', (values) => {
        return values.length > 0 ? Math.min(...values).toString() : '0';
      });

      // Financial Functions
      if (expression.includes('PV(')) {
        const match = expression.match(/PV\(([^)]+)\)/);
        if (match) {
          const params = match[1].split(',').map(p => parseFloat(p.trim()));
          if (params.length >= 3) {
            const [rate, nper, pmt, fv = 0, type = 0] = params;
            if (rate === 0) {
              return (-pmt * nper - fv).toFixed(2);
            }
            const pv = pmt * ((1 - Math.pow(1 + rate, -nper)) / rate) + fv / Math.pow(1 + rate, nper);
            return (-pv).toFixed(2);
          }
        }
      }

      if (expression.includes('FV(')) {
        const match = expression.match(/FV\(([^)]+)\)/);
        if (match) {
          const params = match[1].split(',').map(p => parseFloat(p.trim()));
          if (params.length >= 3) {
            const [rate, nper, pmt, pv = 0, type = 0] = params;
            if (rate === 0) {
              return (-pmt * nper - pv).toFixed(2);
            }
            const fv = pmt * (Math.pow(1 + rate, nper) - 1) / rate - pv * Math.pow(1 + rate, nper);
            return fv.toFixed(2);
          }
        }
      }

      if (expression.includes('PMT(')) {
        const match = expression.match(/PMT\(([^)]+)\)/);
        if (match) {
          const params = match[1].split(',').map(p => parseFloat(p.trim()));
          if (params.length >= 3) {
            const [rate, nper, pv, fv = 0, type = 0] = params;
            if (rate === 0) {
              return ((-pv - fv) / nper).toFixed(2);
            }
            const pmt = (rate * (pv * Math.pow(1 + rate, nper) + fv)) / (Math.pow(1 + rate, nper) - 1);
            return (-pmt).toFixed(2);
          }
        }
      }

      if (expression.includes('SLN(')) {
        const match = expression.match(/SLN\(([^)]+)\)/);
        if (match) {
          const params = match[1].split(',').map(p => parseFloat(p.trim()));
          if (params.length >= 3) {
            const [cost, salvage, life] = params;
            return ((cost - salvage) / life).toFixed(2);
          }
        }
      }

      // Single value functions
      expression = expression.replace(/ROUND\(([^,]+),\s*(\d+)\)/g, (match, num, digits) => {
        const n = parseFloat(num);
        const d = parseInt(digits);
        return (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toString();
      });

      expression = expression.replace(/ABS\(([^)]+)\)/g, (match, num) => {
        return Math.abs(parseFloat(num)).toString();
      });

      expression = expression.replace(/SQRT\(([^)]+)\)/g, (match, num) => {
        const n = parseFloat(num);
        return n >= 0 ? Math.sqrt(n).toString() : '#ERROR!';
      });

      expression = expression.replace(/POWER\(([^,]+),\s*([^)]+)\)/g, (match, base, exp) => {
        return Math.pow(parseFloat(base), parseFloat(exp)).toString();
      });

      expression = expression.replace(/PI\(\)/g, Math.PI.toString());
      expression = expression.replace(/RAND\(\)/g, Math.random().toString());

      expression = expression.replace(/RANDBETWEEN\(([^,]+),\s*([^)]+)\)/g, (match, low, high) => {
        const min = Math.ceil(parseFloat(low));
        const max = Math.floor(parseFloat(high));
        return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
      });

      // Date functions
      if (expression.includes('TODAY()')) {
        return new Date().toLocaleDateString();
      }
      if (expression.includes('NOW()')) {
        return new Date().toLocaleString();
      }

      // Replace remaining cell references with values
      expression = expression.replace(/[A-Z]\d+/g, (match) => {
        if (match === cellRef) return '0'; // Avoid circular reference
        return getCellNumericValue(match).toString();
      });
      
      // Handle basic arithmetic
      if (/^[-+*/().\d\s]+$/.test(expression)) {
        const result = Function(`"use strict"; return (${expression})`)();
        return isNaN(result) ? '#ERROR!' : result.toString();
      }
      
      return expression;
    } catch (error) {
      return '#ERROR!';
    }
  }, [cells]);

  const handleCellChange = (cellRef, value) => {
    setCells(prev => {
      const newCells = { ...prev };
      const isFormula = value.startsWith('=');
      
      newCells[cellRef] = {
        value: value,
        formula: isFormula ? value : '',
        display: isFormula ? evaluateFormula(value, cellRef) : value
      };
      
      return newCells;
    });
  };

  const handleCellClick = (cellRef) => {
    setSelectedCell(cellRef);
    setFormulaBar(cells[cellRef]?.value || '');
  };

  const handleFormulaBarChange = (value) => {
    setFormulaBar(value);
    handleCellChange(selectedCell, value);
  };

  const insertFunction = (funcName, syntax) => {
    setFormulaBar(syntax);
    setShowFunctions(false);
    handleCellChange(selectedCell, syntax);
  };

  const generateAdvancedChart = () => {
    const data = [];
    for (let row = 1; row <= 10; row++) {
      const labelCell = coordsToCell(row, 0);
      const valueCell = coordsToCell(row, 1);
      const label = cells[labelCell]?.display || `Series ${row}`;
      const value = getCellNumericValue(valueCell);
      
      if (label && value !== 0) {
        data.push({ label, value, color: `hsl(${row * 36}, 70%, 50%)` });
      }
    }
    setChartData(data);
    setShowChart(true);
  };

  const exportToCSV = () => {
    let csvContent = '';
    for (let row = 0; row < 50; row++) {
      const rowData = [];
      for (let col = 0; col < 20; col++) {
        const cellRef = coordsToCell(row, col);
        rowData.push(cells[cellRef]?.display || '');
      }
      csvContent += rowData.join(',') + '\n';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spreadsheet.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const rows = csv.split('\n');
      const newCells = { ...cells };
      
      rows.forEach((row, rowIndex) => {
        const columns = row.split(',');
        columns.forEach((value, colIndex) => {
          if (rowIndex < ROWS && colIndex < COLS) {
            const cellRef = coordsToCell(rowIndex, colIndex);
            const trimmedValue = value.trim();
            newCells[cellRef] = {
              value: trimmedValue,
              formula: '',
              display: trimmedValue
            };
          }
        });
      });
      
      setCells(newCells);
    };
    reader.readAsText(file);
  };

  const addSheet = () => {
    const newId = Math.max(...sheets.map(s => s.id)) + 1;
    setSheets(prev => [...prev, { id: newId, name: `Sheet${newId}`, active: false }]);
  };

  const switchSheet = (sheetId) => {
    setSheets(prev => prev.map(sheet => ({ ...sheet, active: sheet.id === sheetId })));
    setActiveSheet(sheetId);
  };

  const deleteSheet = (sheetId) => {
    if (sheets.length > 1) {
      setSheets(prev => prev.filter(sheet => sheet.id !== sheetId));
      if (activeSheet === sheetId) {
        const remainingSheets = sheets.filter(s => s.id !== sheetId);
        switchSheet(remainingSheets[0].id);
      }
    }
  };

  const filteredFunctions = Object.entries(FUNCTIONS).reduce((acc, [category, funcs]) => {
    const filtered = Object.entries(funcs).filter(([name, details]) => 
      name.toLowerCase().includes(functionSearch.toLowerCase()) ||
      details.description.toLowerCase().includes(functionSearch.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = Object.fromEntries(filtered);
    }
    return acc;
  }, {});

  const downloadChart = () => {
  if (!chartData.length) return;
  
  // Get the SVG element
  const svgElement = document.querySelector('.chart-container svg');
  if (!svgElement) return;
  
  // Serialize the SVG to a string
  const serializer = new XMLSerializer();
  let svgStr = serializer.serializeToString(svgElement);
  
  // Add XML declaration
  svgStr = '<?xml version="1.0" standalone="no"?>\r\n' + svgStr;
  
  // Convert SVG to canvas then to PNG
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // Trigger download
    const pngFile = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngFile;
    downloadLink.download = `chart-${new Date().toISOString().slice(0,10)}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  
  // Convert SVG string to data URL
  const svgBlob = new Blob([svgStr], {type: 'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(svgBlob);
  img.src = url;
};

  const renderChart = () => {
  if (!chartData.length) return null;

  switch (chartType) {


    case 'pie':
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      let currentAngle = 0;
      
      return (
        <svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(150,150)">
            {chartData.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (item.value / total) * 2 * Math.PI;
              const x1 = Math.cos(currentAngle) * 80;
              const y1 = Math.sin(currentAngle) * 80;
              const x2 = Math.cos(currentAngle + angle) * 80;
              const y2 = Math.sin(currentAngle + angle) * 80;
              
              const largeArcFlag = angle > Math.PI ? 1 : 0;
              const path = `M 0 0 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
              
              currentAngle += angle;
              
              return (
                <g key={index}>
                  <path
                    d={path}
                    fill={item.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text 
                    x={Math.cos(currentAngle - angle/2) * 120} 
                    y={Math.sin(currentAngle - angle/2) * 120}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#333"
                  >
                    {`${item.label} (${percentage.toFixed(1)}%)`}
                  </text>
                </g>
              );
            })}
            <text y={-140} textAnchor="middle" fontSize="14" fontWeight="bold">
              Pie Chart
            </text>
          </g>
        </svg>
      );
      
    case 'line':
      const maxValue = Math.max(...chartData.map(d => d.value));
      const minValue = Math.min(...chartData.map(d => d.value));
      const range = maxValue - minValue || 1;
      
      return (
        <svg width="300" height="250" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="white" />
          <g transform="translate(40, 20)">
            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const value = minValue + ratio * range;
              const y = 160 - (ratio * 160);
              return (
                <g key={`y-label-${i}`}>
                  <line x1="0" y1={y} x2="240" y2={y} stroke="#e5e7eb" strokeWidth="1" />
                  <text x="-10" y={y + 4} textAnchor="end" fontSize="10" fill="#666">
                    {value.toFixed(2)}
                  </text>
                </g>
              );
            })}
            
            {/* Line */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              points={chartData.map((item, index) => {
                const x = (index / Math.max(1, chartData.length - 1)) * 240;
                const y = 160 - ((item.value - minValue) / range) * 160;
                return `${x},${y}`;
              }).join(' ')}
            />
            
            {/* Data points */}
            {chartData.map((item, index) => {
              const x = (index / Math.max(1, chartData.length - 1)) * 240;
              const y = 160 - ((item.value - minValue) / range) * 160;
              return (
                <g key={index}>
                  <circle cx={x} cy={y} r="4" fill="#3b82f6" />
                  <text 
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#333"
                  >
                    {item.value.toFixed(2)}
                  </text>
                </g>
              );
            })}
            
            {/* X-axis labels */}
            {chartData.map((item, index) => {
              const x = (index / Math.max(1, chartData.length - 1)) * 240;
              return (
                <text
                  key={`label-${index}`}
                  x={x}
                  y="190"
                  textAnchor="middle"
                  fontSize="10"
                  fill="#333"
                >
                  {item.label}
                </text>
              );
            })}
            
            <text x="120" y="220" textAnchor="middle" fontSize="14" fontWeight="bold">
              Line Chart
            </text>
          </g>
        </svg>
      );
      
    default: // bar chart
      const maxVal = Math.max(...chartData.map(d => d.value));
      return (
        <svg width="300" height="250" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="white" />
          {chartData.map((item, index) => {
            const barHeight = Math.max(10, (item.value / maxVal) * 160);
            const x = index * 30 + 50;
            const y = 200 - barHeight;
            
            return (
              <g key={index} transform={`translate(${x}, ${y})`}>
                <rect 
                  width="20" 
                  height={barHeight} 
                  fill={item.color}
                  rx="2"
                />
                <text 
                  x="10" 
                  y={barHeight + 15} 
                  textAnchor="middle" 
                  fontSize="10"
                  fill="#333"
                >
                  {item.label}
                </text>
                <text 
                  x="10" 
                  y="-5" 
                  textAnchor="middle" 
                  fontSize="10"
                  fill="#333"
                >
                  {item.value.toFixed(2)}
                </text>
              </g>
            );
          })}
          <text x="150" y="230" textAnchor="middle" fontSize="14" fontWeight="bold">
            Bar Chart
          </text>
        </svg>
      );
  }
};

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center gap-2 flex-wrap">
        <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          <Save size={16} />
          Save
        </button>
        
        <div className="flex items-center gap-1">
          <label className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer transition-colors">
            <Upload size={16} />
            Import CSV
            <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
          </label>
          
          <button onClick={exportToCSV} className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
            <Download size={16} />
            Export CSV
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={generateAdvancedChart} className="flex items-center gap-1 px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors">
            <BarChart3 size={16} />
            Charts
          </button>
          
        </div>
        
        <button className="flex items-center gap-1 px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors">
          <Share2 size={16} />
          Share
        </button>
        
        <div className="flex items-center gap-1 ml-4 border-l pl-4 relative">
          <button 
  onClick={() => formatCell({ 
    fontWeight: cells[selectedCell]?.style?.fontWeight === 'bold' ? 'normal' : 'bold' 
  })}
  className={`p-2 rounded transition-colors ${
    cells[selectedCell]?.style?.fontWeight === 'bold' ? 'bg-gray-300' : 'hover:bg-gray-200'
  }`}
>
  <Bold size={16} />
</button>
          <button 
  onClick={() => formatCell({ 
    fontStyle: cells[selectedCell]?.style?.fontStyle === 'italic' ? 'normal' : 'italic' 
  })}
  className={`p-2 rounded transition-colors ${
    cells[selectedCell]?.style?.fontStyle === 'italic' ? 'bg-gray-300' : 'hover:bg-gray-200'
  }`}
>
  <Italic size={16} />
</button>
          <button 
  onClick={() => formatCell({ 
    textDecoration: cells[selectedCell]?.style?.textDecoration === 'underline' ? 'none' : 'underline' 
  })}
  className={`p-2 rounded transition-colors ${
    cells[selectedCell]?.style?.textDecoration === 'underline' ? 'bg-gray-300' : 'hover:bg-gray-200'
  }`}
>
  <Underline size={16} />
</button>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>

{/* Alignment Buttons */}
<button 
  onClick={() => formatCell({ textAlign: 'left' })}
  className={`p-2 rounded transition-colors ${
    cells[selectedCell]?.style?.textAlign === 'left' ? 'bg-gray-300' : 'hover:bg-gray-200'
  }`}
>
  <AlignLeft size={16} />
</button>
          <button 
  onClick={() => formatCell({ textAlign: 'center' })}
  className={`p-2 rounded transition-colors ${
    cells[selectedCell]?.style?.textAlign === 'center' ? 'bg-gray-300' : 'hover:bg-gray-200'
  }`}
>
  <AlignCenter size={16} />
</button>
          <button 
  onClick={() => formatCell({ textAlign: 'right' })}
  className={`p-2 rounded transition-colors ${
    cells[selectedCell]?.style?.textAlign === 'right' ? 'bg-gray-300' : 'hover:bg-gray-200'
  }`}
>
  <AlignRight size={16} />
</button>


          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <button className="p-2 hover:bg-gray-200 rounded transition-colors">
            <DollarSign size={16} />
          </button>
          <button className="p-2 hover:bg-gray-200 rounded transition-colors">
            <Percent size={16} />
          </button>

          {/* functions*/}
          <button 
              onClick={() => setShowFunctions(!showFunctions)}
              className="p-2 hover:bg-gray-100 rounded flex items-center"
            >
              <Calculator size={16} />
              <ChevronDown size={12} className="ml-1" />
            </button>
          <div className="relative">

            



  <button 
    onClick={() => setShowColorPicker(!showColorPicker)}
    className="p-2 hover:bg-gray-200 rounded transition-colors"
  >
    <Palette size={16} />
  </button>
  
  {showColorPicker && (
    <div className="absolute top-full right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-50 p-3">
      <div className="grid grid-cols-6 gap-2 mb-3">
        {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', 
          '#00FFFF', '#FFA500', '#800080', '#008000', '#FFC0CB', '#A52A2A'].map(color => (
          <button
            key={color}
            onClick={() => {
              formatCell({ color });
              setShowColorPicker(false);
            }}
            className="w-6 h-6 rounded border"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      <div className="border-t pt-2">
        <div className="text-sm font-medium mb-2">Background</div>
        <div className="grid grid-cols-6 gap-2">
          {['#FFFFFF', '#F0F0F0', '#FFEEEE', '#EEFFEE', '#EEEEFF', '#FFFFEE', 
            '#FFEEFF', '#EEFFFF', '#FFE4B5', '#E6E6FA', '#F0E68C', '#FFB6C1'].map(color => (
            <button
              key={color}
              onClick={() => {
                formatCell({ backgroundColor: color });
                setShowColorPicker(false);
              }}
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  )}
</div>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="bg-white border-b border-gray-200 p-2 flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-gray-500" />
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded min-w-[40px] font-semibold">
            {selectedCell}
          </span>
        </div>
        <input
          type="text"
          value={formulaBar}
          onChange={(e) => handleFormulaBarChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter formula or value... (e.g., =SUM(A1:A10) or =PMT(0.05/12,360,100000))"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Functions Panel */}
        {showFunctions && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Functions Library</h3>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search functions..."
                  value={functionSearch}
                  onChange={(e) => setFunctionSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(filteredFunctions).map(([category, funcs]) => (
                <div key={category} className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    {category === 'Mathematical' && <Calculator size={16} />}
                    {category === 'Financial' && <DollarSign size={16} />}
                    {category === 'Date & Time' && <Calendar size={16} />}
                    {category === 'Text' && <Grid size={16} />}
                    {category === 'Logical' && <FunctionSquare size={16} />}
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(funcs).map(([funcName, details]) => (
                      <div key={funcName} className="border border-gray-200 rounded p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                           onClick={() => insertFunction(funcName, details.syntax)}>
                        <div className="font-medium text-blue-600 mb-1">{funcName}</div>
                        <div className="text-sm text-gray-600 mb-1">{details.description}</div>
                        <div className="text-xs font-mono bg-gray-100 p-1 rounded">{details.example}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {Object.keys(filteredFunctions).length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No functions found matching your search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chart Panel */}
{showChart && (
  <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg z-10">
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Chart Visualization</h3>
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => setShowChart(false)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex gap-2 mb-4">
  <button
    onClick={() => setChartType('bar')}
    className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${
      chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
    }`}
  >
    <BarChart3 size={16} />
    Bar
  </button>
  <button
    onClick={() => setChartType('line')}
    className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${
      chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
    }`}
  >
    <LineChart size={16} />
    Line
  </button>
  <button
    onClick={() => setChartType('pie')}
    className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${
      chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
    }`}
  >
    <PieChart size={16} />
    Pie
  </button>
  
</div>
<button
            onClick={downloadChart}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
            disabled={!chartData.length}
          >
            <Download size={16} />
            Download
          </button>
    </div>
    
    <div className="p-4 chart-container">
      {chartData.length > 0 ? (
        <div className="text-center">
          {renderChart()}
          <div className="mt-4 text-sm text-gray-600">
            Data from columns A-B (rows 1-10)
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>No data available for chart.</p>
          <p className="text-sm mt-2">Add data to columns A & B to generate charts.</p>
        </div>
      )}
    </div>
  </div>
)}

        {/* Spreadsheet Grid */}
        <div className="flex-1 overflow-auto">
          <div className="inline-block min-w-full">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs font-medium"></th>
                  {Array.from({ length: COLS }, (_, i) => (
                    <th key={i} className="w-20 h-8 bg-gray-100 border border-gray-300 text-xs font-medium">
                      {getColumnHeader(i)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: ROWS }, (_, row) => (
                  <tr key={row}>
                    <td className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-center">
                      {row + 1}
                    </td>
                    {Array.from({ length: COLS }, (_, col) => {
                      const cellRef = coordsToCell(row, col);
                      const cell = cells[cellRef];
                      const isSelected = selectedCell === cellRef;
                      
                      return (
                        <td key={col} className="w-20 h-8 border border-gray-300 p-0">
  <input
    type="text"
    value={isSelected ? formulaBar : (cell?.display || '')}
    onChange={(e) => {
      if (isSelected) {
        handleFormulaBarChange(e.target.value);
      }
    }}
    onFocus={() => handleCellClick(cellRef)}
    onClick={() => handleCellClick(cellRef)}
    className={`w-full h-full px-1 text-xs border-none outline-none ${
      isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-transparent hover:bg-gray-50'
    } ${cell?.formula ? 'font-medium' : ''}`}
    style={{
      textAlign: !isNaN(parseFloat(cell?.display || '')) ? 'right' : 'left',
      color: cell?.style?.color || 'inherit',
      backgroundColor: cell?.style?.backgroundColor || 'inherit',
      fontWeight: cell?.style?.fontWeight || 'inherit',
      fontStyle: cell?.style?.fontStyle || 'inherit',
      textDecoration: cell?.style?.textDecoration || 'inherit'
    }}
  />
</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="bg-gray-50 border-t border-gray-200 p-2 flex items-center gap-2">
        <div className="flex items-center gap-1">
          {sheets.map(sheet => (
            <div key={sheet.id} className="flex items-center">
              <button
                onClick={() => switchSheet(sheet.id)}
                className={`px-4 py-2 text-sm rounded-t transition-colors ${
                  sheet.active ? 'bg-white border-t border-l border-r border-gray-300 -mb-px' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {sheet.name}
              </button>
              {sheets.length > 1 && (
                <button
                  onClick={() => deleteSheet(sheet.id)}
                  className="ml-1 p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <button
          onClick={addSheet}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
        >
          <Plus size={16} />
          Add Sheet
        </button>
        
        <div className="ml-auto text-xs text-gray-500">
          Ready • {Object.keys(cells).filter(key => cells[key]?.value).length} cells with data
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetApp;