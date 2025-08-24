const applyFormulaToRange = (funcName, selectedRange, sheets, setSheets, activeSheetId, saveHistory, setBackendMessage) => {
  // Validate function existence
  if (!functions[funcName]) {
    setBackendMessage(`Unknown function: ${funcName}`);
    return;
  }

  // Parse selected range (e.g., "A1:B3")
  const [start, end] = selectedRange.includes(':') ? selectedRange.split(':') : [selectedRange, selectedRange];
  const startMatch = start.match(/([A-Z]+)(\d+)/);
  const endMatch = end.match(/([A-Z]+)(\d+)/);
  if (!startMatch || !endMatch) {
    setBackendMessage('Invalid range selected');
    return;
  }

  const startCol = getColumnNumber(startMatch[1]);
  const startRow = parseInt(startMatch[2]);
  const endCol = getColumnNumber(endMatch[1]);
  const endRow = parseInt(endMatch[2]);

  // Normalize range
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);

  // Save history before changes
  saveHistory();

  // Determine if the function supports ranges
  const rangeFunctions = ['SUM', 'AVERAGE', 'COUNT', 'COUNTA', 'MAX', 'MIN', 'PRODUCT', 'NPV'];

  // Update sheets
  const newSheets = sheets.map(sheet => {
    if (sheet.id !== activeSheetId) return sheet;

    const newData = { ...sheet.data };

    if (rangeFunctions.includes(funcName)) {
      // Range-based formula (e.g., "=SUM(A1:A3)")
      const topLeftCellId = getColumnName(minCol) + minRow;
      const rangeRef = `${start}:${end}`;
      const formula = `=${funcName}(${rangeRef})`;

      try {
        const evaluatedValue = evaluateFormula(formula, newData);
        newData[topLeftCellId] = {
          ...newData[topLeftCellId] || { value: '', formula: '', style: {} },
          formula,
          value: evaluatedValue === '#ERROR' ? '#ERROR' : evaluatedValue,
        };

        // Clear formulas in other cells in the range (optional: could mark as input)
        for (let row = minRow; row <= maxRow; row++) {
          for (let col = minCol; col <= maxCol; col++) {
            if (row === minRow && col === minCol) continue; // Skip top-left cell
            const cellId = getColumnName(col) + row;
            newData[cellId] = {
              ...newData[cellId] || { value: '', formula: '', style: {} },
              formula: '', // Clear formula to avoid conflicts
            };
          }
        }
      } catch (error) {
        newData[topLeftCellId] = {
          ...newData[topLeftCellId] || { value: '', formula: '', style: {} },
          formula,
          value: '#ERROR',
        };
        setBackendMessage(`Error applying ${funcName} to ${rangeRef}: ${error.message}`);
      }
    } else {
      // Single-cell formula (e.g., "=ABS(A1)")
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const cellId = getColumnName(col) + row;
          const cellData = newData[cellId] || { value: '', formula: '', style: {} };
          const currentValue = cellData.value || '0';
          const formula = `=${funcName}(${cellId})`;

          try {
            const evaluatedValue = functions[funcName](currentValue);
            newData[cellId] = {
              ...cellData,
              formula,
              value: evaluatedValue === '#ERROR' ? '#ERROR' : evaluatedValue,
            };
          } catch (error) {
            newData[cellId] = {
              ...cellData,
              formula,
              value: '#ERROR',
            };
            setBackendMessage(`Error applying ${funcName} to ${cellId}: ${error.message}`);
          }
        }
      }
    }

    return { ...sheet, data: newData };
  });

  // Update state
  setSheets(newSheets);
  setBackendMessage(`Applied ${funcName} to range ${selectedRange}`);
};

// Re-export existing functions from SpreadsheetModel.jsx to avoid duplication
const getColumnNumber = (columnName) => {
  let result = 0;
  for (let i = 0; i < columnName.length; i++) {
    result = result * 26 + (columnName.charCodeAt(i) - 64);
  }
  return result;
};

const getColumnName = (col) => {
  let result = '';
  while (col > 0) {
    col--;
    result = String.fromCharCode(65 + (col % 26)) + result;
    col = Math.floor(col / 26);
  }
  return result;
};

// Mock evaluateFormula to use existing data
const evaluateFormula = (formula, data) => {
  if (!formula || !formula.startsWith('=')) return formula;

  try {
    let expression = formula.slice(1).trim();

    // Replace cell references with values
    expression = expression.replace(/[A-Z]+\d+(?::[A-Z]+\d+)?/g, (match) => {
      if (match.includes(':')) {
        return match; // Pass range as-is to functions
      }
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
              if (arg.includes(':')) {
                return arg; // Pass range to functions
              }
              if (arg.startsWith('"') && arg.endsWith('"')) {
                return arg.slice(1, -1);
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

// Mock getRangeValues (replace with actual import)
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

export default applyFormulaToRange;