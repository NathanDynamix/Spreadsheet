import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Palette, Grid3X3, Calculator, ChevronDown, 
  Printer, Undo, Redo, Copy, Clipboard, Save, Download,
  Filter, BarChart, Share, MessageSquare, Clock, Plus,
  FileText, PieChart, LineChart, AreaChart, X, Search,
  SortAsc, SortDesc, Eye, EyeOff, Trash2, HelpCircle,
  TrendingUp, Activity, DollarSign, Menu
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart, 
  BarChart as RechartsBarChart, 
  PieChart as RechartsPieChart, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Line, Bar, Cell, Area, AreaChart as RechartsAreaChart, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ScatterChart, Scatter, ComposedChart
} from 'recharts';

const GoogleSheetsClone = () => {
  // Initialize spreadsheet data for 1000 cells (40 columns x 1000 rows)
  const initializeData = () => {
    const data = {};
    for (let row = 1; row <= 1000; row++) {
      for (let col = 1; col <= 40; col++) {
        const cellId = getColumnName(col) + row;
        data[cellId] = { value: '', formula: '', style: {} };
      }
    }
    return data;
  };

  // Convert column number to letter(s)
  const getColumnName = (col) => {
    let result = '';
    while (col > 0) {
      col--;
      result = String.fromCharCode(65 + (col % 26)) + result;
      col = Math.floor(col / 26);
    }
    return result;
  };

  const [sheets, setSheets] = useState([
    { id: 'sheet1', name: 'Sheet1', data: initializeData() }
  ]);
  const [activeSheetId, setActiveSheetId] = useState('sheet1');
  const [selectedCell, setSelectedCell] = useState('A1');
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFunctionMenu, setShowFunctionMenu] = useState(false);
  const [clipboard, setClipboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [filteredRows, setFilteredRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterColumn, setFilterColumn] = useState('A');
  const [filterValue, setFilterValue] = useState('');
  const [showFormulaHelper, setShowFormulaHelper] = useState(false);
  const [formulaSearch, setFormulaSearch] = useState('');
  const [showFormulaPrompt, setShowFormulaPrompt] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState(null);

  const cellInputRef = useRef(null);
  const activeSheet = sheets.find(sheet => sheet.id === activeSheetId);
  const data = activeSheet ? activeSheet.data : {};

  // Enhanced spreadsheet functions with comprehensive banking formulas
  const functions = {
    // Math functions
    SUM: (range) => {
      try {
        const values = getRangeValues(range);
        const numValues = values.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
        return numValues.reduce((sum, val) => sum + val, 0);
      } catch (e) {
        return '#ERROR';
      }
    },
    AVERAGE: (range) => {
      try {
        const values = getRangeValues(range).filter(v => !isNaN(parseFloat(v)));
        return values.length ? values.reduce((sum, val) => sum + parseFloat(val), 0) / values.length : 0;
      } catch (e) {
        return '#ERROR';
      }
    },
    COUNT: (range) => {
      try {
        return getRangeValues(range).filter(v => !isNaN(parseFloat(v))).length;
      } catch (e) {
        return '#ERROR';
      }
    },
    COUNTA: (range) => {
      try {
        return getRangeValues(range).filter(v => v !== '').length;
      } catch (e) {
        return '#ERROR';
      }
    },
    MAX: (range) => {
      try {
        const values = getRangeValues(range).filter(v => !isNaN(parseFloat(v)));
        return values.length ? Math.max(...values.map(v => parseFloat(v))) : 0;
      } catch (e) {
        return '#ERROR';
      }
    },
    MIN: (range) => {
      try {
        const values = getRangeValues(range).filter(v => !isNaN(parseFloat(v)));
        return values.length ? Math.min(...values.map(v => parseFloat(v))) : 0;
      } catch (e) {
        return '#ERROR';
      }
    },
    PRODUCT: (range) => {
      try {
        const values = getRangeValues(range).filter(v => !isNaN(parseFloat(v)));
        return values.reduce((product, val) => product * parseFloat(val), 1);
      } catch (e) {
        return '#ERROR';
      }
    },
    POWER: (base, exponent) => {
      try {
        return Math.pow(parseFloat(base) || 0, parseFloat(exponent) || 0);
      } catch (e) {
        return '#ERROR';
      }
    },
    SQRT: (number) => {
      try {
        const num = parseFloat(number) || 0;
        return num >= 0 ? Math.sqrt(num) : '#ERROR';
      } catch (e) {
        return '#ERROR';
      }
    },
    ABS: (number) => {
      try {
        return Math.abs(parseFloat(number) || 0);
      } catch (e) {
        return '#ERROR';
      }
    },
    ROUND: (number, digits = 0) => {
      try {
        const num = parseFloat(number) || 0;
        const dig = parseInt(digits) || 0;
        return Math.round(num * Math.pow(10, dig)) / Math.pow(10, dig);
      } catch (e) {
        return '#ERROR';
      }
    },
    
    // Banking & Financial Functions
    PMT: (rate, nper, pv, fv = 0, type = 0) => {
      try {
        const r = parseFloat(rate) || 0;
        const n = parseFloat(nper) || 0;
        const present = parseFloat(pv) || 0;
        const future = parseFloat(fv) || 0;
        const t = parseInt(type) || 0;
        
        if (r === 0) return -(present + future) / n;
        
        const payment = (r * (present * Math.pow(1 + r, n) + future)) / 
                       ((t ? 1 + r : 1) * (Math.pow(1 + r, n) - 1));
        return -payment;
      } catch (e) {
        return '#ERROR';
      }
    },
    
    PV: (rate, nper, pmt, fv = 0, type = 0) => {
      try {
        const r = parseFloat(rate) || 0;
        const n = parseFloat(nper) || 0;
        const payment = parseFloat(pmt) || 0;
        const future = parseFloat(fv) || 0;
        const t = parseInt(type) || 0;
        
        if (r === 0) return -(payment * n + future);
        
        const pv = (payment * (t ? 1 + r : 1) * (1 - Math.pow(1 + r, -n)) / r - future) / Math.pow(1 + r, n);
        return pv;
      } catch (e) {
        return '#ERROR';
      }
    },
    
    FV: (rate, nper, pmt, pv = 0, type = 0) => {
      try {
        const r = parseFloat(rate) || 0;
        const n = parseFloat(nper) || 0;
        const payment = parseFloat(pmt) || 0;
        const present = parseFloat(pv) || 0;
        const t = parseInt(type) || 0;
        
        if (r === 0) return -(present + payment * n);
        
        const fv = -(present * Math.pow(1 + r, n) + payment * (t ? 1 + r : 1) * (Math.pow(1 + r, n) - 1) / r);
        return fv;
      } catch (e) {
        return '#ERROR';
      }
    },
    
    NPER: (rate, pmt, pv, fv = 0, type = 0) => {
      try {
        const r = parseFloat(rate) || 0;
        const payment = parseFloat(pmt) || 0;
        const present = parseFloat(pv) || 0;
        const future = parseFloat(fv) || 0;
        const t = parseInt(type) || 0;
        
        if (r === 0) return -(present + future) / payment;
        
        const temp = payment * (t ? 1 + r : 1) / r;
        return Math.log((temp - future) / (temp + present)) / Math.log(1 + r);
      } catch (e) {
        return '#ERROR';
      }
    },
    
    NPV: (rate, ...values) => {
      try {
        const r = parseFloat(rate) || 0;
        return values.reduce((npv, value, index) => {
          return npv + (parseFloat(value) || 0) / Math.pow(1 + r, index + 1);
        }, 0);
      } catch (e) {
        return '#ERROR';
      }
    },
    
    IRR: (...values) => {
      try {
        const cashFlows = values.map(v => parseFloat(v) || 0);
        let rate = 0.1;
        
        for (let i = 0; i < 100; i++) {
          let npv = 0;
          let dnpv = 0;
          
          for (let j = 0; j < cashFlows.length; j++) {
            npv += cashFlows[j] / Math.pow(1 + rate, j);
            dnpv -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
          }
          
          const newRate = rate - npv / dnpv;
          if (Math.abs(newRate - rate) < 0.000001) return newRate;
          rate = newRate;
        }
        return rate;
      } catch (e) {
        return '#ERROR';
      }
    },
    
    // Logical functions
    IF: (condition, trueValue, falseValue = '') => {
      try {
        return condition ? trueValue : falseValue;
      } catch (e) {
        return '#ERROR';
      }
    },
    
    // Text functions
    CONCATENATE: (...args) => {
      try {
        return args.map(arg => String(arg || '')).join('');
      } catch (e) {
        return '#ERROR';
      }
    },
    
    // Date functions
    TODAY: () => {
      try {
        return new Date().toLocaleDateString();
      } catch (e) {
        return '#ERROR';
      }
    },
    NOW: () => {
      try {
        return new Date().toLocaleString();
      } catch (e) {
        return '#ERROR';
      }
    }
  };

  const getRangeValues = (range) => {
    if (!range) return [];
    
    try {
      if (range.includes(':')) {
        const [start, end] = range.split(':');
        const startMatch = start.match(/([A-Z]+)(\d+)/);
        const endMatch = end.match(/([A-Z]+)(\d+)/);
        
        if (!startMatch || !endMatch) return [];
        
        const startCol = getColumnNumber(startMatch[1]);
        const startRow = parseInt(startMatch[2]);
        const endCol = getColumnNumber(endMatch[1]);
        const endRow = parseInt(endMatch[2]);
        
        const values = [];
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            const cellId = getColumnName(col) + row;
            const cellData = data[cellId];
            if (cellData) {
              values.push(cellData.value || '');
            } else {
              values.push('');
            }
          }
        }
        return values;
      } else {
        const cellData = data[range];
        return cellData ? [cellData.value || ''] : [''];
      }
    } catch (e) {
      return [];
    }
  };

  const getColumnNumber = (columnName) => {
    let result = 0;
    for (let i = 0; i < columnName.length; i++) {
      result = result * 26 + (columnName.charCodeAt(i) - 64);
    }
    return result;
  };

  const evaluateFormula = (formula) => {
    if (!formula || !formula.startsWith('=')) return formula;
    
    try {
      let expression = formula.slice(1).trim();
      
      // Replace cell references with values
      expression = expression.replace(/[A-Z]+\d+/g, (match) => {
        const cellData = data[match];
        const value = cellData ? cellData.value : '';
        if (value === '' || value === null || value === undefined) return '0';
        const numValue = parseFloat(value);
        return isNaN(numValue) ? `"${value}"` : numValue.toString();
      });

      // Handle function calls
      Object.keys(functions).forEach(funcName => {
        const regex = new RegExp(`\\b${funcName}\\s*\\(([^()]*)\\)`, 'gi');
        expression = expression.replace(regex, (match, args) => {
          try {
            let argList = [];
            if (args && args.trim()) {
              argList = args.split(',').map(arg => {
                arg = arg.trim();
                if (arg.startsWith('"') && arg.endsWith('"')) {
                  return arg.slice(1, -1);
                }
                if (arg.includes(':')) {
                  return arg;
                }
                const numArg = parseFloat(arg);
                return isNaN(numArg) ? arg : numArg;
              });
            }
            
            const result = functions[funcName](...argList);
            if (result === '#ERROR') return '#ERROR';
            return typeof result === 'string' ? `"${result}"` : (result || 0).toString();
          } catch (error) {
            return '#ERROR';
          }
        });
      });

      if (expression.includes('#ERROR')) {
        return '#ERROR';
      }

      // Safe evaluation for basic math
      const allowedChars = /^[0-9+\-*/().\s"]*$/;
      const cleanExpression = expression.replace(/"[^"]*"/g, '""');
      
      if (allowedChars.test(cleanExpression)) {
        try {
          const result = Function('"use strict"; return (' + expression + ')')();
          if (typeof result === 'number' && (isNaN(result) || !isFinite(result))) {
            return '#ERROR';
          }
          return typeof result === 'number' ? result : 
                 typeof result === 'string' ? result : '#ERROR';
        } catch (evalError) {
          return '#ERROR';
        }
      }
      
      return expression;
    } catch (error) {
      return '#ERROR';
    }
  };

  const saveHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(data)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const updateCell = (cellId, value) => {
    saveHistory();
    
    const newSheets = sheets.map(sheet => {
      if (sheet.id === activeSheetId) {
        const newData = { ...sheet.data };
        
        if (!newData[cellId]) {
          newData[cellId] = { value: '', formula: '', style: {} };
        }
        
        const evaluatedValue = value.startsWith('=') ? evaluateFormula(value) : value;
        
        newData[cellId] = {
          ...newData[cellId],
          formula: value,
          value: evaluatedValue
        };
        
        // Recalculate dependent cells
        Object.keys(newData).forEach(id => {
          if (newData[id].formula && newData[id].formula.startsWith('=') && 
              newData[id].formula.includes(cellId)) {
            newData[id].value = evaluateFormula(newData[id].formula);
          }
        });
        
        return { ...sheet, data: newData };
      }
      return sheet;
    });
    
    setSheets(newSheets);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newSheets = sheets.map(sheet => {
        if (sheet.id === activeSheetId) {
          return { ...sheet, data: history[historyIndex - 1] };
        }
        return sheet;
      });
      setSheets(newSheets);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newSheets = sheets.map(sheet => {
        if (sheet.id === activeSheetId) {
          return { ...sheet, data: history[historyIndex + 1] };
        }
        return sheet;
      });
      setSheets(newSheets);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const copyCell = () => {
    if (selectedCell && data[selectedCell]) {
      setClipboard(data[selectedCell]);
    }
  };

  const pasteCell = () => {
    if (clipboard && selectedCell) {
      updateCell(selectedCell, clipboard.formula || clipboard.value);
    }
  };

  const deleteCell = () => {
    if (selectedCell) {
      updateCell(selectedCell, '');
    }
  };

  const addSheet = () => {
    const newSheetId = `sheet${sheets.length + 1}`;
    setSheets([...sheets, {
      id: newSheetId,
      name: `Sheet${sheets.length + 1}`,
      data: initializeData()
    }]);
  };

  const formatCell = (style) => {
    if (!selectedCell) return;
    
    const newSheets = sheets.map(sheet => {
      if (sheet.id === activeSheetId) {
        const newData = { ...sheet.data };
        if (!newData[selectedCell]) {
          newData[selectedCell] = { value: '', formula: '', style: {} };
        }
        newData[selectedCell] = {
          ...newData[selectedCell],
          style: { ...newData[selectedCell].style, ...style }
        };
        return { ...sheet, data: newData };
      }
      return sheet;
    });
    setSheets(newSheets);
  };

  const getCellStyle = (cellId) => {
    const cellData = data[cellId];
    if (!cellData || !cellData.style) return {};
    
    const style = {};
    if (cellData.style.bold) style.fontWeight = 'bold';
    if (cellData.style.italic) style.fontStyle = 'italic';
    if (cellData.style.underline) style.textDecoration = 'underline';
    if (cellData.style.color) style.color = cellData.style.color;
    if (cellData.style.backgroundColor) style.backgroundColor = cellData.style.backgroundColor;
    if (cellData.style.textAlign) style.textAlign = cellData.style.textAlign;
    
    return style;
  };

  const handleCellClick = (cellId) => {
    setSelectedCell(cellId);
    const cellData = data[cellId];
    setFormulaBarValue(cellData ? (cellData.formula || cellData.value || '') : '');
    setIsEditing(false);
  };

  const handleCellDoubleClick = (cellId) => {
    setSelectedCell(cellId);
    setIsEditing(true);
    setTimeout(() => {
      if (cellInputRef.current) {
        cellInputRef.current.focus();
      }
    }, 0);
  };

  const handleFormulaBarChange = (value) => {
    setFormulaBarValue(value);
    if (selectedCell) {
      updateCell(selectedCell, value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && selectedCell) {
      updateCell(selectedCell, formulaBarValue);
      setIsEditing(false);
      
      // Move to next row
      const match = selectedCell.match(/([A-Z]+)(\d+)/);
      if (match) {
        const nextCell = match[1] + (parseInt(match[2]) + 1);
        handleCellClick(nextCell);
      }
    } else if (e.key === 'Tab' && selectedCell) {
      e.preventDefault();
      updateCell(selectedCell, formulaBarValue);
      setIsEditing(false);
      
      // Move to next column
      const match = selectedCell.match(/([A-Z]+)(\d+)/);
      if (match) {
        const colNum = getColumnNumber(match[1]);
        const nextCell = getColumnName(colNum + 1) + match[2];
        handleCellClick(nextCell);
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      const cellData = data[selectedCell];
      setFormulaBarValue(cellData ? (cellData.formula || cellData.value || '') : '');
    }
  };

  const generateChart = () => {
    const selectedData = [];
    for (let i = 1; i <= 10; i++) {
      const cellA = data[`A${i}`];
      const cellB = data[`B${i}`];
      if (cellA && cellB && cellA.value && cellB.value) {
        selectedData.push({
          name: cellA.value,
          value: parseFloat(cellB.value) || 0
        });
      }
    }
    
    if (selectedData.length > 0) {
      setChartData(selectedData);
      setShowChartModal(true);
    }
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  const renderChart = () => {
    if (!chartData) return null;
    
    switch (chartType) {
      case 'line':
        return (
          <RechartsLineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </RechartsLineChart>
        );
      case 'bar':
        return (
          <RechartsBarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </RechartsBarChart>
        );
      case 'pie':
        return (
          <RechartsPieChart>
            <Tooltip />
            <Legend />
            <Cell fill="#8884d8" />
          </RechartsPieChart>
        );
      default:
        return null;
    }
  };

  const insertFunction = (funcName) => {
    const currentFormula = formulaBarValue;
    const newFormula = currentFormula.startsWith('=') 
      ? `${currentFormula}${funcName}()` 
      : `=${funcName}()`;
    setFormulaBarValue(newFormula);
    setShowFunctionMenu(false);
  };

  const functionCategories = {
    'Math': ['SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN', 'ROUND', 'ABS', 'POWER', 'SQRT'],
    'Financial': ['PMT', 'PV', 'FV', 'NPER', 'NPV', 'IRR'],
    'Text': ['CONCATENATE'],
    'Date': ['TODAY', 'NOW'],
    'Logical': ['IF']
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-800">Spreadsheet Pro</h1>
            <div className="flex items-center space-x-2">
              <button onClick={undo} className="p-2 hover:bg-gray-200 rounded">
                <Undo size={16} />
              </button>
              <button onClick={redo} className="p-2 hover:bg-gray-200 rounded">
                <Redo size={16} />
              </button>
              <button onClick={copyCell} className="p-2 hover:bg-gray-200 rounded">
                <Copy size={16} />
              </button>
              <button onClick={pasteCell} className="p-2 hover:bg-gray-200 rounded">
                <Clipboard size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={generateChart} className="p-2 hover:bg-gray-200 rounded">
              <BarChart size={16} />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded">
              <Share size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => formatCell({ bold: true })}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Bold size={16} />
            </button>
            <button 
              onClick={() => formatCell({ italic: true })}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Italic size={16} />
            </button>
            <button 
              onClick={() => formatCell({ underline: true })}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Underline size={16} />
            </button>
          </div>
          
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => formatCell({ textAlign: 'left' })}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <AlignLeft size={16} />
            </button>
            <button 
              onClick={() => formatCell({ textAlign: 'center' })}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <AlignCenter size={16} />
            </button>
            <button 
              onClick={() => formatCell({ textAlign: 'right' })}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <AlignRight size={16} />
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowFunctionMenu(!showFunctionMenu)}
              className="p-2 hover:bg-gray-100 rounded flex items-center"
            >
              <Calculator size={16} />
              <ChevronDown size={12} className="ml-1" />
            </button>
            
            {showFunctionMenu && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-50">
                <div className="p-2 border-b">
                  <input
                    type="text"
                    placeholder="Search functions..."
                    className="w-full px-2 py-1 border rounded text-sm"
                    value={formulaSearch}
                    onChange={(e) => setFormulaSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {Object.entries(functionCategories).map(([category, funcs]) => (
                    <div key={category} className="p-2">
                      <div className="font-semibold text-sm text-gray-600 mb-1">{category}</div>
                      {funcs
                        .filter(func => !formulaSearch || func.toLowerCase().includes(formulaSearch.toLowerCase()))
                        .map(func => (
                          <button
                            key={func}
                            onClick={() => insertFunction(func)}
                            className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                          >
                            {func}
                          </button>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
<div className="relative">
            <button 
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Palette size={16} />
            </button>
            
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-50 p-3">
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
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button onClick={deleteCell} className="p-2 hover:bg-gray-100 rounded">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="bg-gray-50 border-b px-4 py-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{selectedCell}</span>
            <button 
              onClick={() => setShowFormulaHelper(!showFormulaHelper)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <HelpCircle size={14} />
            </button>
          </div>
          <div className="flex-1">
            <input
              ref={cellInputRef}
              type="text"
              value={formulaBarValue}
              onChange={(e) => setFormulaBarValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (selectedCell) {
                  updateCell(selectedCell, formulaBarValue);
                }
                setIsEditing(false);
              }}
              className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter value or formula (start with =)"
            />
          </div>
        </div>
        
        {showFormulaHelper && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm">
              <strong>Formula Examples:</strong>
              <ul className="mt-1 space-y-1">
                <li>• =SUM(A1:A10) - Sum range of cells</li>
                <li>• =PMT(5%/12,60,10000) - Monthly payment calculation</li>
                <li>• =IF(A1 &gt 100, "High", "Low") - Conditional logic</li>
                <li>• =AVERAGE(A1:A5) - Average of range</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Spreadsheet */}
        <div className="flex-1 overflow-auto">
          <div className="relative">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-16 h-8 border border-gray-300 bg-gray-200"></th>
                  {Array.from({ length: 40 }, (_, i) => (
                    <th key={i} className="min-w-20 h-8 border border-gray-300 text-xs font-medium text-center">
                      {getColumnName(i + 1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 100 }, (_, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="w-16 h-6 border border-gray-300 bg-gray-100 text-xs text-center font-medium">
                      {rowIndex + 1}
                    </td>
                    {Array.from({ length: 40 }, (_, colIndex) => {
                      const cellId = getColumnName(colIndex + 1) + (rowIndex + 1);
                      const cellData = data[cellId];
                      const isSelected = selectedCell === cellId;
                      
                      return (
                        <td
                          key={cellId}
                          className={`min-w-20 h-6 border border-gray-300 cursor-cell relative ${
                            isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleCellClick(cellId)}
                          onDoubleClick={() => handleCellDoubleClick(cellId)}
                        >
                          {isSelected && isEditing ? (
                            <input
                              type="text"
                              value={formulaBarValue}
                              onChange={(e) => setFormulaBarValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={() => {
                                updateCell(selectedCell, formulaBarValue);
                                setIsEditing(false);
                              }}
                              className="w-full h-full px-1 text-xs border-none outline-none bg-transparent"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="px-1 text-xs truncate"
                              style={getCellStyle(cellId)}
                            >
                              {cellData ? (
                                typeof cellData.value === 'number' ? 
                                  cellData.value.toLocaleString() : 
                                  cellData.value
                              ) : ''}
                            </div>
                          )}
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
      <div className="bg-gray-50 border-t px-4 py-2">
        <div className="flex items-center space-x-2">
          {sheets.map(sheet => (
            <button
              key={sheet.id}
              onClick={() => setActiveSheetId(sheet.id)}
              className={`px-3 py-1 text-sm rounded ${
                activeSheetId === sheet.id 
                  ? 'bg-white border border-gray-300' 
                  : 'hover:bg-gray-200'
              }`}
            >
              {sheet.name}
            </button>
          ))}
          <button 
            onClick={addSheet}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Chart Modal */}
      {showChartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-3/4 h-3/4 max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Chart Visualization</h2>
              <div className="flex items-center space-x-4">
                <select 
                  value={chartType} 
                  onChange={(e) => setChartType(e.target.value)}
                  className="px-3 py-1 border rounded"
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="area">Area Chart</option>
                </select>
                <button 
                  onClick={() => setShowChartModal(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="h-full">
              <ResponsiveContainer width="100%" height="90%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Function Prompt Modal */}
      {showFormulaPrompt && selectedFunction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{selectedFunction} Function</h3>
              <button 
                onClick={() => setShowFormulaPrompt(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                {selectedFunction === 'PMT' && 'Calculate loan payments: PMT(rate, nper, pv, [fv], [type])'}
                {selectedFunction === 'SUM' && 'Sum a range of cells: SUM(range)'}
                {selectedFunction === 'IF' && 'Conditional logic: IF(condition, true_value, false_value)'}
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    insertFunction(selectedFunction);
                    setShowFormulaPrompt(false);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Insert
                </button>
                <button 
                  onClick={() => setShowFormulaPrompt(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsClone;