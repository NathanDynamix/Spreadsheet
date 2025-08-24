import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Download, Upload, Share2, BarChart3, Calculator, Save, Plus, Trash2,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, FunctionSquare, X, Search, DollarSign, Percent, Palette,
  ChevronDown, WrapText, Mail, Link2, Users, Undo, Redo, Copy,
  FileText, Folder, Clock, Undo2, Redo2, Scissors, Grid3X3, Eye,
  ZoomIn, ZoomOut, Maximize, ArrowUpDown, Filter, Shield, Table, Settings,
  Puzzle, HelpCircle, BookOpen, Clipboard, Image, Keyboard, Link, ArrowUp, ArrowDown, ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import * as math from 'mathjs';
import { useSpreadsheetData } from '../context/SpreadsheetDataContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';


function toSafeString(value) {
  return typeof value === "string" ? value : String(value ?? "");
}

const COLS = 26;
const ROWS = 1000;
const getColLetter = (i) => String.fromCharCode(65 + i);

const getColumnLabel = (col) => {
  let label = '';
  while (col >= 0) {
    label = String.fromCharCode(65 + (col % 26)) + label;
    col = Math.floor(col / 26) - 1;
  }
  return label;
};

const parseRange = (range) => {
  const [startCell, endCell] = range.split(':');
  const startCol = startCell.charCodeAt(0) - 65;
  const startRow = parseInt(startCell.slice(1)) - 1;
  const endCol = endCell.charCodeAt(0) - 65;
  const endRow = parseInt(endCell.slice(1)) - 1;

  const cells = [];
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      cells.push(`${getColumnLabel(c)}${r + 1}`);
    }
  }
  return cells;
};


export default function SpreadsheetApp() {
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const cellRefs = useRef({});

  const [editingSheetId, setEditingSheetId] = useState(null);
  const [tempSheetName, setTempSheetName] = useState('');
  const getColumnName = (colIndex) => {
    return String.fromCharCode(65 + colIndex);
  };
  const [validationDialog, setValidationDialog] = useState({
    show: false,
    cell: null,
    type: 'number', // 'number', 'text', 'date', 'list', 'custom'
    condition: 'between', // 'between', 'greater', 'less', 'equal', 'notEqual'
    min: '',
    max: '',
    list: '',
    customFormula: '',
    inputMessage: '',
    errorMessage: 'Invalid input',
    errorStyle: 'stop' // 'stop', 'warning', 'info'
  });

  const [isEditingCell, setIsEditingCell] = useState(false); // Added for cell editing
  const editingCellRef = useRef(null); // Added for cell input focus

  const DEFAULT_COL_WIDTH = 80;
  const DEFAULT_ROW_HEIGHT = 24;


  const getColWidth = (col) => colWidths[col] || DEFAULT_COL_WIDTH;
  const getRowHeight = (row) => rowHeights[row] || DEFAULT_ROW_HEIGHT;

  const getCellLabel = (cell) => {
    if (!cell || typeof cell !== 'object') return '';
    return String.fromCharCode(65 + cell.col) + (cell.row + 1);
  };

  const getSelectedValue = () => {
    return selectedCell ? cells[selectedCell] || '' : '';
  };
  const [validations, setValidations] = useState({});
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [activeImageTab, setActiveImageTab] = useState('url'); // 'url' or 'upload'
  const fileInputRef = useRef(null);
  const [editingCell, setEditingCell] = useState(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [submenuTimeout, setSubmenuTimeout] = useState(null);
  const timeoutRef = useRef(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const [hoveredItem, setHoveredItem] = useState(null);
  const [activeTab, setActiveTab] = useState('url');
  const [currentInput, setCurrentInput] = useState('');
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const [future, setFuture] = useState([]);
  const [sheetName, setSheetName] = useState('Untitled spreadsheet');
  const [images, setImages] = useState([]);
  const [filterActive, setFilterActive] = useState(false);
  const [chartDialog, setChartDialog] = useState({ show: false, type: 'line' });
  const [chartData, setChartData] = useState([]);
  const [zoom, setZoom] = useState(100);
  const [showFormulas, setShowFormulas] = useState(false);
  const [notification, setNotification] = useState(null);
  const [sortDialog, setSortDialog] = useState({
    show: false,
    range: null,
    sortBy: '',
    order: 'asc',
    hasHeader: true
  });

  const [cells, setCells] = useState({});
  const [clipboard, setClipboard] = useState(null); // holds copied cell data
  const [cellStyles, setCellStyles] = useState({});
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [showModal, setShowModal] = useState(false);
  const [initialStat, setInitialStat] = useState('sum');

  const [dragRange, setDragRange] = useState(null);
  const [stats, setStats] = useState({ sum: 0, avg: 0, count: 0 });

  const [spellCheck, setSpellCheck] = useState({
    active: false,
    errors: [],
    currentErrorIndex: 0,
    dictionary: [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
      'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'why', 'ask',
      'big', 'buy', 'far', 'few', 'got', 'hit', 'hot', 'job', 'lot', 'may', 'run', 'set', 'try', 'act', 'add', 'age', 'ago', 'air', 'all', 'and',
      // Add more words as needed
    ],
    userDictionary: [],
    ignoreWords: [],
    suggestions: {}
  });

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Example: Remove token
    sessionStorage.clear(); // Clear session storage
    navigate('/'); // Redirect to StrixAuth route
    setNotification('Logged out successfully');
  };


  const toggleStyle = (styleKey) => {
    if (!selectedCell && !selectedRange) return;

    setCellStyles((prev) => {
      const newStyles = { ...prev };

      // If a range is selected, apply the style to all cells in the range
      if (selectedRange) {
        const startRow = Math.min(selectedRange.start.row, selectedRange.end.row);
        const endRow = Math.max(selectedRange.start.row, selectedRange.end.row);
        const startCol = Math.min(selectedRange.start.col, selectedRange.end.col);
        const endCol = Math.max(selectedRange.start.col, selectedRange.end.col);

        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            const key = getCellKey(r, c);
            const prevStyle = newStyles[key] || {};
            newStyles[key] = {
              ...prevStyle,
              [styleKey]: !prevStyle[styleKey],
            };
          }
        }
      } else {
        // Apply to single selected cell
        const key = getCellKey(selectedCell.row, selectedCell.col);
        const prevStyle = newStyles[key] || {};
        newStyles[key] = {
          ...prevStyle,
          [styleKey]: !prevStyle[styleKey],
        };
      }

      return newStyles;
    });

    // Save to history
    addToHistory(cells, cellStyles);
  };


  const toggleBold = () => toggleStyle('bold');
  const toggleItalic = () => toggleStyle('italic');
  const toggleUnderline = () => toggleStyle('underline');


  const setAlignment = (alignment) => {
    if (!selectedCell && !selectedRange) {
      console.log('No cell or range selected');
      return;
    }

    // Debug log to verify selectedRange
    console.log('Selected Range:', selectedRange);

    setCellStyles((prev) => {
      const newStyles = { ...prev };

      // If a range is selected, apply the alignment to all cells in the range
      if (selectedRange) {
        const startRow = Math.min(selectedRange.start.row, selectedRange.end.row);
        const endRow = Math.max(selectedRange.start.row, selectedRange.end.row);
        const startCol = Math.min(selectedRange.start.col, selectedRange.end.col);
        const endCol = Math.max(selectedRange.start.col, selectedRange.end.col);

        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            const key = getCellKey(r, c);
            const prevStyle = newStyles[key] || {};
            newStyles[key] = {
              ...prevStyle,
              align: alignment,
            };
          }
        }
      } else {
        // Apply to single selected cell
        const key = getCellKey(selectedCell.row, selectedCell.col);
        const prevStyle = newStyles[key] || {};
        newStyles[key] = {
          ...prevStyle,
          align: alignment,
        };
      }

      return newStyles;
    });

    // Save to history
    addToHistory(cells, cellStyles);
  };

  const alignLeft = () => setAlignment('left');
  const alignCenter = () => setAlignment('center');
  const alignRight = () => setAlignment('right');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
        setHoveredItem(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMenuEnter = (menuName) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(menuName);
  };
  const handleCustomSort = () => {
    const { range, sortBy, order, hasHeader } = sortDialog;
    if (!range) return;

    const [startRow, startCol] = range.start;
    const [endRow, endCol] = range.end;
    const sortColIndex = sortBy.charCodeAt(0) - 65;

    const rows = [];
    for (let r = startRow + (hasHeader ? 1 : 0); r <= endRow; r++) {
      const row = [];
      for (let c = startCol; c <= endCol; c++) {
        row.push({
          key: `${r},${c}`,
          value: cells[`${r},${c}`] ?? ''
        });
      }
      rows.push(row);
    }

    rows.sort((a, b) => {
      const aVal = a[sortColIndex].value;
      const bVal = b[sortColIndex].value;
      if (!isNaN(aVal) && !isNaN(bVal)) {
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return order === 'asc'
        ? aVal.toString().localeCompare(bVal.toString())
        : bVal.toString().localeCompare(aVal.toString());
    });

    const updatedCells = { ...cells };

    rows.forEach((row, idx) => {
      for (let c = 0; c < row.length; c++) {
        const oldCell = row[c];
        const newKey = `${startRow + (hasHeader ? 1 : 0) + idx},${startCol + c}`;
        updatedCells[newKey] = oldCell.value;
      }
    });

    setCells(updatedCells);
    setSortDialog(prev => ({ ...prev, show: false }));
    showNotification('Range sorted successfully');
  };

  const handleMenuLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
      setHoveredItem(null);
    }, 300);
  };

  const handleItemEnter = (item) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (item.submenu) setHoveredItem(item);
  };

  const cellToCoords = (cellRef) => {
    const col = cellRef.charCodeAt(0) - 65;
    const row = parseInt(cellRef.slice(1)) - 1;
    return { row, col };
  };

  const coordsToCell = (row, col) => {
    return getColumnHeader(col) + (row + 1);
  };

  const ROWS = 1000;
  const COLS = 26;


  const navigate = useNavigate();
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: 'Your changes have been saved',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      read: false
    },
    {
      id: 2,
      message: 'New version available',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      read: false
    }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isHoveringSub, setIsHoveringSub] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [formulaBar, setFormulaBar] = useState('');
  const [sheets, setSheets] = useState([{ id: 1, name: 'Sheet1', active: true }]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeSheet, setActiveSheet] = useState(1);
  const [showChart, setShowChart] = useState(false);
  const [showFunctions, setShowFunctions] = useState(false);
  const [functionSearch, setFunctionSearch] = useState('');
  const [selectedRange, setSelectedRange] = useState('');
  const formulaBtnRef = useRef(null);
  const [showHistory, setShowHistory] = useState(false);
  const [colWidths, setColWidths] = useState({});
  const [rowHeights, setRowHeights] = useState({});
  const [resizing, setResizing] = useState({ active: false, type: null, index: null, startPos: 0 });
  const [dragPos, setDragPos] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const { setSpreadsheetData, setDataSource } = useSpreadsheetData();
  const [copiedValue, setCopiedValue] = useState(null);

  const spellCheckDictionary = [
    // Add your dictionary words here
    'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog',
    'hello', 'world', 'spreadsheet', 'function', 'example', 'correct'
    // Add more words as needed
  ];

  function isWordCorrect(word) {
    // Remove punctuation from the end of words
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').toLowerCase();
    return spellCheckDictionary.includes(cleanWord);
  }
  // Add to your state
  const [scriptEditor, setScriptEditor] = useState({
    isOpen: false,
    scripts: [
      {
        id: 1,
        name: "Sample Script",
        code: `function helloWorld() {
  const cell = getActiveCell();
  cell.setValue("Hello World!");
}`,
        lastEdited: new Date(),
        isRunning: false
      }
    ],
    activeScriptId: 1
  });







  const getColumnLabel = (index) => String.fromCharCode(65 + index);

  const getCellKey = (row, col) => `${row},${col}`;

  const getCellValue = (row, col) => {
    const key = getCellKey(row, col);
    return cellData[key] || '';
  };
  const SortDialog = () => {
    const availableColumns = Array.from({ length: 26 }, (_, i) =>
      String.fromCharCode(65 + i)
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium">Sort Range</h3>
            <button
              onClick={() => setSortDialog(prev => ({ ...prev, show: false }))}
              className="text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sort by column</label>
              <select
                value={sortDialog.sortBy}
                onChange={(e) => setSortDialog(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full border rounded p-2"
              >
                {availableColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Order</label>
              <select
                value={sortDialog.order}
                onChange={(e) => setSortDialog(prev => ({ ...prev, order: e.target.value }))}
                className="w-full border rounded p-2"
              >
                <option value="asc">A → Z (Ascending)</option>
                <option value="desc">Z → A (Descending)</option>
              </select>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={sortDialog.hasHeader}
                onChange={(e) => setSortDialog(prev => ({ ...prev, hasHeader: e.target.checked }))}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm">My data has headers</span>
            </label>
          </div>

          <div className="p-4 border-t flex justify-end">
            <button
              onClick={() => setSortDialog(prev => ({ ...prev, show: false }))}
              className="px-4 py-2 mr-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={applySort}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Sort Data
            </button>
          </div>
        </div>
      </div>
    );
  };
  const getCellStyle = (row, col) => {
    const key = getCellKey(row, col);
    return cellStyles[key] || {};
  };
  const applySort = () => {
    if (!sortDialog.range) {
      showNotification('No range selected');
      return;
    }

    const { start, end } = sortDialog.range;
    const sortColumn = sortDialog.sortBy;
    const sortOrder = sortDialog.order;
    const hasHeader = sortDialog.hasHeader;

    try {
      // Parse range boundaries
      const [startCol, startRow] = parseCellReference(start);
      const [endCol, endRow] = parseCellReference(end);
      const sortColIndex = sortColumn.charCodeAt(0) - 65;

      // Extract the data range
      const rows = [];
      for (let row = startRow; row <= endRow; row++) {
        const rowData = [];
        for (let col = startCol; col <= endCol; col++) {
          const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
          rowData.push({
            ref: cellRef,
            value: cells[cellRef]?.value || '',
            display: cells[cellRef]?.display || ''
          });
        }
        rows.push(rowData);
      }

      // Separate header if needed
      const header = hasHeader ? rows.shift() : null;

      // Sort the data
      rows.sort((a, b) => {
        const aValue = a[sortColIndex]?.value || '';
        const bValue = b[sortColIndex]?.value || '';

        // Numeric comparison
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
        }

        // String comparison
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });

      // Reattach header if it exists
      if (header) rows.unshift(header);

      // Create new cell data with sorted values
      const newCells = { ...cells };
      let currentRow = startRow;

      rows.forEach(rowData => {
        rowData.forEach((cell, colIndex) => {
          const col = startCol + colIndex;
          const cellRef = `${String.fromCharCode(65 + col)}${currentRow + 1}`;
          newCells[cellRef] = {
            ...newCells[cellRef],
            value: cell.value,
            display: cell.display
          };
        });
        currentRow++;
      });

      setCells(newCells);
      showNotification(`Range sorted by column ${sortColumn}`);
      setSortDialog(prev => ({ ...prev, show: false }));

    } catch (error) {
      console.error('Sorting failed:', error);
      showNotification('Failed to sort range');
    }
  };
  const ScriptSandbox = ({
    script,
    selectedCell,
    cells,
    setCells,
    onConsoleOutput,
    onScriptComplete
  }) => {
    useEffect(() => {
      if (!script) return;

      const sandbox = {
        // Spreadsheet functions
        getActiveCell: () => {
          return {
            getValue: () => cells[selectedCell]?.value || '',
            setValue: (value) => {
              setCells(prev => ({
                ...prev,
                [selectedCell]: {
                  value: value,
                  display: value,
                  formula: ''
                }
              }));
            }
          };
        },
        getCell: (ref) => {
          return {
            getValue: () => cells[ref]?.value || '',
            setValue: (value) => {
              setCells(prev => ({
                ...prev,
                [ref]: {
                  value: value,
                  display: value,
                  formula: ''
                }
              }));
            }
          };
        },
        refreshSheet: () => {
          // This will trigger a re-render
          setCells(prev => ({ ...prev }));
        },
        // Console functions
        console: {
          log: (...args) => onConsoleOutput('log', args.join(' ')),
          error: (...args) => onConsoleOutput('error', args.join(' '))
        },
        // Limited Math functions
        Math: {
          abs: Math.abs,
          max: Math.max,
          min: Math.min,
          random: Math.random,
          round: Math.round,
          floor: Math.floor,
          ceil: Math.ceil,
          sqrt: Math.sqrt,
          pow: Math.pow,
          sin: Math.sin,
          cos: Math.cos,
          tan: Math.tan,
          log: Math.log,
          PI: Math.PI
        }
      };

      try {
        // Create the function with sandbox context
        const scriptFn = new Function(
          'getActiveCell',
          'getCell',
          'refreshSheet',
          'console',
          'Math',
          `
        try {
          ${script.code}
          
          // Call main if it exists
          if (typeof main === 'function') {
            main();
          }
        } catch (e) {
          console.error('Script error:', e.message);
          throw e;
        }
        `
        );

        // Execute the script with sandboxed functions
        scriptFn(
          sandbox.getActiveCell,
          sandbox.getCell,
          sandbox.refreshSheet,
          sandbox.console,
          sandbox.Math
        );

        onScriptComplete();
      } catch (error) {
        onConsoleOutput('error', `Script execution failed: ${error.message}`);
        onScriptComplete(error);
      }
    }, [script]);

    return null; // This component doesn't render anything
  };
  const ScriptEditor = ({ scriptEditor, setScriptEditor }) => {
    const activeScript = scriptEditor.scripts.find(s => s.id === scriptEditor.activeScriptId);

    const handleCodeChange = (e) => {
      setScriptEditor(prev => ({
        ...prev,
        scripts: prev.scripts.map(script =>
          script.id === prev.activeScriptId
            ? { ...script, code: e.target.value, lastEdited: new Date() }
            : script
        )
      }));
    };

    const handleNewScript = () => {
      const newId = Math.max(0, ...scriptEditor.scripts.map(s => s.id)) + 1;
      setScriptEditor(prev => ({
        ...prev,
        scripts: [
          ...prev.scripts,
          {
            id: newId,
            name: `Script ${prev.scripts.length + 1}`,
            code: 'function main() {\n  // Your code here\n  const cell = getActiveCell();\n  console.log("Current cell value:", cell.getValue());\n}',
            lastEdited: new Date(),
            isRunning: false
          }
        ],
        activeScriptId: newId,
        consoleOutput: []
      }));
    };

    const handleClearConsole = () => {
      setScriptEditor(prev => ({ ...prev, consoleOutput: [] }));
    };

    const handleClose = () => {
      setScriptEditor(prev => ({ ...prev, isOpen: false }));
    };

    const handleRunScript = () => {
      if (!activeScript || activeScript.isRunning) return;

      // Mark as running
      setScriptEditor(prev => ({
        ...prev,
        scripts: prev.scripts.map(s =>
          s.id === prev.activeScriptId ? { ...s, isRunning: true } : s
        ),
        consoleOutput: [
          ...prev.consoleOutput,
          { type: 'log', message: `Running: ${activeScript.name}` }
        ]
      }));

      try {
        // Create a safer execution environment
        const sandbox = {
          // Spreadsheet functions
          getActiveCell: () => {
            return {
              getValue: () => cells[selectedCell]?.value || '',
              setValue: (value) => {
                setCells(prev => ({
                  ...prev,
                  [selectedCell]: {
                    value: value,
                    display: value,
                    formula: ''
                  }
                }));
              }
            };
          },
          getCell: (ref) => {
            return {
              getValue: () => cells[ref]?.value || '',
              setValue: (value) => {
                setCells(prev => ({
                  ...prev,
                  [ref]: {
                    value: value,
                    display: value,
                    formula: ''
                  }
                }));
              }
            };
          },
          getRange: (startRef, endRef) => {
            // Simple range implementation
            return {
              getValues: () => {
                const [startCol, startRow] = [startRef.match(/[A-Z]+/)[0], parseInt(startRef.match(/\d+/)[0])];
                const [endCol, endRow] = [endRef.match(/[A-Z]+/)[0], parseInt(endRef.match(/\d+/)[0])];

                const startColCode = startCol.charCodeAt(0);
                const endColCode = endCol.charCodeAt(0);

                const values = [];
                for (let row = startRow; row <= endRow; row++) {
                  const rowValues = [];
                  for (let col = startColCode; col <= endColCode; col++) {
                    const cellRef = `${String.fromCharCode(col)}${row}`;
                    rowValues.push(cells[cellRef]?.value || '');
                  }
                  values.push(rowValues);
                }
                return values;
              }
            };
          },
          refreshSheet: () => {
            // Force re-render by creating a new object
            setCells({ ...cells });
          },
          // Console functions
          console: {
            log: (...args) => {
              setScriptEditor(prev => ({
                ...prev,
                consoleOutput: [
                  ...prev.consoleOutput,
                  { type: 'log', message: args.map(arg => String(arg)).join(' ') }
                ]
              }));
            },
            error: (...args) => {
              setScriptEditor(prev => ({
                ...prev,
                consoleOutput: [
                  ...prev.consoleOutput,
                  { type: 'error', message: args.map(arg => String(arg)).join(' ') }
                ]
              }));
            }
          },
          // Math functions available in the sandbox
          Math: {
            abs: Math.abs,
            max: Math.max,
            min: Math.min,
            random: Math.random,
            round: Math.round,
            floor: Math.floor,
            ceil: Math.ceil,
            sqrt: Math.sqrt,
            pow: Math.pow,
            sin: Math.sin,
            cos: Math.cos,
            tan: Math.tan,
            log: Math.log,
            PI: Math.PI
          },
          // Date functions
          Date: Date
        };

        // Wrap the script in a try-catch and execute it
        const scriptToRun = `
        try {
          ${activeScript.code}
          
          // Call main if it exists
          if (typeof main === 'function') {
            main();
          }
        } catch (e) {
          console.error('Script error:', e.message);
        }
      `;

        // Create the function with all sandbox properties as parameters
        const paramNames = Object.keys(sandbox);
        const paramValues = paramNames.map(key => sandbox[key]);

        const scriptFn = new Function(...paramNames, scriptToRun);
        scriptFn(...paramValues);

      } catch (error) {
        setScriptEditor(prev => ({
          ...prev,
          consoleOutput: [
            ...prev.consoleOutput,
            { type: 'error', message: `Execution failed: ${error.message}` }
          ]
        }));
      } finally {
        setScriptEditor(prev => ({
          ...prev,
          scripts: prev.scripts.map(s =>
            s.id === prev.activeScriptId ? { ...s, isRunning: false } : s
          )
        }));
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[80vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium">Script Editor</h3>
            <div className="flex items-center gap-2">
              <select
                value={scriptEditor.activeScriptId}
                onChange={(e) => setScriptEditor(prev => ({
                  ...prev,
                  activeScriptId: Number(e.target.value)
                }))}
                className="border rounded px-2 py-1 text-sm"
              >
                {scriptEditor.scripts.map(script => (
                  <option key={script.id} value={script.id}>{script.name}</option>
                ))}
              </select>
              <button
                onClick={handleNewScript}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
              >
                New
              </button>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Editor and Console */}
          <div className="flex flex-1 overflow-hidden">
            {/* Editor Panel */}
            <div className="flex-1 border-r flex flex-col">
              <div className="p-2 bg-gray-100 border-b flex justify-between">
                <span className="text-sm font-medium">{activeScript.name}</span>
                <span className="text-xs text-gray-500">
                  Last edited: {activeScript.lastEdited.toLocaleString()}
                </span>
              </div>
              <textarea
                value={activeScript.code}
                onChange={handleCodeChange}
                className="flex-1 w-full p-4 font-mono text-sm outline-none resize-none"
                spellCheck="false"
              />
            </div>

            {/* Console Panel */}
            <div className="w-1/3 flex flex-col border-l">
              <div className="p-2 bg-gray-100 border-b">
                <h4 className="text-sm font-medium">Console Output</h4>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-black text-green-400 font-mono text-sm">
                {scriptEditor.consoleOutput.map((msg, i) => (
                  <div key={i} className={msg.type === 'error' ? 'text-red-400' : ''}>
                    {msg.message}
                  </div>
                ))}
              </div>
              <div className="p-2 border-t flex justify-end gap-2">
                <button
                  onClick={handleClearConsole}
                  className="px-3 py-1 border rounded text-sm"
                >
                  Clear
                </button>
                <button
                  onClick={handleRunScript}
                  disabled={activeScript?.isRunning}
                  className={`px-3 py-1 rounded text-sm text-white ${activeScript?.isRunning ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                  {activeScript?.isRunning ? 'Running...' : 'Run Script'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const startSpellCheck = () => {
    // Perform spell check and find errors
    const errors = [];

    // Example implementation - replace with your actual spell check logic
    Object.entries(cells).forEach(([cellRef, cell]) => {
      if (cell.display && typeof cell.display === 'string') {
        const words = cell.display.split(/\s+/);

        words.forEach(word => {
          const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
          if (cleanWord && !spellCheck.dictionary.includes(cleanWord)) {
            errors.push({
              cellRef,
              word,
              suggestions: getSuggestions(cleanWord)
            });
          }
        });
      }
    });

    if (errors.length === 0) {
      alert('No spelling errors found!');
      return;
    }

    setSpellCheck({
      active: true,
      errors,
      currentErrorIndex: 0,
      dictionary: spellCheck.dictionary // Preserve existing dictionary
    });
  };

  const getSuggestions = (word) => {
    if (!word) return [];

    // Simple suggestion algorithm - find similar words in dictionary
    return spellCheck.dictionary
      .filter(dictWord => dictWord.startsWith(word[0]))
      .slice(0, 4); // Return max 4 suggestions
  };
  const replaceWord = (cellRef, oldWord, newWord) => {
    setCells(prev => {
      const cell = prev[cellRef];
      if (!cell) return prev;

      const newDisplay = cell.display.replace(new RegExp(`\\b${oldWord}\\b`, 'g'), newWord);

      return {
        ...prev,
        [cellRef]: {
          ...cell,
          display: newDisplay,
          value: cell.formula ? cell.value : newDisplay
        }
      };
    });

    // Move to next error
    if (currentSpellCheckIndex < spellCheckResults.length - 1) {
      setCurrentSpellCheckIndex(prev => prev + 1);
    } else {
      setSpellCheckResults([]); // Close when done
    }
  };

  const ignoreWord = (word) => {
    // Just move to next error
    if (currentSpellCheckIndex < spellCheckResults.length - 1) {
      setCurrentSpellCheckIndex(prev => prev + 1);
    } else {
      setSpellCheckResults([]);
    }
  };

  const addToDictionary = (word) => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').toLowerCase();
    if (!spellCheckDictionary.includes(cleanWord)) {
      spellCheckDictionary.push(cleanWord);
    }

    // Move to next error
    if (currentSpellCheckIndex < spellCheckResults.length - 1) {
      setCurrentSpellCheckIndex(prev => prev + 1);
    } else {
      setSpellCheckResults([]);
    }
  };
  const [spellCheckResults, setSpellCheckResults] = useState([]);
  const [currentSpellCheckIndex, setCurrentSpellCheckIndex] = useState(0);

  const showSpellCheckUI = (results) => {
    setSpellCheckResults(results);
    setCurrentSpellCheckIndex(0);
    // You might want to show a modal or panel here
  };

  const SpellCheckModal = () => {
    if (spellCheckResults.length === 0) return null;

    const currentError = spellCheckResults[currentSpellCheckIndex];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-96">
          <h3 className="text-lg font-bold mb-4">Spell Check</h3>

          <div className="mb-4">
            <p className="text-red-600">{currentError.word}</p>
            <p className="text-sm text-gray-600">in cell {currentError.cellRef}</p>
          </div>

          <div className="mb-4">
            <p className="font-medium mb-2">Suggestions:</p>
            <div className="space-y-2">
              {currentError.suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  className="block w-full text-left p-2 hover:bg-gray-100 rounded"
                  onClick={() => replaceWord(currentError.cellRef, currentError.word, suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() => ignoreWord(currentError.word)}
            >
              Ignore
            </button>
            <button
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() => addToDictionary(currentError.word)}
            >
              Add to Dictionary
            </button>
            <div className="flex space-x-2">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                disabled={currentSpellCheckIndex === 0}
                onClick={() => setCurrentSpellCheckIndex(prev => prev - 1)}
              >
                Previous
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                disabled={currentSpellCheckIndex === spellCheckResults.length - 1}
                onClick={() => setCurrentSpellCheckIndex(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const highlightError = (error) => {
    setSelectedCell(error.cellRef);
    setEditingCell(error.cellRef);
  };

  const handleSpellCheckAction = (action, suggestion = null) => {
    const currentError = spellCheck.errors[spellCheck.currentErrorIndex];

    switch (action) {
      case 'replace':
        // Replace the word in the cell
        setCells(prevCells => {
          const newCells = { ...prevCells };
          const cell = newCells[currentError.cellRef];

          if (cell) {
            const regex = new RegExp(`\\b${currentError.word}\\b`, 'gi');
            const newDisplay = cell.display.replace(regex, suggestion);

            newCells[currentError.cellRef] = {
              ...cell,
              display: newDisplay,
              value: cell.formula ? cell.value : newDisplay
            };
          }

          return newCells;
        });
        break;

      case 'ignore':
        // No action needed, just move to next error
        break;

      case 'add':
        // Add to dictionary
        setSpellCheck(prev => ({
          ...prev,
          dictionary: [...prev.dictionary, currentError.word.toLowerCase()]
        }));
        break;
    }

    // Move to next error or finish
    moveToNextError();
  };

  const moveToNextError = () => {
    setSpellCheck(prev => {
      if (prev.currentErrorIndex < prev.errors.length - 1) {
        return { ...prev, currentErrorIndex: prev.currentErrorIndex + 1 };
      } else {
        return { ...prev, active: false };
      }
    });
  };

  const moveToPrevError = () => {
    setSpellCheck(prev => {
      if (prev.currentErrorIndex > 0) {
        return { ...prev, currentErrorIndex: prev.currentErrorIndex - 1 };
      }
      return prev;
    });
  };


  // Helper function to parse cell references
  const parseCellReference = (ref) => {
    const matches = ref.match(/^([A-Z]+)(\d+)$/);
    if (!matches) return [0, 0];

    const col = matches[1].split('').reduce((acc, char) =>
      acc * 26 + char.charCodeAt(0) - 65, 0);
    const row = parseInt(matches[2]) - 1;

    return [col, row];
  };

  const setCellValue = (row, col, value) => {
    const key = getCellKey(row, col);
    const newData = { ...cellData, [key]: value };
    setCellData(newData);
    addToHistory(newData, cellStyles);
  };

  const setCellStyle = (row, col, style) => {
    const key = getCellKey(row, col);
    const newStyles = { ...cellStyles, [key]: { ...cellStyles[key], ...style } };
    setCellStyles(newStyles);
    addToHistory(cellData, newStyles);
  };

  const addToHistory = (currentCells) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      cells: JSON.parse(JSON.stringify(currentCells)),
      timestamp: new Date().toISOString()
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };
  const handleImageInsert = () => {
    if (!selectedCell) {
      showNotification('Please select a cell first');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target.result;

        // Update cell with image tag
        setCells(prev => ({
          ...prev,
          [selectedCell]: {
            value: '',
            isImage: true,
            image: imageDataUrl
          }
        }));
      };

      reader.readAsDataURL(file);
    };

    input.click();
  };


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    if (url && (url.startsWith('http') || url.startsWith('data:'))) {
      setPreviewImage(url);
    } else {
      setPreviewImage(null);
    }
  };

  const insertImage = () => {
    if (selectedCell && previewImage) {
      setCells(prev => ({
        ...prev,
        [selectedCell]: {
          type: 'image',
          value: activeImageTab === 'url' ? imageUrl : 'Uploaded Image',
          src: previewImage,
          display: '', // Optional: you can add alt text here
          style: prev[selectedCell]?.style || {} // Preserve existing styles
        }
      }));
      setShowImageDialog(false);
      showNotification('Image inserted successfully');
    }
  };

  const removeImage = (cellRef) => {
    setCells(prev => ({
      ...prev,
      [cellRef]: {
        value: '',
        type: 'text',
        style: prev[cellRef]?.style || {}
      }
    }));
  };




  const saveToHistory = () => {
    setHistory((prev) => [...prev, { cells: { ...cells }, cellStyles: { ...cellStyles } }]);
    setFuture([]); // Clear redo stack on new change
  };


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateCellsAndStyles = (newCells, newStyles) => {
    setCells(prev => {
      const updated = { ...prev };
      for (let key in newCells) {
        updated[key] = { ...prev[key], ...newCells[key] }; // Merge existing and new properties
      }
      return updated;
    });
    setCellStyles(prev => ({ ...prev, ...newStyles }));
  };


  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setCells(prev.cells);
      setCellStyles(prev.styles);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setCells(next.cells);
      setCellStyles(next.styles);
      setHistoryIndex(historyIndex + 1);
    }
  };


  // Add to state declarations


  const handleResizeMouseDown = (type, index, e) => {
    setResizing({
      active: true,
      type,
      index,
      startPos: type === 'col' ? e.clientX : e.clientY
    });
    setDragPos(type === 'col' ? e.clientX : e.clientY);
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowShareDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerateChart = () => {
    const activeColumns = new Set();

    // Pass 1: Identify active columns with non-zero values
    for (let row = 1; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const key = `${row},${col}`;
        const cell = cells[key];
        const value = typeof cell === 'object' ? cell.display ?? cell.value : cell;

        if (value && value !== "0" && value !== "0.0") {
          activeColumns.add(col);
        }
      }
    }


  
    // Pass 2: Get column headers from row 0
    const headers = [];
    activeColumns.forEach((col) => {
      const key = `0,${col}`;
      const headerCell = cells[key];
      const name = typeof headerCell === 'object' ? headerCell.display ?? headerCell.value : headerCell;
      headers.push({
        index: col,
        name: name || `Column ${col + 1}`
      });
    });

    // Pass 3: Construct chart data rows
    const chartData = [];
    for (let row = 1; row < ROWS; row++) {
      const rowData = {};
      let hasData = false;

      headers.forEach((header) => {
        const key = `${row},${header.index}`;
        const cell = cells[key];
        const value = typeof cell === 'object' ? cell.display ?? cell.value : cell;

        if (value && value !== "0") {
          rowData[header.name] = isNaN(value) ? value : Number(value);
          hasData = true;
        }
      });

      if (hasData) chartData.push(rowData);
    }

    // Final step: save and navigate
    setSpreadsheetData(chartData);
    setDataSource("spreadsheet");
    navigate("/charts");
  };

  const handleResizeMouseMove = (e) => {
    if (!resizing.active) return;

    const pos = resizing.type === 'col' ? e.clientX : e.clientY;
    const delta = pos - resizing.startPos;

    if (Math.abs(delta) > 3) {
      if (resizing.type === 'col') {
        const newWidth = Math.max(20, (colWidths[resizing.index] || DEFAULT_COL_WIDTH) + delta);
        setColWidths((prev) => ({ ...prev, [resizing.index]: newWidth }));
      }
      setResizing((prev) => ({ ...prev, startPos: pos }));
    }
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [resizing]);


  const handleResizeMouseUp = () => {
    setResizing({ active: false, type: null, index: null, startPos: 0 });
    setDragPos(null);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [resizing]);


  useEffect(() => {
    console.log('Attaching mouseup listener for drag-to-select');
    const logMouseUp = (e) => {
      console.log('Mouseup event fired:', e);
      handleCellMouseUp(e);
    };
    document.addEventListener('mouseup', logMouseUp);
    return () => {
      console.log('Removing mouseup listener for drag-to-select');
      document.removeEventListener('mouseup', logMouseUp);
    };
  }, []);

  const isCellInRange = (row, col) => {
    if (!selectedRange.startRow || !selectedRange.endRow) return false;
    const minRow = Math.min(selectedRange.startRow, selectedRange.endRow);
    const maxRow = Math.max(selectedRange.startRow, selectedRange.endRow);
    const minCol = Math.min(selectedRange.startCol, selectedRange.endCol);
    const maxCol = Math.max(selectedRange.startCol, selectedRange.endCol);
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  };

  const handleCellMouseDown = (row, col, e) => {
    e.stopPropagation();

    if (e.shiftKey && selectedCell) {
      // Extend selection with shift key
      setSelectedRange({
        start: { row: selectedCell.row, col: selectedCell.col },
        end: { row, col }
      });
    } else {
      // New selection
      setSelectedCell({ row, col });
      setSelectedRange({
        start: { row, col },
        end: { row, col }
      });
    }
    setIsSelecting(true);
  };

  const handleCellMouseMove = (cellRef, e) => {
    if (isSelecting) {
      const { row, col } = cellToCoords(cellRef);
      setSelectedRange((prev) => ({
        ...prev,
        endRow: row,
        endCol: col,
        rangeString: getRangeString(prev.startRow, prev.startCol, row, col),
      }));
    }
  };

  const handleCellMouseUp = (e) => {
    e.stopPropagation();
    setIsSelecting(false);
    console.log('Drag stopped, isSelecting set to false');
  };


  const getRangeString = (startRow, startCol, endRow, endCol) => {
    const start = String.fromCharCode(65 + Math.min(startCol, endCol)) + (Math.min(startRow, endRow) + 1);
    const end = String.fromCharCode(65 + Math.max(startCol, endCol)) + (Math.max(startRow, endRow) + 1);
    return `${start}:${end}`;
  };



  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      return true;
    } catch (err) {
      console.error('Failed to copy: ', err);
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        return true;
      } catch (err) {
        console.error('Fallback copy failed: ', err);
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };


  const getColumnHeader = (index) => String.fromCharCode(65 + index);

  useEffect(() => {
    const initialCells = {};
    for (let row = 1; row <= ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cellRef = String.fromCharCode(65 + col) + row;
        initialCells[cellRef] = { value: '', formula: '', display: '', description: '', style: {} };
      }
    }
    setCells(initialCells);
  }, []);


  const getCellNumericValue = (cellRef, dataContext = cells) => {
    const cell = dataContext[cellRef];
    if (!cell || cell.display === undefined || cell.display === null) return 0;
    const value = cell.display;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };



  function updateCellValue(cell) {
    if (cell.text.startsWith("=")) {
      const formula = cell.text.substring(1); // Remove "="
      const result = evaluateFormula(formula);
      cell.displayValue = result;
    } else {
      cell.displayValue = cell.text;
    }
  }

  const evaluateFormula = useCallback((formula, cellRef, dataContext = cells) => {
    if (!formula || !formula.startsWith('=')) {
      return formula;
    }

    try {
      let expr = formula.substring(1).toUpperCase();

      const getSingleCellValue = (ref) => {
        const [colLabel, rowStr] = ref.split(/(?=[0-9])/);
        const col = colLabel.charCodeAt(0) - 65;
        const row = parseInt(rowStr) - 1;
        const key = `${row},${col}`;
        return dataContext[key]?.value || dataContext[key]?.display || '';
      };

      const getRangeValues = (range) => {
        const cellsInRange = parseRange(range);
        const values = [];
        cellsInRange.forEach(cell => {
          const [colLabel, rowStr] = cell.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          values.push(dataContext[key]?.value || dataContext[key]?.display || '');
        });
        return values;
      };

      // CONCATENATE function
      if (expr.startsWith('CONCATENATE(')) {
        const args = expr.match(/CONCATENATE\(([^)]+)\)/)[1];
        const cellRefs = args.split(',').map(ref => ref.trim());
        let result = '';
        cellRefs.forEach(ref => {
          if (ref.includes(':')) {
            const cellsInRange = parseRange(ref);
            cellsInRange.forEach(cell => {
              const cellData = dataContext[cell];
              result += cellData?.display || cellData?.value || '';
            });
          } else {
            const cellData = dataContext[ref];
            result += cellData?.display || cellData?.value || '';
          }
        });
        return result;
      }

      // SUM function
      if (expr.startsWith('SUM(')) {
        const args = expr.match(/SUM\(([^)]+)\)/)[1];
        const cellRefs = args.split(',').map(ref => ref.trim());
        let sum = 0;
        cellRefs.forEach(ref => {
          if (ref.includes(':')) {
            const cellsInRange = parseRange(ref);
            cellsInRange.forEach(cell => {
              const cellData = dataContext[cell];
              const num = parseFloat(cellData?.display || cellData?.value) || 0;
              sum += num;
            });
          } else {
            const cellData = dataContext[ref];
            const num = parseFloat(cellData?.display || cellData?.value) || 0;
            sum += num;
          }
        });
        return sum.toString();
      }

      // AVERAGE function
      if (expr.startsWith('AVERAGE(')) {
        const args = expr.match(/AVERAGE\(([^)]+)\)/)[1];
        const cellRefs = args.split(',').map(ref => ref.trim());
        let sum = 0;
        let count = 0;
        cellRefs.forEach(ref => {
          if (ref.includes(':')) {
            const cellsInRange = parseRange(ref);
            cellsInRange.forEach(cell => {
              const cellData = dataContext[cell];
              const num = parseFloat(cellData?.display || cellData?.value) || 0;
              sum += num;
              count++;
            });
          } else {
            const cellData = dataContext[ref];
            const num = parseFloat(cellData?.display || cellData?.value) || 0;
            sum += num;
            count++;
          }
        });
        return count > 0 ? (sum / count).toString() : '0';
      }

      // Logical Functions
      if (expr.startsWith('AND(')) {
        const range = expr.match(/AND\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val) || 0);
        return values.every(val => Boolean(val)) ? '1' : '0';
      }
      if (expr.startsWith('FALSE(')) {
        return '0';
      }
      if (expr.startsWith('IF(')) {
        const match = expr.match(/IF\(([A-Z]+[0-9]+),([^,]+),([^)]+)\)/);
        if (match) {
          const [_, conditionRef, valueIfTrue, valueIfFalse] = match;
          const condition = Number(getSingleCellValue(conditionRef));
          return Boolean(condition) ? getSingleCellValue(valueIfTrue) : getSingleCellValue(valueIfFalse);
        }
      }
      if (expr.startsWith('IFERROR(')) {
        const match = expr.match(/IFERROR\(([A-Z]+[0-9]+),([^)]+)\)/);
        if (match) {
          const [_, valueRef, valueIfError] = match;
          const value = Number(getSingleCellValue(valueRef));
          return isNaN(value) ? getSingleCellValue(valueIfError) : value.toString();
        }
      }
      if (expr.startsWith('IFS(')) {
        const args = expr.match(/IFS\(([^)]+)\)/)[1];
        const pairs = args.split(',').map(ref => ref.trim());
        let value = '';
        for (let i = 0; i < pairs.length - 1; i += 2) {
          if (Boolean(Number(getSingleCellValue(pairs[i])))) {
            value = getSingleCellValue(pairs[i + 1]);
            break;
          }
        }
        return value || '0';
      }
      if (expr.startsWith('NOT(')) {
        const ref = expr.match(/NOT\(([A-Z]+[0-9]+)\)/)[1];
        return Boolean(Number(getSingleCellValue(ref))) ? '0' : '1';
      }
      if (expr.startsWith('OR(')) {
        const range = expr.match(/OR\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val) || 0);
        return values.some(val => Boolean(val)) ? '1' : '0';
      }
      if (expr.startsWith('SWITCH(')) {
        const match = expr.match(/SWITCH\(([A-Z]+[0-9]+),([^)]+)\)/);
        if (match) {
          const [_, exprRef, pairs] = match;
          const expression = getSingleCellValue(exprRef);
          const pairList = pairs.split(',').map(ref => ref.trim());
          let value = '';
          for (let i = 0; i < pairList.length - 1; i += 2) {
            if (expression === getSingleCellValue(pairList[i])) {
              value = getSingleCellValue(pairList[i + 1]);
              break;
            }
          }
          return value || (pairList.length % 2 ? getSingleCellValue(pairList[pairList.length - 1]) : '0');
        }
      }
      if (expr.startsWith('TRUE(')) {
        return '1';
      }
      if (expr.startsWith('XOR(')) {
        const range = expr.match(/XOR\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val) || 0);
        return values.reduce((acc, val) => acc ^ Boolean(val), 0).toString();
      }

      // Statistical Functions
      if (expr.startsWith('COUNT(')) {
        const range = expr.match(/COUNT\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val));
        return values.filter(val => !isNaN(val) && val !== '').length.toString();
      }
      if (expr.startsWith('COUNTA(')) {
        const range = expr.match(/COUNTA\(([^)]+)\)/)[1];
        const values = getRangeValues(range);
        return values.filter(val => val !== '').length.toString();
      }
      if (expr.startsWith('COUNTBLANK(')) {
        const range = expr.match(/COUNTBLANK\(([^)]+)\)/)[1];
        const cellsInRange = parseRange(range);
        let count = 0;
        cellsInRange.forEach(cell => {
          const [colLabel, rowStr] = cell.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          if (!dataContext[key]?.value && !dataContext[key]?.display) count++;
        });
        return count.toString();
      }
      if (expr.startsWith('COUNTIF(')) {
        const match = expr.match(/COUNTIF\(([^,]+),([^)]+)\)/);
        if (match) {
          const [_, range, criterionRef] = match;
          const criterion = getSingleCellValue(criterionRef);
          const values = getRangeValues(range);
          return values.filter(val => val === criterion).length.toString();
        }
      }
      if (expr.startsWith('MEDIAN(')) {
        const range = expr.match(/MEDIAN\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val)).sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        const value = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('MODE(')) {
        const range = expr.match(/MODE\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
        const counts = {};
        values.forEach(val => counts[val] = (counts[val] || 0) + 1);
        const value = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '0');
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('STDEV(')) {
        const range = expr.match(/STDEV\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const variance = values.length > 1 ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1) : 0;
        const value = Math.sqrt(variance);
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('STDEVP(')) {
        const range = expr.match(/STDEVP\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const variance = values.length ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length : 0;
        const value = Math.sqrt(variance);
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('VAR(')) {
        const range = expr.match(/VAR\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const value = values.length > 1 ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1) : 0;
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('VARP(')) {
        const range = expr.match(/VARP\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const value = values.length ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length : 0;
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('STDEVA(')) {
        const range = expr.match(/STDEVA\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val) || 0);
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const variance = values.length > 1 ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1) : 0;
        const value = Math.sqrt(variance);
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('STDEVPA(')) {
        const range = expr.match(/STDEVPA\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val) || 0);
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const variance = values.length ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length : 0;
        const value = Math.sqrt(variance);
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('VARA(')) {
        const range = expr.match(/VARA\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val) || 0);
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const value = values.length > 1 ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1) : 0;
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('VARPA(')) {
        const range = expr.match(/VARPA\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val) || 0);
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const value = values.length ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length : 0;
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('CORREL(')) {
        const range = expr.match(/CORREL\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
        const mid = values.length / 2;
        const x = values.slice(0, mid);
        const y = values.slice(mid);
        const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
        const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
        const cov = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0) / x.length;
        const stdevX = Math.sqrt(x.reduce((sum, val) => sum + (val - meanX) ** 2, 0) / x.length);
        const stdevY = Math.sqrt(y.reduce((sum, val) => sum + (val - meanY) ** 2, 0) / y.length);
        const value = cov / (stdevX * stdevY);
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('COVAR(')) {
        const range = expr.match(/COVAR\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
        const mid = values.length / 2;
        const x = values.slice(0, mid);
        const y = values.slice(mid);
        const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
        const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
        const value = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0) / x.length;
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('GEOMEAN(')) {
        const range = expr.match(/GEOMEAN\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => val > 0);
        const value = Math.exp(values.reduce((sum, val) => sum + Math.log(val), 0) / values.length);
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('HARMEAN(')) {
        const range = expr.match(/HARMEAN\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => val > 0);
        const value = values.length / values.reduce((sum, val) => sum + 1 / val, 0);
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('KURT(')) {
        const range = expr.match(/KURT\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const stdev = Math.sqrt(values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1));
        const n = values.length;
        const value = (values.reduce((sum, val) => sum + ((val - mean) / stdev) ** 4, 0) * n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3)));
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('SKEW(')) {
        const range = expr.match(/SKEW\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const stdev = Math.sqrt(values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1));
        const value = values.reduce((sum, val) => sum + ((val - mean) / stdev) ** 3, 0) * values.length / ((values.length - 1) * (values.length - 2));
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('SLOPE(')) {
        const range = expr.match(/SLOPE\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
        const mid = values.length / 2;
        const y = values.slice(0, mid);
        const x = values.slice(mid);
        const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
        const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
        const num = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
        const denom = x.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
        const value = num / denom;
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('INTERCEPT(')) {
        const range = expr.match(/INTERCEPT\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
        const mid = values.length / 2;
        const y = values.slice(0, mid);
        const x = values.slice(mid);
        const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
        const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
        const num = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
        const denom = x.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
        const slope = num / denom;
        const value = meanY - slope * meanX;
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('RSQ(')) {
        const range = expr.match(/RSQ\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
        const mid = values.length / 2;
        const y = values.slice(0, mid);
        const x = values.slice(mid);
        const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
        const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
        const num = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
        const denomX = x.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
        const denomY = y.reduce((sum, val) => sum + (val - meanY) ** 2, 0);
        const value = (num ** 2) / (denomX * denomY);
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('FORECAST(')) {
        const match = expr.match(/FORECAST\(([A-Z]+[0-9]+),([^)]+)\)/);
        if (match) {
          const [_, xRef, range] = match;
          const x = Number(getSingleCellValue(xRef));
          const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
          const mid = values.length / 2;
          const y = values.slice(0, mid);
          const knownX = values.slice(mid);
          const meanX = knownX.reduce((sum, val) => sum + val, 0) / knownX.length;
          const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
          const num = knownX.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
          const denom = knownX.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
          const slope = num / denom;
          const intercept = meanY - slope * meanX;
          const value = slope * x + intercept;
          return isNaN(value) ? '0' : value.toString();
        }
      }
      if (expr.startsWith('TREND(')) {
        const range = expr.match(/TREND\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
        const mid = values.length / 2;
        const y = values.slice(0, mid);
        const x = values.slice(mid);
        const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
        const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
        const num = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
        const denom = x.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
        const slope = num / denom;
        const intercept = meanY - slope * meanX;
        const value = x.map(val => slope * val + intercept).join(',');
        return value;
      }
      if (expr.startsWith('PERCENTILE(')) {
        const match = expr.match(/PERCENTILE\(([^,]+),([A-Z]+[0-9]+)\)/);
        if (match) {
          const [_, range, kRef] = match;
          const k = Number(getSingleCellValue(kRef));
          const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val)).sort((a, b) => a - b);
          const n = values.length;
          const index = k * (n - 1);
          const lower = Math.floor(index);
          const fraction = index - lower;
          const value = lower < n - 1 ? values[lower] + fraction * (values[lower + 1] - values[lower]) : values[n - 1];
          return isNaN(value) ? '0' : value.toString();
        }
      }
      if (expr.startsWith('PERCENTRANK(')) {
        const match = expr.match(/PERCENTRANK\(([^,]+),([A-Z]+[0-9]+)\)/);
        if (match) {
          const [_, range, xRef] = match;
          const x = Number(getSingleCellValue(xRef));
          const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val)).sort((a, b) => a - b);
          const rank = values.findIndex(val => val >= x);
          const value = rank / (values.length - 1);
          return isNaN(value) ? '0' : value.toString();
        }
      }
      if (expr.startsWith('QUARTILE(')) {
        const match = expr.match(/QUARTILE\(([^,]+),([A-Z]+[0-9]+)\)/);
        if (match) {
          const [_, range, quartRef] = match;
          const quart = Number(getSingleCellValue(quartRef));
          const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val)).sort((a, b) => a - b);
          const n = values.length;
          const k = quart * (n - 1) / 4;
          const lower = Math.floor(k);
          const fraction = k - lower;
          const value = lower < n - 1 ? values[lower] + fraction * (values[lower + 1] - values[lower]) : values[n - 1];
          return isNaN(value) ? '0' : value.toString();
        }
      }
      if (expr.startsWith('RANK(')) {
        const match = expr.match(/RANK\(([A-Z]+[0-9]+),([^)]+)\)/);
        if (match) {
          const [_, xRef, range] = match;
          const x = Number(getSingleCellValue(xRef));
          const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val)).sort((a, b) => b - a);
          const value = values.indexOf(x) + 1;
          return value || '0';
        }
      }
      if (expr.startsWith('LARGE(')) {
        const match = expr.match(/LARGE\(([^,]+),([A-Z]+[0-9]+)\)/);
        if (match) {
          const [_, range, kRef] = match;
          const k = Number(getSingleCellValue(kRef));
          const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val)).sort((a, b) => b - a);
          const value = values[k - 1] || 0;
          return value.toString();
        }
      }
      if (expr.startsWith('SMALL(')) {
        const match = expr.match(/SMALL\(([^,]+),([A-Z]+[0-9]+)\)/);
        if (match) {
          const [_, range, kRef] = match;
          const k = Number(getSingleCellValue(kRef));
          const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val)).sort((a, b) => a - b);
          const value = values[k - 1] || 0;
          return value.toString();
        }
      }
      if (expr.startsWith('DEVSQ(')) {
        const range = expr.match(/DEVSQ\(([^)]+)\)/)[1];
        const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val));
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const value = values.reduce((sum, val) => sum + (val - mean) ** 2, 0);
        return isNaN(value) ? '0' : value.toString();
      }
      if (expr.startsWith('TRIMMEAN(')) {
        const match = expr.match(/TRIMMEAN\(([^,]+),([A-Z]+[0-9]+)\)/);
        if (match) {
          const [_, range, percentRef] = match;
          const percent = Number(getSingleCellValue(percentRef));
          const values = getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val)).sort((a, b) => a - b);
          const n = values.length;
          const trim = Math.floor(n * percent / 2);
          const trimmedValues = values.slice(trim, n - trim);
          const value = trimmedValues.length ? trimmedValues.reduce((sum, val) => sum + val, 0) / trimmedValues.length : 0;
          return isNaN(value) ? '0' : value.toString();
        }
      }

      // Array Functions
      if (expr.startsWith('FILTER(')) {
        const match = expr.match(/FILTER\(([^,]+),([A-Z]+[0-9]+)\)/);
        if (match) {
          const [_, range, conditionRef] = match;
          const condition = Number(getSingleCellValue(conditionRef));
          const values = getRangeValues(range).filter((val, i) => Number(getRangeValues(range)[i]) >= condition);
          return values.join(',');
        }
      }
      if (expr.startsWith('FLATTEN(')) {
        const range = expr.match(/FLATTEN\(([^)]+)\)/)[1];
        return getRangeValues(range).join(',');
      }
      if (expr.startsWith('SORT(')) {
        const range = expr.match(/SORT\(([^)]+)\)/)[1];
        return getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val)).sort((a, b) => a - b).join(',');
      }
      if (expr.startsWith('SORTN(')) {
        const match = expr.match(/SORTN\(([^,]+),([A-Z]+[0-9]+)\)/);
        if (match) {
          const [_, range, nRef] = match;
          const n = Number(getSingleCellValue(nRef));
          return getRangeValues(range).map(val => Number(val)).filter(val => !isNaN(val)).sort((a, b) => a - b).slice(0, n).join(',');
        }
      }
      if (expr.startsWith('UNIQUE(')) {
        const range = expr.match(/UNIQUE\(([^)]+)\)/)[1];
        return [...new Set(getRangeValues(range))].join(',');
      }

      // Lookup Functions
      if (expr.startsWith('CHOOSE(')) {
        const match = expr.match(/CHOOSE\(([A-Z]+[0-9]+),([^)]+)\)/);
        if (match) {
          const [_, indexRef, values] = match;
          const index = Number(getSingleCellValue(indexRef));
          const valueList = values.split(',').map(ref => ref.trim());
          return index > 0 && index <= valueList.length ? getSingleCellValue(valueList[index - 1]) : '0';
        }
      }
      if (expr.startsWith('HLOOKUP(')) {
        const match = expr.match(/HLOOKUP\(([A-Z]+[0-9]+),([^,]+),([0-9]+)\)/);
        if (match) {
          const [_, lookupRef, range, index] = match;
          const lookupValue = getSingleCellValue(lookupRef);
          const values = getRangeValues(range);
          const rowLength = parseRange(range).length / (parseRange(range)[0].match(/[0-9]+/)[0] === parseRange(range)[parseRange(range).length - 1].match(/[0-9]+/)[0] ? 1 : Number(index));
          const firstRow = values.slice(0, rowLength);
          const targetRow = values.slice((Number(index) - 1) * rowLength, Number(index) * rowLength);
          const colIndex = firstRow.indexOf(lookupValue);
          return colIndex >= 0 ? targetRow[colIndex] : '0';
        }
      }
      if (expr.startsWith('INDEX(')) {
        const match = expr.match(/INDEX\(([^,]+),([A-Z]+[0-9]+)\)/);
        if (match) {
          const [_, range, rowRef] = match;
          const rowNum = Number(getSingleCellValue(rowRef));
          const values = getRangeValues(range);
          const rowLength = parseRange(range).length / (parseRange(range)[0].match(/[0-9]+/)[0] === parseRange(range)[parseRange(range).length - 1].match(/[0-9]+/)[0] ? 1 : parseRange(range).length);
          return rowNum > 0 && rowNum <= Math.ceil(values.length / rowLength) ? values[(rowNum - 1) * rowLength] : '0';
        }
      }
      if (expr.startsWith('MATCH(')) {
        const match = expr.match(/MATCH\(([A-Z]+[0-9]+),([^)]+)\)/);
        if (match) {
          const [_, lookupRef, range] = match;
          const lookupValue = getSingleCellValue(lookupRef);
          const values = getRangeValues(range);
          const index = values.indexOf(lookupValue) + 1;
          return index || '0';
        }
      }
      if (expr.startsWith('VLOOKUP(')) {
        const match = expr.match(/VLOOKUP\(([A-Z]+[0-9]+),([^,]+),([0-9]+)\)/);
        if (match) {
          const [_, lookupRef, range, index] = match;
          const lookupValue = getSingleCellValue(lookupRef);
          const values = getRangeValues(range);
          const colLength = parseRange(range).length / (parseRange(range)[0].match(/[A-Z]+/)[0] === parseRange(range)[parseRange(range).length - 1].match(/[A-Z]+/)[0] ? 1 : Number(index));
          const firstCol = values.filter((_, i) => i % colLength === 0);
          const targetCol = values.filter((_, i) => i % colLength === Number(index) - 1);
          const rowIndex = firstCol.indexOf(lookupValue);
          return rowIndex >= 0 ? targetCol[rowIndex] : '0';
        }
      }

      // Information Functions
      if (expr.startsWith('CELL(')) {
        const match = expr.match(/CELL\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
        if (match) {
          const [_, infoTypeRef, cellRef] = match;
          const infoType = getSingleCellValue(infoTypeRef);
          const [colLabel, rowStr] = cellRef.match(/([A-Z]+)([0-9]+)/)?.slice(1) || ['', '1'];
          return infoType === 'address' ? cellRef : infoType === 'row' ? rowStr : infoType === 'col' ? colLabel : '';
        }
      }
      if (expr.startsWith('ERROR_TYPE(')) {
        const ref = expr.match(/ERROR_TYPE\(([A-Z]+[0-9]+)\)/)[1];
        return isNaN(Number(getSingleCellValue(ref))) ? '1' : '0';
      }
      if (expr.startsWith('INFO(')) {
        const ref = expr.match(/INFO\(([A-Z]+[0-9]+)\)/)[1];
        const infoType = getSingleCellValue(ref);
        return infoType === 'osversion' ? 'Browser' : infoType === 'system' ? 'Web' : '';
      }
      if (expr.startsWith('ISBLANK(')) {
        const ref = expr.match(/ISBLANK\(([A-Z]+[0-9]+)\)/)[1];
        return getSingleCellValue(ref) === '' ? '1' : '0';
      }
      if (expr.startsWith('ISERR(')) {
        const ref = expr.match(/ISERR\(([A-Z]+[0-9]+)\)/)[1];
        return isNaN(Number(getSingleCellValue(ref))) && getSingleCellValue(ref) !== '#N/A' ? '1' : '0';
      }
      if (expr.startsWith('ISERROR(')) {
        const ref = expr.match(/ISERROR\(([A-Z]+[0-9]+)\)/)[1];
        return isNaN(Number(getSingleCellValue(ref))) ? '1' : '0';
      }
      if (expr.startsWith('ISEVEN(')) {
        const ref = expr.match(/ISEVEN\(([A-Z]+[0-9]+)\)/)[1];
        return Number(getSingleCellValue(ref)) % 2 === 0 ? '1' : '0';
      }
      if (expr.startsWith('ISFORMULA(')) {
        const ref = expr.match(/ISFORMULA\(([A-Z]+[0-9]+)\)/)[1];
        const [colLabel, rowStr] = ref.split(/(?=[0-9])/);
        const col = colLabel.charCodeAt(0) - 65;
        const row = parseInt(rowStr) - 1;
        const key = `${row},${col}`;
        return dataContext[key]?.formula ? '1' : '0';
      }
      if (expr.startsWith('ISLOGICAL(')) {
        const ref = expr.match(/ISLOGICAL\(([A-Z]+[0-9]+)\)/)[1];
        return getSingleCellValue(ref) === '1' || getSingleCellValue(ref) === '0' ? '1' : '0';
      }
      if (expr.startsWith('ISNA(')) {
        const ref = expr.match(/ISNA\(([A-Z]+[0-9]+)\)/)[1];
        return getSingleCellValue(ref) === '#N/A' ? '1' : '0';
      }
      if (expr.startsWith('ISNONTEXT(')) {
        const ref = expr.match(/ISNONTEXT\(([A-Z]+[0-9]+)\)/)[1];
        return isNaN(Number(getSingleCellValue(ref))) ? '0' : '1';
      }
      if (expr.startsWith('ISNUMBER(')) {
        const ref = expr.match(/ISNUMBER\(([A-Z]+[0-9]+)\)/)[1];
        return !isNaN(Number(getSingleCellValue(ref))) ? '1' : '0';
      }
      if (expr.startsWith('ISODD(')) {
        const ref = expr.match(/ISODD\(([A-Z]+[0-9]+)\)/)[1];
        return Number(getSingleCellValue(ref)) % 2 !== 0 ? '1' : '0';
      }
      if (expr.startsWith('ISREF(')) {
        const ref = expr.match(/ISREF\(([A-Z]+[0-9]+)\)/)[1];
        return /^[A-Z]+[0-9]+$/.test(getSingleCellValue(ref)) ? '1' : '0';
      }
      if (expr.startsWith('ISTEXT(')) {
        const ref = expr.match(/ISTEXT\(([A-Z]+[0-9]+)\)/)[1];
        return isNaN(Number(getSingleCellValue(ref))) && getSingleCellValue(ref) !== '' ? '1' : '0';
      }
      if (expr.startsWith('N(')) {
        const ref = expr.match(/N\(([A-Z]+[0-9]+)\)/)[1];
        const val = getSingleCellValue(ref);
        return val === '1' ? '1' : val === '0' ? '0' : Number(val)?.toString() || '0';
      }
      if (expr.startsWith('NA(')) {
        return '#N/A';
      }
      if (expr.startsWith('SHEET(')) {
        return '1';
      }
      if (expr.startsWith('SHEETS(')) {
        return '1';
      }
      if (expr.startsWith('TYPE(')) {
        const ref = expr.match(/TYPE\(([A-Z]+[0-9]+)\)/)[1];
        const val = getSingleCellValue(ref);
        return !isNaN(Number(val)) ? '1' : val === '1' || val === '0' ? '4' : isNaN(Number(val)) ? '2' : '0';
      }

    } catch (e) {
      return '#ERROR!';
    }
  }, [cells]);

  const validateCell = (cellRef, value) => {
    const validation = validations[cellRef];
    if (!validation) return true;

    const isValid = validation.validator(value);

    if (!isValid) {
      switch (validation.errorStyle) {
        case 'stop':
          alert(validation.errorMessage);
          return false;
        case 'warning':
          if (!window.confirm(`${validation.errorMessage}\n\nDo you want to continue anyway?`)) {
            return false;
          }
          return true;
        case 'info':
          alert(validation.errorMessage);
          return true;
        default:
          return false;
      }
    }

    return true;
  };

  const handleQuickSort = (order) => {
    if (!selectedRange) {
      showNotification('Please select a range to sort');
      return;
    }

    const { start, end } = selectedRange;
    const hasHeader = true; // Assume headers by default for quick sort

    try {
      // Parse range boundaries
      const startRow = Math.min(start.row, end.row);
      const endRow = Math.max(start.row, end.row);
      const startCol = Math.min(start.col, end.col);
      const endCol = Math.max(start.col, end.col);

      // Extract the data range
      const rows = [];
      for (let row = startRow + (hasHeader ? 1 : 0); row <= endRow; row++) {
        const rowData = [];
        for (let col = startCol; col <= endCol; col++) {
          const key = getCellKey(row, col); // Use row,col format
          rowData.push({
            key,
            value: cells[key]?.value || '',
            display: cells[key]?.display || '',
            formula: cells[key]?.formula || ''
          });
        }
        rows.push(rowData);
      }

      // Sort the data based on the first column
      rows.sort((a, b) => {
        const aValue = a[0]?.display || a[0]?.value || ''; // Use display or value
        const bValue = b[0]?.display || b[0]?.value || '';
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return order === 'asc' ? aNum - bNum : bNum - aNum;
        }
        return order === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });

      // Update cells with sorted data
      const newCells = { ...cells };
      let currentRow = startRow + (hasHeader ? 1 : 0);
      rows.forEach(rowData => {
        rowData.forEach((cell, colIndex) => {
          const col = startCol + colIndex;
          const newKey = getCellKey(currentRow, col);
          newCells[newKey] = {
            ...newCells[newKey],
            value: cell.value,
            display: cell.display,
            formula: cell.formula
          };
        });
        currentRow++;
      });

      setCells(newCells);
      addToHistory(newCells, cellStyles); // Save to history for undo/redo
      showNotification(`Range sorted ${order === 'asc' ? 'A to Z' : 'Z to A'}`);
    } catch (error) {
      console.error('Quick sort failed:', error);
      showNotification('Failed to sort range');
    }
  };


useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      setSelectedCell((prev) => {
        const nextRow = Math.min(prev.row + 1, ROWS - 1);
        const newCellKey = `${nextRow},${prev.col}`;

        // Delay focus to allow React state to update
        setTimeout(() => {
          const nextCell = cellRefs.current[newCellKey];
          if (nextCell) nextCell.focus();
        }, 0);

        return { row: nextRow, col: prev.col };
      });
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);



  const handleCellChange = (cellRef, value) => {
    const newCells = {
      ...cells,
      [cellRef]: {
        ...cells[cellRef],
        value: value,
        formula: value.startsWith('=') ? value : '',
        display: value.startsWith('=') ? evaluateFormula(value, cellRef, cells) : value
      }
    };
    const recalculatedCells = recalculateFormulas(newCells);
    setCells(recalculateFormulas(newCells));

    setFormulaBar(value);
    setSpreadsheetData(recalculatedCells);
  };


  const handleFunctionClick = (funcName) => {
    const cellRef = selectedCell;
    const cell = cells[cellRef] || { value: '', formula: '', display: '' };
    if (funcName === 'SUM' || funcName === 'CONCATENATE') {
      if (selectedRange.rangeString) {
        const [startCol] = selectedRange.rangeString.match(/([A-Z]+)(\d+):[A-Z]+\d+/).slice(1);
        const endRow = Math.max(...selectedRange.rangeString.match(/\d+/g).map(Number));
        const nextRow = endRow + 1;
        const nextCell = `${startCol}${nextRow}`;
        const formula = `=${funcName}(${selectedRange.rangeString})`;
        const newCells = {
          ...cells,
          [nextCell]: {
            ...cells[nextCell],
            value: formula,
            formula: formula,
            display: evaluateFormula(formula, nextCell, cells)
          },
          ...Object.fromEntries(
            parseRange(selectedRange.rangeString).map(ref => [ref, cells[ref] || { value: '', formula: '', display: '' }])
          )
        };
        const recalculatedCells = recalculateFormulas(newCells);
        setCells(recalculateFormulas(newCells));

        setSelectedCell(nextCell);
        setFormulaBar(formula); // Update formula bar with the formula
        setTimeout(() => {
          handleCellClick(nextCell);
          setCells(prevCells => ({
            ...prevCells,
            [nextCell]: {
              ...prevCells[nextCell],
              display: evaluateFormula(formula, nextCell, prevCells)
            }
          }));
        }, 0);
      } else {
        setFormulaBar(`=${funcName}()`);
        handleCellChange(cellRef, `=${funcName}()`);
      }
    } else {
      setFormulaBar(`=${funcName}()`);
      handleCellChange(cellRef, `=${funcName}()`);
    }
  };


  const expandRangeToCellList = (range) => {
    const cells = parseRange(range); // you already have this function
    return cells.join(', ');
  };


  const applyFunctionToSelection = (functionName) => {
    if (!selectedRange) return;

    const { start, end } = selectedRange;
    const startRow = Math.min(start.row, end.row);
    const endRow = Math.max(start.row, end.row);
    const startCol = Math.min(start.col, end.col);
    const endCol = Math.max(start.col, end.col);
    const nextRowKey = `${endRow + 1},${startCol}`;
    const range = `${getColumnLabel(startCol)}${startRow + 1}:${getColumnLabel(endCol)}${endRow + 1}`;

    const getSingleCellValue = () => {
      const key = `${startRow},${startCol}`;
      return Number(cells[key]?.value) || 0;
    };

    const getTwoCellValues = () => {
      const key1 = `${startRow},${startCol}`;
      const key2 = `${startRow},${startCol + 1}`;
      return [Number(cells[key1]?.value) || 0, Number(cells[key2]?.value) || 0];
    };


    const getMultipleCellValues = (count) => {
      const values = [];
      for (let i = 0; i < count; i++) {
        const key = `${startRow},${startCol + i}`;
        values.push(cells[key]?.value || '');
      }
      return values;
    };

    const getRangeValues = () => {
      const values = [];
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          values.push(Number(cells[key]?.value) || 0);
        }
      }
      return values;
    };


    const setResult = (value, formula = null) => {
      setCells(prev => ({
        ...prev,
        [nextRowKey]: {
          ...prev[nextRowKey],
          display: value.toString(),
          value,
          formula
        }
      }));
      setSelectedCell({ row: endRow + 1, col: startCol });
      calculateStats(endRow + 1, startCol);
    };

    if (functionName === 'SUM') {
      const formula = `=SUM(${range})`;
      let initialSum = 0;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          const cellValue = cells[key]?.value || 0;
          initialSum += Number(cellValue) || 0;
        }
      }
      setCells(prev => ({
        ...prev,
        [nextRowKey]: {
          ...prev[nextRowKey],
          display: initialSum.toString(),
          value: initialSum,
          formula: formula
        }
      }));
      setSelectedCell({ row: endRow + 1, col: startCol });
      calculateStats(endRow + 1, startCol);
    } else if (functionName === 'AVERAGE') {
      const formula = `=AVERAGE(${range})`;
      let sum = 0;
      let count = 0;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          const cellValue = cells[key]?.value || 0;
          const numValue = Number(cellValue);
          if (!isNaN(numValue)) {
            sum += numValue;
            count++;
          }
        }
      }
      const initialAverage = count > 0 ? sum / count : 0;
      setCells(prev => ({
        ...prev,
        [nextRowKey]: {
          ...prev[nextRowKey],
          display: initialAverage.toString(),
          value: initialAverage,
          formula: formula
        }
      }));
      setSelectedCell({ row: endRow + 1, col: startCol });
      recalculateFormulas(nextRowKey);
      calculateStats(endRow + 1, startCol);
    } else if (functionName === 'CONCATENATE') {
      let concatenated = '';
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          const cellDisplay = cells[key]?.display || '';
          concatenated += cellDisplay;
        }
      }
      setCells(prev => ({
        ...prev,
        [nextRowKey]: {
          ...prev[nextRowKey],
          display: concatenated,
          value: concatenated
        }
      }));
      setSelectedCell({ row: endRow + 1, col: startCol });
      calculateStats(endRow + 1, startCol);
    } else if (functionName === 'MAX') {
      const formula = `=MAX(${range})`;
      let max = -Infinity;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          const cellValue = cells[key]?.value || 0;
          const numValue = Number(cellValue);
          if (!isNaN(numValue) && numValue > max) {
            max = numValue;
          }
        }
      }
      setResult(max !== -Infinity ? max : 0, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'MIN') {
      const formula = `=MIN(${range})`;
      let min = Infinity;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          const cellValue = cells[key]?.value || 0;
          const numValue = Number(cellValue);
          if (!isNaN(numValue) && numValue < min) {
            min = numValue;
          }
        }
      }
      setResult(min !== Infinity ? min : 0, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'COUNT') {
      const formula = `=COUNT(${range})`;
      let count = 0;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          const cellValue = cells[key]?.value;
          if (cellValue !== undefined && cellValue !== '') {
            count++;
          }
        }
      }
      setResult(count, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ABS') {
      const formula = `=ABS(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.abs(getSingleCellValue());
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ACOS') {
      const formula = `=ACOS(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.acos(getSingleCellValue());
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ASIN') {
      const formula = `=ASIN(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.asin(getSingleCellValue());
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ATAN') {
      const formula = `=ATAN(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.atan(getSingleCellValue());
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ATAN2') {
      const formula = `=ATAN2(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [x, y] = getTwoCellValues();
      const value = Math.atan2(y, x);
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'CEILING') {
      const formula = `=CEILING(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.ceil(getSingleCellValue());
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'COS') {
      const formula = `=COS(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.cos(getSingleCellValue());
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'DEGREES') {
      const formula = `=DEGREES(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = getSingleCellValue() * (180 / Math.PI);
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'EXP') {
      const formula = `=EXP(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.exp(getSingleCellValue());
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'FACT') {
      const formula = `=FACT(${getColumnLabel(startCol)}${startRow + 1})`;
      const n = Math.floor(getSingleCellValue());
      let value = 1;
      for (let i = 1; i <= n; i++) {
        value *= i;
      }
      setResult(n >= 0 ? value : 0, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'FLOOR') {
      const formula = `=FLOOR(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.floor(getSingleCellValue());
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'GCD') {
      const formula = `=GCD(${range})`;
      const values = [];
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          const cellValue = Number(cells[key]?.value) || 0;
          if (!isNaN(cellValue) && Number.isInteger(cellValue) && cellValue > 0) {
            values.push(cellValue);
          }
        }
      }
      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
      const value = values.reduce((a, b) => gcd(a, b), values[0]) || 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'LCM') {
      const formula = `=LCM(${range})`;
      const values = [];
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          const cellValue = Number(cells[key]?.value) || 0;
          if (!isNaN(cellValue) && Number.isInteger(cellValue) && cellValue > 0) {
            values.push(cellValue);
          }
        }
      }
      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
      const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
      const value = values.reduce((a, b) => lcm(a, b), values[0]) || 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'LN') {
      const formula = `=LN(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.log(getSingleCellValue());
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'LOG') {
      const formula = `=LOG(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.log10(getSingleCellValue()) / Math.log10(10);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'LOG10') {
      const formula = `=LOG10(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.log10(getSingleCellValue());
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'MOD') {
      const formula = `=MOD(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [number, divisor] = getTwoCellValues();
      const value = divisor !== 0 ? number % divisor : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'PI') {
      const formula = `=PI()`;
      setResult(Math.PI, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'POWER') {
      const formula = `=POWER(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [base, exponent] = getTwoCellValues();
      const value = Math.pow(base, exponent);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'PRODUCT') {
      const formula = `=PRODUCT(${range})`;
      let product = 1;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          const cellValue = Number(cells[key]?.value) || 1;
          if (!isNaN(cellValue)) {
            product *= cellValue;
          }
        }
      }
      setResult(product, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'RADIANS') {
      const formula = `=RADIANS(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = getSingleCellValue() * (Math.PI / 180);
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'RAND') {
      const formula = `=RAND()`;
      const value = Math.random();
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'RANDBETWEEN') {
      const formula = `=RANDBETWEEN(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [min, max] = getTwoCellValues();
      const value = Math.floor(Math.random() * (max - min + 1)) + min;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ROUND') {
      const formula = `=ROUND(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.round(getSingleCellValue());
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ROUNDDOWN') {
      const formula = `=ROUNDDOWN(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.floor(getSingleCellValue());
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ROUNDUP') {
      const formula = `=ROUNDUP(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.ceil(getSingleCellValue());
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SIGN') {
      const formula = `=SIGN(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.sign(getSingleCellValue());
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SIN') {
      const formula = `=SIN(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.sin(getSingleCellValue());
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SQRT') {
      const formula = `=SQRT(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.sqrt(getSingleCellValue());
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SUMPRODUCT') {
      const formula = `=SUMPRODUCT(${range})`;
      let sum = 0;
      for (let r = startRow; r <= endRow; r++) {
        let product = 1;
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          const cellValue = Number(cells[key]?.value) || 1;
          if (!isNaN(cellValue)) {
            product *= cellValue;
          }
        }
        sum += product;
      }
      setResult(sum, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'TAN') {
      const formula = `=TAN(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.tan(getSingleCellValue());
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'TANRADIAN') {
      const formula = `=TANRADIAN(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.tan(getSingleCellValue());
      setResult(isNaN(value) ? 0 : value, formula);
      recalc
      ulateFormulas(nextRowKey);
    } else if (functionName === 'TRUNC') {
      const formula = `=TRUNC(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Math.trunc(getSingleCellValue());
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'FV') {
      const formula = `=FV(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1})`;
      const [rate, nper, pmt] = getMultipleCellValues(3);
      const value = pmt * ((Math.pow(1 + rate, nper) - 1) / rate);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'PV') {
      const formula = `=PV(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1})`;
      const [rate, nper, pmt] = getMultipleCellValues(3);
      const value = pmt * (1 - Math.pow(1 + rate, -nper)) / rate;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'NPV') {
      const formula = `=NPV(${getColumnLabel(startCol)}${startRow + 1},${range})`;
      const rate = getSingleCellValue();
      let value = 0;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          const cellValue = Number(cells[key]?.value) || 0;
          value += cellValue / Math.pow(1 + rate, r - startRow + 1);
        }
      }
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'PMT') {
      const formula = `=PMT(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1})`;
      const [rate, nper, pv] = getMultipleCellValues(3);
      const value = (pv * rate) / (1 - Math.pow(1 + rate, -nper));
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'IPMT') {
      const formula = `=IPMT(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1},${getColumnLabel(startCol + 3)}${startRow + 1})`;
      const [rate, per, nper, pv] = getMultipleCellValues(4);
      const pmt = (pv * rate) / (1 - Math.pow(1 + rate, -nper));
      const value = pmt - (pv * Math.pow(1 + rate, per - 1) * rate);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'PPMT') {
      const formula = `=PPMT(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1},${getColumnLabel(startCol + 3)}${startRow + 1})`;
      const [rate, per, nper, pv] = getMultipleCellValues(4);
      const pmt = (pv * rate) / (1 - Math.pow(1 + rate, -nper));
      const value = pmt - (pv * Math.pow(1 + rate, per - 1) * rate);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'NPER') {
      const formula = `=NPER(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1})`;
      const [rate, pmt, pv] = getMultipleCellValues(3);
      const value = Math.log(pmt / (pmt - pv * rate)) / Math.log(1 + rate);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'RATE') {
      const formula = `=RATE(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1})`;
      const [nper, pmt, pv] = getMultipleCellValues(3);
      let rate = 0.1; // Initial guess
      for (let i = 0; i < 20; i++) {
        const pvCalc = pmt * (1 - Math.pow(1 + rate, -nper)) / rate;
        const derivative = pmt * (-nper * Math.pow(1 + rate, -nper - 1));
        rate -= (pvCalc - pv) / derivative; // Newton-Raphson method
      }
      setResult(isNaN(rate) ? 0 : rate, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'IRR') {
      const formula = `=IRR(${range})`;
      const values = [];
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          const cellValue = Number(cells[key]?.value) || 0;
          values.push(cellValue);
        }
      }
      let rate = 0.1; // Initial guess
      for (let i = 0; i < 20; i++) {
        let npv = 0;
        let derivative = 0;
        values.forEach((value, index) => {
          npv += value / Math.pow(1 + rate, index + 1);
          derivative -= (index + 1) * value / Math.pow(1 + rate, index + 2);
        });
        rate -= npv / derivative; // Newton-Raphson method
      }
      setResult(isNaN(rate) ? 0 : rate, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'MIRR') {
      const formula = `=MIRR(${range},${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [financeRate, reinvestRate] = getMultipleCellValues(2);
      const values = [];
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          const cellValue = Number(cells[key]?.value) || 0;
          values.push(cellValue);
        }
      }
      let npvNegative = 0, npvPositive = 0;
      values.forEach((value, index) => {
        if (value < 0) {
          npvNegative += value / Math.pow(1 + financeRate, index + 1);
        } else {
          npvPositive += value / Math.pow(1 + reinvestRate, index + 1);
        }
      });
      const value = Math.pow(-npvPositive / npvNegative, 1 / values.length) - 1;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SLN') {
      const formula = `=SLN(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1})`;
      const [cost, salvage, life] = getMultipleCellValues(3);
      const value = (cost - salvage) / life;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SYD') {
      const formula = `=SYD(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1},${getColumnLabel(startCol + 3)}${startRow + 1})`;
      const [cost, salvage, life, period] = getMultipleCellValues(4);
      const value = ((cost - salvage) * (life - period + 1) * 2) / (life * (life + 1));
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'DB') {
      const formula = `=DB(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1},${getColumnLabel(startCol + 3)}${startRow + 1})`;
      const [cost, salvage, life, period] = getMultipleCellValues(4);
      const rate = 1 - Math.pow(salvage / cost, 1 / life);
      const value = cost * rate * Math.pow(1 - rate, period - 1);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'DDB') {
      const formula = `=DDB(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1},${getColumnLabel(startCol + 3)}${startRow + 1})`;
      const [cost, salvage, life, period] = getMultipleCellValues(4);
      let bookValue = cost;
      let value = 0;
      for (let i = 1; i <= period; i++) {
        value = Math.min((bookValue * 2) / life, bookValue - salvage);
        bookValue -= value;
      }
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'VDB') {
      const formula = `=VDB(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1},${getColumnLabel(startCol + 3)}${startRow + 1},${getColumnLabel(startCol + 4)}${startRow + 1})`;
      const [cost, salvage, life, startPeriod, endPeriod] = getMultipleCellValues(5);
      let value = 0;
      let bookValue = cost;
      for (let i = Math.ceil(startPeriod); i <= endPeriod; i++) {
        const dep = Math.min((bookValue * 2) / life, bookValue - salvage);
        bookValue -= dep;
        value += dep;
      }
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
      // Date Functions
    } else if (functionName === 'NOW') {
      const formula = `=NOW()`;
      const value = new Date().toLocaleString();
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'TODAY') {
      const formula = `=TODAY()`;
      const value = new Date().toLocaleDateString();
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'DATE') {
      const formula = `=DATE(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1})`;
      const [year, month, day] = getMultipleCellValues(3);
      const value = new Date(year, month - 1, day).toLocaleDateString();
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'DATEVALUE') {
      const formula = `=DATEVALUE(${getColumnLabel(startCol)}${startRow + 1})`;
      const key = `${startRow},${startCol}`;
      const dateString = cells[key]?.value || '';
      const value = new Date(dateString).getTime() / (1000 * 60 * 60 * 24);
      setResult(isNaN(value) ? 0 : Math.floor(value), formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'DAY') {
      const formula = `=DAY(${getColumnLabel(startCol)}${startRow + 1})`;
      const key = `${startRow},${startCol}`;
      const dateString = cells[key]?.value || '';
      const value = new Date(dateString).getDate();
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'DAYS') {
      const formula = `=DAYS(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [endDate, startDate] = getMultipleCellValues(2);
      const diff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
      setResult(isNaN(diff) ? 0 : Math.floor(diff), formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'DAYS360') {
      const formula = `=DAYS360(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [startDate, endDate] = getMultipleCellValues(2);
      const start = new Date(startDate);
      const end = new Date(endDate);
      const value = ((end.getFullYear() - start.getFullYear()) * 360) +
        ((end.getMonth() - start.getMonth()) * 30) +
        (end.getDate() - start.getDate());
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'EDATE') {
      const formula = `=EDATE(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [startDate, months] = getMultipleCellValues(2);
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + months);
      const value = date.toLocaleDateString();
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'EOMONTH') {
      const formula = `=EOMONTH(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [startDate, months] = getMultipleCellValues(2);
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + months + 1, 0);
      const value = date.toLocaleDateString();
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'HOUR') {
      const formula = `=HOUR(${getColumnLabel(startCol)}${startRow + 1})`;
      const key = `${startRow},${startCol}`;
      const dateString = cells[key]?.value || '';
      const value = new Date(dateString).getHours();
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'MINUTE') {
      const formula = `=MINUTE(${getColumnLabel(startCol)}${startRow + 1})`;
      const key = `${startRow},${startCol}`;
      const dateString = cells[key]?.value || '';
      const value = new Date(dateString).getMinutes();
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'MONTH') {
      const formula = `=MONTH(${getColumnLabel(startCol)}${startRow + 1})`;
      const key = `${startRow},${startCol}`;
      const dateString = cells[key]?.value || '';
      const value = new Date(dateString).getMonth() + 1;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'NETWORKDAYS') {
      const formula = `=NETWORKDAYS(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [startDate, endDate] = getMultipleCellValues(2);
      let start = new Date(startDate);
      let end = new Date(endDate);
      let count = 0;
      while (start <= end) {
        const day = start.getDay();
        if (day !== 0 && day !== 6) count++;
        start.setDate(start.getDate() + 1);
      }
      setResult(isNaN(count) ? 0 : count, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SECOND') {
      const formula = `=SECOND(${getColumnLabel(startCol)}${startRow + 1})`;
      const key = `${startRow},${startCol}`;
      const dateString = cells[key]?.value || '';
      const value = new Date(dateString).getSeconds();
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'TIME') {
      const formula = `=TIME(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1})`;
      const [hour, minute, second] = getMultipleCellValues(3);
      const value = new Date(0, 0, 0, hour, minute, second).toLocaleTimeString();
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'TIMEVALUE') {
      const formula = `=TIMEVALUE(${getColumnLabel(startCol)}${startRow + 1})`;
      const key = `${startRow},${startCol}`;
      const timeString = cells[key]?.value || '';
      const date = new Date(`1970-01-01 ${timeString}`);
      const value = (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) / 86400;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'WEEKDAY') {
      const formula = `=WEEKDAY(${getColumnLabel(startCol)}${startRow + 1})`;
      const key = `${startRow},${startCol}`;
      const dateString = cells[key]?.value || '';
      const value = new Date(dateString).getDay() + 1;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'WEEKNUM') {
      const formula = `=WEEKNUM(${getColumnLabel(startCol)}${startRow + 1})`;
      const key = `${startRow},${startCol}`;
      const dateString = cells[key]?.value || '';
      const date = new Date(dateString);
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const value = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'WORKDAY') {
      const formula = `=WORKDAY(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [startDate, days] = getMultipleCellValues(2);
      let date = new Date(startDate);
      let count = 0;
      while (count < days) {
        date.setDate(date.getDate() + 1);
        if (date.getDay() !== 0 && date.getDay() !== 6) count++;
      }
      const value = date.toLocaleDateString();
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'YEAR') {
      const formula = `=YEAR(${getColumnLabel(startCol)}${startRow + 1})`;
      const key = `${startRow},${startCol}`;
      const dateString = cells[key]?.value || '';
      const value = new Date(dateString).getFullYear();
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'YEARFRAC') {
      const formula = `=YEARFRAC(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [startDate, endDate] = getMultipleCellValues(2);
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
      setResult(isNaN(diff) ? 0 : diff, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'CHAR') {
      const formula = `=CHAR(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = String.fromCharCode(Number(getSingleCellValue()) || 0);
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'CLEAN') {
      const formula = `=CLEAN(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = getSingleCellValue().replace(/[\x00-\x1F\x7F]/g, '');
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'CODE') {
      const formula = `=CODE(${getColumnLabel(startCol)}${startRow + 1})`;
      const str = getSingleCellValue();
      const value = str ? str.charCodeAt(0) : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'CONCATENATE') {
      const formula = `=CONCATENATE(${range})`;
      let value = '';
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          value += cells[key]?.value || '';
        }
      }
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'EXACT') {
      const formula = `=EXACT(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [text1, text2] = getMultipleCellValues(2);
      const value = text1 === text2 ? 1 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'FIND') {
      const formula = `=FIND(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [findText, withinText] = getMultipleCellValues(2);
      const value = withinText.indexOf(findText) + 1 || 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'LEFT') {
      const formula = `=LEFT(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [text, numChars] = getMultipleCellValues(2);
      const value = text.slice(0, Number(numChars) || 0);
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'LEN') {
      const formula = `=LEN(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = getSingleCellValue().length;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'LOWER') {
      const formula = `=LOWER(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = getSingleCellValue().toLowerCase();
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'MID') {
      const formula = `=MID(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1})`;
      const [text, startNum, numChars] = getMultipleCellValues(3);
      const value = text.slice(Number(startNum) - 1, Number(startNum) - 1 + Number(numChars));
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'PROPER') {
      const formula = `=PROPER(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = getSingleCellValue().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'REPLACE') {
      const formula = `=REPLACE(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1},${getColumnLabel(startCol + 3)}${startRow + 1})`;
      const [oldText, startNum, numChars, newText] = getMultipleCellValues(4);
      const value = oldText.slice(0, Number(startNum) - 1) + newText + oldText.slice(Number(startNum) - 1 + Number(numChars));
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'REPT') {
      const formula = `=REPT(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [text, numberTimes] = getMultipleCellValues(2);
      const value = text.repeat(Number(numberTimes) || 0);
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'RIGHT') {
      const formula = `=RIGHT(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [text, numChars] = getMultipleCellValues(2);
      const value = text.slice(-Number(numChars) || 0);
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SEARCH') {
      const formula = `=SEARCH(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [findText, withinText] = getMultipleCellValues(2);
      const value = withinText.toLowerCase().indexOf(findText.toLowerCase()) + 1 || 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SUBSTITUTE') {
      const formula = `=SUBSTITUTE(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1})`;
      const [text, oldText, newText] = getMultipleCellValues(3);
      const value = text.replace(new RegExp(oldText, 'g'), newText);
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'T') {
      const formula = `=T(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = typeof getSingleCellValue() === 'string' ? getSingleCellValue() : '';
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'TEXT') {
      const formula = `=TEXT(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [value, format] = getMultipleCellValues(2);
      // Simplified formatting (e.g., "0.00" for two decimals, "yyyy-mm-dd" for dates)
      let formattedValue;
      if (format.includes('0')) {
        formattedValue = Number(value).toFixed(format.match(/0/g)?.length || 0);
      } else if (format.includes('yyyy')) {
        formattedValue = new Date(value).toLocaleDateString();
      } else {
        formattedValue = value.toString();
      }
      setResult(formattedValue, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'TEXTNOW') {
      const formula = `=TEXTNOW(${getColumnLabel(startCol)}${startRow + 1})`;
      const format = getSingleCellValue();
      const value = new Date().toLocaleString(); // Simplified, apply format if provided
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'TRIM') {
      const formula = `=TRIM(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = getSingleCellValue().trim();
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'UPPER') {
      const formula = `=UPPER(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = getSingleCellValue().toUpperCase();
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'VALUE') {
      const formula = `=VALUE(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Number(getSingleCellValue()) || 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
      // Combinatorial Functions
    } else if (functionName === 'COMBIN') {
      const formula = `=COMBIN(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [n, k] = getMultipleCellValues(2).map(Number);
      const factorial = (x) => {
        let result = 1;
        for (let i = 1; i <= x; i++) result *= i;
        return result;
      };
      const value = factorial(n) / (factorial(k) * factorial(n - k));
      setResult(isNaN(value) ? 0 : Math.round(value), formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'PERMUT') {
      const formula = `=PERMUT(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [n, k] = getMultipleCellValues(2).map(Number);
      const factorial = (x) => {
        let result = 1;
        for (let i = 1; i <= x; i++) result *= i;
        return result;
      };
      const value = factorial(n) / factorial(n - k);
      setResult(isNaN(value) ? 0 : Math.round(value), formula);
      recalculateFormulas(nextRowKey);
      // Distribution Functions
    } else if (functionName === 'NORMDIST') {
      const formula = `=NORMDIST(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1})`;
      const [x, mean, stdev] = getMultipleCellValues(3).map(Number);
      const z = (x - mean) / stdev;
      const value = (1 / (stdev * Math.sqrt(2 * Math.PI))) * Math.exp(-(z ** 2) / 2);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'NORMSDIST') {
      const formula = `=NORMSDIST(${getColumnLabel(startCol)}${startRow + 1})`;
      const z = Number(getSingleCellValue());
      const value = 0.5 * (1 + erf(z / Math.sqrt(2)));
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'NORMINV') {
      const formula = `=NORMINV(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1})`;
      const [p, mean, stdev] = getMultipleCellValues(3).map(Number);
      const value = mean + stdev * normInv(p);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'NORMSINV') {
      const formula = `=NORMSINV(${getColumnLabel(startCol)}${startRow + 1})`;
      const p = Number(getSingleCellValue());
      const value = normInv(p);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'POISSON') {
      const formula = `=POISSON(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [x, mean] = getMultipleCellValues(2).map(Number);
      const factorial = (x) => {
        let result = 1;
        for (let i = 1; i <= x; i++) result *= i;
        return result;
      };
      const value = (Math.exp(-mean) * Math.pow(mean, x)) / factorial(x);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'WEIBULL') {
      const formula = `=WEIBULL(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1})`;
      const [x, alpha, beta] = getMultipleCellValues(3).map(Number);
      const value = (alpha / beta) * Math.pow(x / beta, alpha - 1) * Math.exp(-Math.pow(x / beta, alpha));
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'AND') {
      const formula = `=AND(${range})`;
      const values = getRangeValues();
      const value = values.every(val => Boolean(val)) ? 1 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'FALSE') {
      const formula = `=FALSE()`;
      setResult(0, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'IF') {
      const formula = `=IF(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1},${getColumnLabel(startCol + 2)}${startRow + 1})`;
      const [condition, valueIfTrue, valueIfFalse] = getMultipleCellValues(3);
      const value = Boolean(Number(condition)) ? valueIfTrue : valueIfFalse;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'IFERROR') {
      const formula = `=IFERROR(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [value, valueIfError] = getMultipleCellValues(2);
      const parsedValue = Number(value);
      const result = isNaN(parsedValue) ? valueIfError : parsedValue;
      setResult(result, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'IFS') {
      const formula = `=IFS(${range})`;
      const values = getMultipleCellValues(endCol - startCol + 1);
      let value = '';
      for (let i = 0; i < values.length - 1; i += 2) {
        if (Boolean(Number(values[i]))) {
          value = values[i + 1];
          break;
        }
      }
      setResult(value || 0, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'NOT') {
      const formula = `=NOT(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Boolean(Number(getSingleCellValue())) ? 0 : 1;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'OR') {
      const formula = `=OR(${range})`;
      const values = getRangeValues();
      const value = values.some(val => Boolean(val)) ? 1 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SWITCH') {
      const formula = `=SWITCH(${getColumnLabel(startCol)}${startRow + 1},${range})`;
      const [expression, ...pairs] = getMultipleCellValues(endCol - startCol + 1);
      let value = '';
      for (let i = 0; i < pairs.length - 1; i += 2) {
        if (expression === pairs[i]) {
          value = pairs[i + 1];
          break;
        }
      }
      setResult(value || (pairs.length % 2 ? pairs[pairs.length - 1] : 0), formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'TRUE') {
      const formula = `=TRUE()`;
      setResult(1, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'XOR') {
      const formula = `=XOR(${range})`;
      const values = getRangeValues();
      const value = values.reduce((acc, val) => acc ^ Boolean(val), 0);
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
      // Statistical Functions
    } else if (functionName === 'AVERAGE') {
      const formula = `=AVERAGE(${range})`;
      const values = getRangeValues();
      const value = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'COUNT') {
      const formula = `=COUNT(${range})`;
      const values = getRangeValues();
      const value = values.filter(val => !isNaN(val) && val !== '').length;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'COUNTA') {
      const formula = `=COUNTA(${range})`;
      const values = [];
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          if (cells[key]?.value !== undefined && cells[key]?.value !== '') values.push(cells[key].value);
        }
      }
      setResult(values.length, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'COUNTBLANK') {
      const formula = `=COUNTBLANK(${range})`;
      let count = 0;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          if (!cells[key]?.value) count++;
        }
      }
      setResult(count, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'COUNTIF') {
      const formula = `=COUNTIF(${range},${getColumnLabel(startCol)}${startRow + 1})`;
      const criterion = getSingleCellValue();
      let count = 0;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          if (cells[key]?.value === criterion) count++;
        }
      }
      setResult(count, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'MEDIAN') {
      const formula = `=MEDIAN(${range})`;
      const values = getRangeValues().sort((a, b) => a - b);
      const mid = Math.floor(values.length / 2);
      const value = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'MODE') {
      const formula = `=MODE(${range})`;
      const values = getRangeValues();
      const counts = {};
      values.forEach(val => counts[val] = (counts[val] || 0) + 1);
      const value = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 0);
      setResult(isNaN(value) ? 0 : Number(value), formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'STDEV') {
      const formula = `=STDEV(${range})`;
      const values = getRangeValues();
      const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      const variance = values.length > 1 ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1) : 0;
      const value = Math.sqrt(variance);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'STDEVP') {
      const formula = `=STDEVP(${range})`;
      const values = getRangeValues();
      const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      const variance = values.length ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length : 0;
      const value = Math.sqrt(variance);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'VAR') {
      const formula = `=VAR(${range})`;
      const values = getRangeValues();
      const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      const value = values.length > 1 ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1) : 0;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'VARP') {
      const formula = `=VARP(${range})`;
      const values = getRangeValues();
      const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      const value = values.length ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length : 0;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'STDEVA') {
      const formula = `=STDEVA(${range})`;
      const values = [];
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          values.push(cells[key]?.value ? Number(cells[key].value) : 0);
        }
      }
      const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      const variance = values.length > 1 ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1) : 0;
      const value = Math.sqrt(variance);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'STDEVPA') {
      const formula = `=STDEVPA(${range})`;
      const values = [];
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          values.push(cells[key]?.value ? Number(cells[key].value) : 0);
        }
      }
      const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      const variance = values.length ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length : 0;
      const value = Math.sqrt(variance);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'VARA') {
      const formula = `=VARA(${range})`;
      const values = [];
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          values.push(cells[key]?.value ? Number(cells[key].value) : 0);
        }
      }
      const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      const value = values.length > 1 ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1) : 0;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'VARPA') {
      const formula = `=VARPA(${range})`;
      const values = [];
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r},${c}`;
          values.push(cells[key]?.value ? Number(cells[key].value) : 0);
        }
      }
      const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      const value = values.length ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length : 0;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'CORREL') {
      const formula = `=CORREL(${range})`;
      const values = getRangeValues();
      const mid = values.length / 2;
      const x = values.slice(0, mid);
      const y = values.slice(mid);
      const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
      const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
      const cov = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0) / x.length;
      const stdevX = Math.sqrt(x.reduce((sum, val) => sum + (val - meanX) ** 2, 0) / x.length);
      const stdevY = Math.sqrt(y.reduce((sum, val) => sum + (val - meanY) ** 2, 0) / y.length);
      const value = cov / (stdevX * stdevY);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'COVAR') {
      const formula = `=COVAR(${range})`;
      const values = getRangeValues();
      const mid = values.length / 2;
      const x = values.slice(0, mid);
      const y = values.slice(mid);
      const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
      const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
      const value = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0) / x.length;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'GEOMEAN') {
      const formula = `=GEOMEAN(${range})`;
      const values = getRangeValues().filter(val => val > 0);
      const value = Math.exp(values.reduce((sum, val) => sum + Math.log(val), 0) / values.length);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'HARMEAN') {
      const formula = `=HARMEAN(${range})`;
      const values = getRangeValues().filter(val => val > 0);
      const value = values.length / values.reduce((sum, val) => sum + 1 / val, 0);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'KURT') {
      const formula = `=KURT(${range})`;
      const values = getRangeValues();
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdev = Math.sqrt(values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1));
      const n = values.length;
      const value = (values.reduce((sum, val) => sum + ((val - mean) / stdev) ** 4, 0) * n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3)));
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SKEW') {
      const formula = `=SKEW(${range})`;
      const values = getRangeValues();
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdev = Math.sqrt(values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1));
      const value = values.reduce((sum, val) => sum + ((val - mean) / stdev) ** 3, 0) * values.length / ((values.length - 1) * (values.length - 2));
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SLOPE') {
      const formula = `=SLOPE(${range})`;
      const values = getRangeValues();
      const mid = values.length / 2;
      const y = values.slice(0, mid);
      const x = values.slice(mid);
      const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
      const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
      const num = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
      const denom = x.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
      const value = num / denom;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'INTERCEPT') {
      const formula = `=INTERCEPT(${range})`;
      const values = getRangeValues();
      const mid = values.length / 2;
      const y = values.slice(0, mid);
      const x = values.slice(mid);
      const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
      const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
      const num = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
      const denom = x.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
      const slope = num / denom;
      const value = meanY - slope * meanX;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'RSQ') {
      const formula = `=RSQ(${range})`;
      const values = getRangeValues();
      const mid = values.length / 2;
      const y = values.slice(0, mid);
      const x = values.slice(mid);
      const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
      const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
      const num = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
      const denomX = x.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
      const denomY = y.reduce((sum, val) => sum + (val - meanY) ** 2, 0);
      const value = (num ** 2) / (denomX * denomY);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'FORECAST') {
      const formula = `=FORECAST(${getColumnLabel(startCol)}${startRow + 1},${range})`;
      const x = Number(getSingleCellValue());
      const values = getRangeValues();
      const mid = values.length / 2;
      const y = values.slice(0, mid);
      const knownX = values.slice(mid);
      const meanX = knownX.reduce((sum, val) => sum + val, 0) / knownX.length;
      const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
      const num = knownX.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
      const denom = knownX.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
      const slope = num / denom;
      const intercept = meanY - slope * meanX;
      const value = slope * x + intercept;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'TREND') {
      const formula = `=TREND(${range})`;
      const values = getRangeValues();
      const mid = values.length / 2;
      const y = values.slice(0, mid);
      const x = values.slice(mid);
      const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
      const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
      const num = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
      const denom = x.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
      const slope = num / denom;
      const intercept = meanY - slope * meanX;
      const value = x.map(val => slope * val + intercept).join(',');
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'PERCENTILE') {
      const formula = `=PERCENTILE(${range},${getColumnLabel(startCol)}${startRow + 1})`;
      const k = Number(getSingleCellValue());
      const values = getRangeValues().sort((a, b) => a - b);
      const n = values.length;
      const index = k * (n - 1);
      const lower = Math.floor(index);
      const fraction = index - lower;
      const value = lower < n - 1 ? values[lower] + fraction * (values[lower + 1] - values[lower]) : values[n - 1];
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'PERCENTRANK') {
      const formula = `=PERCENTRANK(${range},${getColumnLabel(startCol)}${startRow + 1})`;
      const x = Number(getSingleCellValue());
      const values = getRangeValues().sort((a, b) => a - b);
      const rank = values.findIndex(val => val >= x);
      const value = rank / (values.length - 1);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'QUARTILE') {
      const formula = `=QUARTILE(${range},${getColumnLabel(startCol)}${startRow + 1})`;
      const quart = Number(getSingleCellValue());
      const values = getRangeValues().sort((a, b) => a - b);
      const n = values.length;
      const k = quart * (n - 1) / 4;
      const lower = Math.floor(k);
      const fraction = k - lower;
      const value = lower < n - 1 ? values[lower] + fraction * (values[lower + 1] - values[lower]) : values[n - 1];
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'RANK') {
      const formula = `=RANK(${getColumnLabel(startCol)}${startRow + 1},${range})`;
      const x = Number(getSingleCellValue());
      const values = getRangeValues().sort((a, b) => b - a);
      const value = values.indexOf(x) + 1;
      setResult(value || 0, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'LARGE') {
      const formula = `=LARGE(${range},${getColumnLabel(startCol)}${startRow + 1})`;
      const k = Number(getSingleCellValue());
      const values = getRangeValues().sort((a, b) => b - a);
      const value = values[k - 1] || 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SMALL') {
      const formula = `=SMALL(${range},${getColumnLabel(startCol)}${startRow + 1})`;
      const k = Number(getSingleCellValue());
      const values = getRangeValues().sort((a, b) => a - b);
      const value = values[k - 1] || 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'DEVSQ') {
      const formula = `=DEVSQ(${range})`;
      const values = getRangeValues();
      const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      const value = values.reduce((sum, val) => sum + (val - mean) ** 2, 0);
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'TRIMMEAN') {
      const formula = `=TRIMMEAN(${range},${getColumnLabel(startCol)}${startRow + 1})`;
      const percent = Number(getSingleCellValue());
      const values = getRangeValues().sort((a, b) => a - b);
      const n = values.length;
      const trim = Math.floor(n * percent / 2);
      const trimmedValues = values.slice(trim, n - trim);
      const value = trimmedValues.length ? trimmedValues.reduce((sum, val) => sum + val, 0) / trimmedValues.length : 0;
      setResult(isNaN(value) ? 0 : value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ARRAYFORMULA') {
      const formula = `=ARRAYFORMULA(${range})`;
      const values = getRangeValues();
      let row = endRow + 1;
      values.forEach((value, index) => {
        setResult(value, formula, row + Math.floor(index / (endCol - startCol + 1)), startCol + (index % (endCol - startCol + 1)));
      });
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'FILTER') {
      const formula = `=FILTER(${range},${getColumnLabel(startCol)}${startRow + 1})`;
      const condition = Number(getSingleCellValue());
      const values = getRangeValues().filter((_, i) => Number(getRangeValues()[i]) >= condition);
      let row = endRow + 1;
      values.forEach((value, index) => {
        setResult(value, formula, row + index, startCol);
      });
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'FLATTEN') {
      const formula = `=FLATTEN(${range})`;
      const values = getRangeValues();
      let row = endRow + 1;
      values.forEach((value, index) => {
        setResult(value, formula, row + index, startCol);
      });
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SORT') {
      const formula = `=SORT(${range})`;
      const values = getRangeValues().sort((a, b) => Number(a) - Number(b));
      let row = endRow + 1;
      values.forEach((value, index) => {
        setResult(value, formula, row + index, startCol);
      });
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SORTN') {
      const formula = `=SORTN(${range},${getColumnLabel(startCol)}${startRow + 1})`;
      const n = Number(getSingleCellValue());
      const values = getRangeValues().sort((a, b) => Number(a) - Number(b)).slice(0, n);
      let row = endRow + 1;
      values.forEach((value, index) => {
        setResult(value, formula, row + index, startCol);
      });
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'UNIQUE') {
      const formula = `=UNIQUE(${range})`;
      const values = [...new Set(getRangeValues())];
      let row = endRow + 1;
      values.forEach((value, index) => {
        setResult(value, formula, row + index, startCol);
      });
      recalculateFormulas(nextRowKey);
      // Lookup Functions
    } else if (functionName === 'CHOOSE') {
      const formula = `=CHOOSE(${getColumnLabel(startCol)}${startRow + 1},${range})`;
      const index = Number(getSingleCellValue());
      const values = getRangeValues();
      const value = index > 0 && index <= values.length ? values[index - 1] : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'HLOOKUP') {
      const formula = `=HLOOKUP(${getColumnLabel(startCol)}${startRow + 1},${range},2)`;
      const lookupValue = getSingleCellValue();
      const values = getRangeValues();
      const rowLength = endCol - startCol + 1;
      const firstRow = values.slice(0, rowLength);
      const secondRow = values.slice(rowLength, rowLength * 2);
      const index = firstRow.indexOf(lookupValue);
      const value = index >= 0 ? secondRow[index] : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'INDEX') {
      const formula = `=INDEX(${range},${getColumnLabel(startCol)}${startRow + 1})`;
      const rowNum = Number(getSingleCellValue());
      const values = getRangeValues();
      const rowLength = endCol - startCol + 1;
      const value = rowNum > 0 && rowNum <= Math.ceil(values.length / rowLength) ? values[(rowNum - 1) * rowLength] : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'MATCH') {
      const formula = `=MATCH(${getColumnLabel(startCol)}${startRow + 1},${range})`;
      const lookupValue = getSingleCellValue();
      const values = getRangeValues();
      const value = values.indexOf(lookupValue) + 1 || 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'VLOOKUP') {
      const formula = `=VLOOKUP(${getColumnLabel(startCol)}${startRow + 1},${range},2)`;
      const lookupValue = getSingleCellValue();
      const values = getRangeValues();
      const colLength = endRow - startRow + 1;
      const firstCol = values.filter((_, i) => i % colLength === 0);
      const secondCol = values.filter((_, i) => i % colLength === 1);
      const index = firstCol.indexOf(lookupValue);
      const value = index >= 0 ? secondCol[index] : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
      // Information Functions
    } else if (functionName === 'CELL') {
      const formula = `=CELL(${getColumnLabel(startCol)}${startRow + 1},${getColumnLabel(startCol + 1)}${startRow + 1})`;
      const [infoType, cellRef] = getMultipleCellValues(2);
      const [colLabel, rowStr] = cellRef.match(/([A-Z]+)([0-9]+)/)?.slice(1) || ['', '1'];
      const value = infoType === 'address' ? cellRef : infoType === 'row' ? rowStr : infoType === 'col' ? colLabel : '';
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ERROR_TYPE') {
      const formula = `=ERROR_TYPE(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = isNaN(Number(getSingleCellValue())) ? 1 : 0; // Simplified: 1 for error, 0 for no error
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'INFO') {
      const formula = `=INFO(${getColumnLabel(startCol)}${startRow + 1})`;
      const infoType = getSingleCellValue();
      const value = infoType === 'osversion' ? 'Browser' : infoType === 'system' ? 'Web' : '';
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ISBLANK') {
      const formula = `=ISBLANK(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = getSingleCellValue() === '' ? 1 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ISERR') {
      const formula = `=ISERR(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = isNaN(Number(getSingleCellValue())) && getSingleCellValue() !== '#N/A' ? 1 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ISERROR') {
      const formula = `=ISERROR(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = isNaN(Number(getSingleCellValue())) ? 1 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ISEVEN') {
      const formula = `=ISEVEN(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Number(getSingleCellValue()) % 2 === 0 ? 1 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ISFORMULA') {
      const formula = `=ISFORMULA(${getColumnLabel(startCol)}${startRow + 1})`;
      const key = `${startRow},${startCol}`;
      const value = cells[key]?.formula ? 1 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ISLOGICAL') {
      const formula = `=ISLOGICAL(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = getSingleCellValue() === '1' || getSingleCellValue() === '0' ? 1 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ISNA') {
      const formula = `=ISNA(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = getSingleCellValue() === '#N/A' ? 1 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ISNONTEXT') {
      const formula = `=ISNONTEXT(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = isNaN(Number(getSingleCellValue())) ? 0 : 1;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ISNUMBER') {
      const formula = `=ISNUMBER(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = !isNaN(Number(getSingleCellValue())) ? 1 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ISODD') {
      const formula = `=ISODD(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = Number(getSingleCellValue()) % 2 !== 0 ? 1 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ISREF') {
      const formula = `=ISREF(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = /^[A-Z]+[0-9]+$/.test(getSingleCellValue()) ? 1 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'ISTEXT') {
      const formula = `=ISTEXT(${getColumnLabel(startCol)}${startRow + 1})`;
      const value = isNaN(Number(getSingleCellValue())) && getSingleCellValue() !== '' ? 1 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'N') {
      const formula = `=N(${getColumnLabel(startCol)}${startRow + 1})`;
      const val = getSingleCellValue();
      const value = val === '1' ? 1 : val === '0' ? 0 : Number(val) || 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'NA') {
      const formula = `=NA()`;
      setResult('#N/A', formula);
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SHEET') {
      const formula = `=SHEET()`;
      setResult(1, formula); // Assuming single sheet
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'SHEETS') {
      const formula = `=SHEETS()`;
      setResult(1, formula); // Assuming single sheet
      recalculateFormulas(nextRowKey);
    } else if (functionName === 'TYPE') {
      const formula = `=TYPE(${getColumnLabel(startCol)}${startRow + 1})`;
      const val = getSingleCellValue();
      const value = !isNaN(Number(val)) ? 1 : val === '1' || val === '0' ? 4 : isNaN(Number(val)) ? 2 : 0;
      setResult(value, formula);
      recalculateFormulas(nextRowKey);
    }
  };

  const recalculateFormulas = (cellKey) => {
    const cell = cells[cellKey];
    if (!cell?.formula) return;

    const formula = cell.formula;
    const getSingleCellValueFromRef = (cellRef) => {
      const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
      const col = colLabel.charCodeAt(0) - 65;
      const row = parseInt(rowStr) - 1;
      const key = `${row},${col}`;
      return Number(cells[key]?.value) || 0;
    };

    const getTwoCellValuesFromRefs = (range) => {
      const [startRef] = range.split(',');
      const [colLabel1, rowStr1] = startRef.split(/(?=[0-9])/);
      const col1 = colLabel1.charCodeAt(0) - 65;
      const row1 = parseInt(rowStr1) - 1;
      const key1 = `${row1},${col1}`;
      const key2 = `${row1},${col1 + 1}`;
      return [Number(cells[key1]?.value) || 0, Number(cells[key2]?.value) || 0];
    };

    const getMultipleCellValuesFromRefs = (range, count) => {
      const refs = range.split(',');
      const values = [];
      for (let i = 0; i < count; i++) {
        const [colLabel, rowStr] = refs[i].split(/(?=[0-9])/);
        const col = colLabel.charCodeAt(0) - 65;
        const row = parseInt(rowStr) - 1;
        const key = `${row},${col}`;
        values.push(cells[key]?.value || '');
      }
      return values;
    };

    // Helper for NORMSDIST and NORMINV
    const erf = (x) => {
      const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
      const p = 0.3275911;
      const sign = x >= 0 ? 1 : -1;
      x = Math.abs(x);
      const t = 1 / (1 + p * x);
      return sign * (1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)));
    };

    const normInv = (p) => {
      const q = p - 0.5;
      if (Math.abs(q) <= 0.425) {
        const r = 0.180625 - q * q;
        return q * (((((((2.509080928730122e3 * r + 3.343057558358812e3) * r + 6.726577092700870e2) * r +
          4.592195393154987e1) * r + 1.373169376550946e0) * r + 1.971590950306551e-1) * r +
          7.745450142783414e-3) * r + 8.43293700933293e-5) / (((((((2.667227230476128e3 * r +
            3.007810562564870e3) * r + 5.223977606118473e2) * r + 2.686617064614766e1) * r +
            6.766825994344563e-1) * r + 7.374737514219171e-2) * r + 2.262900006138909e-3) * r + 1);
      }
      return 0; // Simplified, handle edge cases in production
    };


    const getRangeValuesFromRefs = (range) => {
      const cellsInRange = parseRange(range);
      const values = [];
      cellsInRange.forEach(cellRef => {
        const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
        const col = colLabel.charCodeAt(0) - 65;
        const row = parseInt(rowStr) - 1;
        const key = `${row},${col}`;
        values.push(Number(cells[key]?.value) || 0);
      });
      return values;
    };

    if (formula.startsWith('=SUM(')) {
      const rangeMatch = formula.match(/=SUM\(([^)]+)\)/);
      if (rangeMatch) {
        const range = rangeMatch[1];
        const cellsInRange = parseRange(range);
        let sum = 0;
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          const cellValue = cells[key]?.value || 0;
          sum += Number(cellValue) || 0;
        });
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: sum.toString(),
            value: sum
          }
        }));
      }
    } else if (formula.startsWith('=AVERAGE(')) {
      const rangeMatch = formula.match(/=AVERAGE\(([^)]+)\)/);
      if (rangeMatch) {
        const range = rangeMatch[1];
        const cellsInRange = parseRange(range);
        let sum = 0;
        let count = 0;
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          const cellValue = cells[key]?.value || 0;
          const numValue = Number(cellValue);
          if (!isNaN(numValue)) {
            sum += numValue;
            count++;
          }
        });
        const average = count > 0 ? sum / count : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: average.toString(),
            value: average
          }
        }));
      }
    } else if (formula.startsWith('=MAX(')) {
      const rangeMatch = formula.match(/=MAX\(([^)]+)\)/);
      if (rangeMatch) {
        const range = rangeMatch[1];
        const cellsInRange = parseRange(range);
        let max = -Infinity;
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          const cellValue = cells[key]?.value || 0;
          const numValue = Number(cellValue);
          if (!isNaN(numValue) && numValue > max) {
            max = numValue;
          }
        });
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (max !== -Infinity ? max : 0).toString(),
            value: max !== -Infinity ? max : 0
          }
        }));
      }
    } else if (formula.startsWith('=MIN(')) {
      const rangeMatch = formula.match(/=MIN\(([^)]+)\)/);
      if (rangeMatch) {
        const range = rangeMatch[1];
        const cellsInRange = parseRange(range);
        let min = Infinity;
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          const cellValue = cells[key]?.value || 0;
          const numValue = Number(cellValue);
          if (!isNaN(numValue) && numValue < min) {
            min = numValue;
          }
        });
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (min !== Infinity ? min : 0).toString(),
            value: min !== Infinity ? min : 0
          }
        }));
      }
    } else if (formula.startsWith('=COUNT(')) {
      const rangeMatch = formula.match(/=COUNT\(([^)]+)\)/);
      if (rangeMatch) {
        const range = rangeMatch[1];
        const cellsInRange = parseRange(range);
        let count = 0;
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          const cellValue = cells[key]?.value;
          if (cellValue !== undefined && cellValue !== '') {
            count++;
          }
        });
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: count.toString(),
            value: count
          }
        }));
      }
    } else if (formula.startsWith('=ABS(')) {
      const cellRefMatch = formula.match(/=ABS\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.abs(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ACOS(')) {
      const cellRefMatch = formula.match(/=ACOS\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.acos(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=ASIN(')) {
      const cellRefMatch = formula.match(/=ASIN\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.asin(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=ATAN(')) {
      const cellRefMatch = formula.match(/=ATAN\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.atan(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ATAN2(')) {
      const rangeMatch = formula.match(/=ATAN2\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [x, y] = getTwoCellValuesFromRefs(rangeMatch[1] + ',' + rangeMatch[2]);
        const value = Math.atan2(y, x);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=CEILING(')) {
      const cellRefMatch = formula.match(/=CEILING\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.ceil(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=COS(')) {
      const cellRefMatch = formula.match(/=COS\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.cos(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=DEGREES(')) {
      const cellRefMatch = formula.match(/=DEGREES\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = getSingleCellValueFromRef(cellRefMatch[1]) * (180 / Math.PI);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=EXP(')) {
      const cellRefMatch = formula.match(/=EXP\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.exp(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=FACT(')) {
      const cellRefMatch = formula.match(/=FACT\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const n = Math.floor(getSingleCellValueFromRef(cellRefMatch[1]));
        let value = 1;
        for (let i = 1; i <= n; i++) {
          value *= i;
        }
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (n >= 0 ? value : 0).toString(),
            value: n >= 0 ? value : 0
          }
        }));
      }
    } else if (formula.startsWith('=FLOOR(')) {
      const cellRefMatch = formula.match(/=FLOOR\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.floor(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=GCD(')) {
      const rangeMatch = formula.match(/=GCD\(([^)]+)\)/);
      if (rangeMatch) {
        const range = rangeMatch[1];
        const cellsInRange = parseRange(range);
        const values = [];
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          const cellValue = Number(cells[key]?.value) || 0;
          if (!isNaN(cellValue) && Number.isInteger(cellValue) && cellValue > 0) {
            values.push(cellValue);
          }
        });
        const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
        const value = values.reduce((a, b) => gcd(a, b), values[0]) || 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=LCM(')) {
      const rangeMatch = formula.match(/=LCM\(([^)]+)\)/);
      if (rangeMatch) {
        const range = rangeMatch[1];
        const cellsInRange = parseRange(range);
        const values = [];
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          const cellValue = Number(cells[key]?.value) || 0;
          if (!isNaN(cellValue) && Number.isInteger(cellValue) && cellValue > 0) {
            values.push(cellValue);
          }
        });
        const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
        const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
        const value = values.reduce((a, b) => lcm(a, b), values[0]) || 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=LN(')) {
      const cellRefMatch = formula.match(/=LN\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.log(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=LOG(')) {
      const cellRefMatch = formula.match(/=LOG\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.log10(getSingleCellValueFromRef(cellRefMatch[1])) / Math.log10(10);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=LOG10(')) {
      const cellRefMatch = formula.match(/=LOG10\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.log10(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=MOD(')) {
      const rangeMatch = formula.match(/=MOD\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [number, divisor] = getTwoCellValuesFromRefs(rangeMatch[1] + ',' + rangeMatch[2]);
        const value = divisor !== 0 ? number % divisor : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=PI(')) {
      setCells(prev => ({
        ...prev,
        [cellKey]: {
          ...prev[cellKey],
          display: Math.PI.toString(),
          value: Math.PI
        }
      }));
    } else if (formula.startsWith('=POWER(')) {
      const rangeMatch = formula.match(/=POWER\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [base, exponent] = getTwoCellValuesFromRefs(rangeMatch[1] + ',' + rangeMatch[2]);
        const value = Math.pow(base, exponent);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=PRODUCT(')) {
      const rangeMatch = formula.match(/=PRODUCT\(([^)]+)\)/);
      if (rangeMatch) {
        const range = rangeMatch[1];
        const cellsInRange = parseRange(range);
        let product = 1;
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          const cellValue = Number(cells[key]?.value) || 1;
          if (!isNaN(cellValue)) {
            product *= cellValue;
          }
        });
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: product.toString(),
            value: product
          }
        }));
      }
    } else if (formula.startsWith('=RADIANS(')) {
      const cellRefMatch = formula.match(/=RADIANS\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = getSingleCellValueFromRef(cellRefMatch[1]) * (Math.PI / 180);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=RAND(')) {
      const value = Math.random();
      setCells(prev => ({
        ...prev,
        [cellKey]: {
          ...prev[cellKey],
          display: value.toString(),
          value
        }
      }));
    } else if (formula.startsWith('=RANDBETWEEN(')) {
      const rangeMatch = formula.match(/=RANDBETWEEN\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [min, max] = getTwoCellValuesFromRefs(rangeMatch[1] + ',' + rangeMatch[2]);
        const value = Math.floor(Math.random() * (max - min + 1)) + min;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ROUND(')) {
      const cellRefMatch = formula.match(/=ROUND\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.round(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ROUNDDOWN(')) {
      const cellRefMatch = formula.match(/=ROUNDDOWN\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.floor(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ROUNDUP(')) {
      const cellRefMatch = formula.match(/=ROUNDUP\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.ceil(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=SIGN(')) {
      const cellRefMatch = formula.match(/=SIGN\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.sign(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=SIN(')) {
      const cellRefMatch = formula.match(/=SIN\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.sin(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=SQRT(')) {
      const cellRefMatch = formula.match(/=SQRT\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.sqrt(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=SUMPRODUCT(')) {
      const rangeMatch = formula.match(/=SUMPRODUCT\(([^)]+)\)/);
      if (rangeMatch) {
        const range = rangeMatch[1];
        const cellsInRange = parseRange(range);
        let sum = 0;
        const rows = [...new Set(cellsInRange.map(cell => parseInt(cell.match(/[0-9]+/)[0])))];
        rows.forEach(row => {
          let product = 1;
          cellsInRange.forEach(cellRef => {
            if (cellRef.includes(row)) {
              const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
              const col = colLabel.charCodeAt(0) - 65;
              const key = `${parseInt(rowStr) - 1},${col}`;
              const cellValue = Number(cells[key]?.value) || 1;
              if (!isNaN(cellValue)) {
                product *= cellValue;
              }
            }
          });
          sum += product;
        });
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: sum.toString(),
            value: sum
          }
        }));
      }
    } else if (formula.startsWith('=TAN(')) {
      const cellRefMatch = formula.match(/=TAN\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.tan(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=TANRADIAN(')) {
      const cellRefMatch = formula.match(/=TANRADIAN\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.tan(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=TRUNC(')) {
      const cellRefMatch = formula.match(/=TRUNC\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Math.trunc(getSingleCellValueFromRef(cellRefMatch[1]));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=FV(')) {
      const rangeMatch = formula.match(/=FV\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [rate, nper, pmt] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 3);
        const value = pmt * ((Math.pow(1 + rate, nper) - 1) / rate);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=PV(')) {
      const rangeMatch = formula.match(/=PV\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [rate, nper, pmt] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 3);
        const value = pmt * (1 - Math.pow(1 + rate, -nper)) / rate;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=NPV(')) {
      const rangeMatch = formula.match(/=NPV\(([A-Z]+[0-9]+),([^)]+)\)/);
      if (rangeMatch) {
        const rate = getSingleCellValueFromRef(rangeMatch[1]);
        const cellsInRange = parseRange(rangeMatch[2]);
        let value = 0;
        cellsInRange.forEach((cellRef, index) => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          const cellValue = Number(cells[key]?.value) || 0;
          value += cellValue / Math.pow(1 + rate, index + 1);
        });
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=PMT(')) {
      const rangeMatch = formula.match(/=PMT\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [rate, nper, pv] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 3);
        const value = (pv * rate) / (1 - Math.pow(1 + rate, -nper));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=IPMT(')) {
      const rangeMatch = formula.match(/=IPMT\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [rate, per, nper, pv] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 4);
        const pmt = (pv * rate) / (1 - Math.pow(1 + rate, -nper));
        const value = pmt - (pv * Math.pow(1 + rate, per - 1) * rate);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=PPMT(')) {
      const rangeMatch = formula.match(/=PPMT\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [rate, per, nper, pv] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 4);
        const pmt = (pv * rate) / (1 - Math.pow(1 + rate, -nper));
        const value = pmt - (pv * Math.pow(1 + rate, per - 1) * rate);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=NPER(')) {
      const rangeMatch = formula.match(/=NPER\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [rate, pmt, pv] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 3);
        const value = Math.log(pmt / (pmt - pv * rate)) / Math.log(1 + rate);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=RATE(')) {
      const rangeMatch = formula.match(/=RATE\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [nper, pmt, pv] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 3);
        let rate = 0.1; // Initial guess
        for (let i = 0; i < 20; i++) {
          const pvCalc = pmt * (1 - Math.pow(1 + rate, -nper)) / rate;
          const derivative = pmt * (-nper * Math.pow(1 + rate, -nper - 1));
          rate -= (pvCalc - pv) / derivative; // Newton-Raphson method
        }
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(rate) ? 0 : rate).toString(),
            value: isNaN(rate) ? 0 : rate
          }
        }));
      }
    } else if (formula.startsWith('=IRR(')) {
      const rangeMatch = formula.match(/=IRR\(([^)]+)\)/);
      if (rangeMatch) {
        const range = rangeMatch[1];
        const cellsInRange = parseRange(range);
        const values = [];
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          const cellValue = Number(cells[key]?.value) || 0;
          values.push(cellValue);
        });
        let rate = 0.1; // Initial guess
        for (let i = 0; i < 20; i++) {
          let npv = 0;
          let derivative = 0;
          values.forEach((value, index) => {
            npv += value / Math.pow(1 + rate, index + 1);
            derivative -= (index + 1) * value / Math.pow(1 + rate, index + 2);
          });
          rate -= npv / derivative; // Newton-Raphson method
        }
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(rate) ? 0 : rate).toString(),
            value: isNaN(rate) ? 0 : rate
          }
        }));
      }
    } else if (formula.startsWith('=MIRR(')) {
      const rangeMatch = formula.match(/=MIRR\(([^)]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [range, financeRateRef, reinvestRateRef] = rangeMatch.slice(1);
        const financeRate = getSingleCellValueFromRef(financeRateRef);
        const reinvestRate = getSingleCellValueFromRef(reinvestRateRef);
        const cellsInRange = parseRange(range);
        const values = [];
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          const cellValue = Number(cells[key]?.value) || 0;
          values.push(cellValue);
        });
        let npvNegative = 0, npvPositive = 0;
        values.forEach((value, index) => {
          if (value < 0) {
            npvNegative += value / Math.pow(1 + financeRate, index + 1);
          } else {
            npvPositive += value / Math.pow(1 + reinvestRate, index + 1);
          }
        });
        const value = Math.pow(-npvPositive / npvNegative, 1 / values.length) - 1;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=SLN(')) {
      const rangeMatch = formula.match(/=SLN\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [cost, salvage, life] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 3);
        const value = (cost - salvage) / life;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=SYD(')) {
      const rangeMatch = formula.match(/=SYD\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [cost, salvage, life, period] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 4);
        const value = ((cost - salvage) * (life - period + 1) * 2) / (life * (life + 1));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=DB(')) {
      const rangeMatch = formula.match(/=DB\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [cost, salvage, life, period] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 4);
        const rate = 1 - Math.pow(salvage / cost, 1 / life);
        const value = cost * rate * Math.pow(1 - rate, period - 1);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=DDB(')) {
      const rangeMatch = formula.match(/=DDB\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [cost, salvage, life, period] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 4);
        let bookValue = cost;
        let value = 0;
        for (let i = 1; i <= period; i++) {
          value = Math.min((bookValue * 2) / life, bookValue - salvage);
          bookValue -= value;
        }
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=VDB(')) {
      const rangeMatch = formula.match(/=VDB\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [cost, salvage, life, startPeriod, endPeriod] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 5);
        let value = 0;
        let bookValue = cost;
        for (let i = Math.ceil(startPeriod); i <= endPeriod; i++) {
          const dep = Math.min((bookValue * 2) / life, bookValue - salvage);
          bookValue -= dep;
          value += dep;
        }
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
      // Date Functions
    } else if (formula.startsWith('=NOW(')) {
      const value = new Date().toLocaleString();
      setCells(prev => ({
        ...prev,
        [cellKey]: {
          ...prev[cellKey],
          display: value,
          value
        }
      }));
    } else if (formula.startsWith('=TODAY(')) {
      const value = new Date().toLocaleDateString();
      setCells(prev => ({
        ...prev,
        [cellKey]: {
          ...prev[cellKey],
          display: value,
          value
        }
      }));
    } else if (formula.startsWith('=DATE(')) {
      const rangeMatch = formula.match(/=DATE\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [year, month, day] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 3);
        const value = new Date(year, month - 1, day).toLocaleDateString();
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=DATEVALUE(')) {
      const cellRefMatch = formula.match(/=DATEVALUE\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const dateString = getDateValueFromRef(cellRefMatch[1]);
        const value = new Date(dateString).getTime() / (1000 * 60 * 60 * 24);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : Math.floor(value)).toString(),
            value: isNaN(value) ? 0 : Math.floor(value)
          }
        }));
      }
    } else if (formula.startsWith('=DAY(')) {
      const cellRefMatch = formula.match(/=DAY\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const dateString = getDateValueFromRef(cellRefMatch[1]);
        const value = new Date(dateString).getDate();
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=DAYS(')) {
      const rangeMatch = formula.match(/=DAYS\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [endDate, startDate] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        const diff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(diff) ? 0 : Math.floor(diff)).toString(),
            value: isNaN(diff) ? 0 : Math.floor(diff)
          }
        }));
      }
    } else if (formula.startsWith('=DAYS360(')) {
      const rangeMatch = formula.match(/=DAYS360\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [startDate, endDate] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const value = ((end.getFullYear() - start.getFullYear()) * 360) +
          ((end.getMonth() - start.getMonth()) * 30) +
          (end.getDate() - start.getDate());
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=EDATE(')) {
      const rangeMatch = formula.match(/=EDATE\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [startDate, months] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + months);
        const value = date.toLocaleDateString();
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=EOMONTH(')) {
      const rangeMatch = formula.match(/=EOMONTH\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [startDate, months] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + months + 1, 0);
        const value = date.toLocaleDateString();
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=HOUR(')) {
      const cellRefMatch = formula.match(/=HOUR\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const dateString = getDateValueFromRef(cellRefMatch[1]);
        const value = new Date(dateString).getHours();
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=MINUTE(')) {
      const cellRefMatch = formula.match(/=MINUTE\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const dateString = getDateValueFromRef(cellRefMatch[1]);
        const value = new Date(dateString).getMinutes();
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=MONTH(')) {
      const cellRefMatch = formula.match(/=MONTH\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const dateString = getDateValueFromRef(cellRefMatch[1]);
        const value = new Date(dateString).getMonth() + 1;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=NETWORKDAYS(')) {
      const rangeMatch = formula.match(/=NETWORKDAYS\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [startDate, endDate] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        let start = new Date(startDate);
        let end = new Date(endDate);
        let count = 0;
        while (start <= end) {
          const day = start.getDay();
          if (day !== 0 && day !== 6) count++;
          start.setDate(start.getDate() + 1);
        }
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(count) ? 0 : count).toString(),
            value: isNaN(count) ? 0 : count
          }
        }));
      }
    } else if (formula.startsWith('=SECOND(')) {
      const cellRefMatch = formula.match(/=SECOND\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const dateString = getDateValueFromRef(cellRefMatch[1]);
        const value = new Date(dateString).getSeconds();
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=TIME(')) {
      const rangeMatch = formula.match(/=TIME\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [hour, minute, second] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 3);
        const value = new Date(0, 0, 0, hour, minute, second).toLocaleTimeString();
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=TIMEVALUE(')) {
      const cellRefMatch = formula.match(/=TIMEVALUE\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const timeString = getDateValueFromRef(cellRefMatch[1]);
        const date = new Date(`1970-01-01 ${timeString}`);
        const value = (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) / 86400;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=WEEKDAY(')) {
      const cellRefMatch = formula.match(/=WEEKDAY\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const dateString = getDateValueFromRef(cellRefMatch[1]);
        const value = new Date(dateString).getDay() + 1;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=WEEKNUM(')) {
      const cellRefMatch = formula.match(/=WEEKNUM\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const dateString = getDateValueFromRef(cellRefMatch[1]);
        const date = new Date(dateString);
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const value = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=WORKDAY(')) {
      const rangeMatch = formula.match(/=WORKDAY\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [startDate, days] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        let date = new Date(startDate);
        let count = 0;
        while (count < days) {
          date.setDate(date.getDate() + 1);
          if (date.getDay() !== 0 && date.getDay() !== 6) count++;
        }
        const value = date.toLocaleDateString();
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=YEAR(')) {
      const cellRefMatch = formula.match(/=YEAR\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const dateString = getDateValueFromRef(cellRefMatch[1]);
        const value = new Date(dateString).getFullYear();
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=YEARFRAC(')) {
      const rangeMatch = formula.match(/=YEARFRAC\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [startDate, endDate] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(diff) ? 0 : diff).toString(),
            value: isNaN(diff) ? 0 : diff
          }
        }));
      }
    } else if (formula.startsWith('=CHAR(')) {
      const cellRefMatch = formula.match(/=CHAR\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = String.fromCharCode(Number(getSingleCellValueFromRef(cellRefMatch[1])) || 0);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=CLEAN(')) {
      const cellRefMatch = formula.match(/=CLEAN\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = getSingleCellValueFromRef(cellRefMatch[1]).replace(/[\x00-\x1F\x7F]/g, '');
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=CODE(')) {
      const cellRefMatch = formula.match(/=CODE\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const str = getSingleCellValueFromRef(cellRefMatch[1]);
        const value = str ? str.charCodeAt(0) : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=CONCATENATE(')) {
      const rangeMatch = formula.match(/=CONCATENATE\(([^)]+)\)/);
      if (rangeMatch) {
        const range = rangeMatch[1];
        const cellsInRange = parseRange(range);
        let value = '';
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          value += cells[key]?.value || '';
        });
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=EXACT(')) {
      const rangeMatch = formula.match(/=EXACT\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [text1, text2] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        const value = text1 === text2 ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=FIND(')) {
      const rangeMatch = formula.match(/=FIND\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [findText, withinText] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        const value = withinText.indexOf(findText) + 1 || 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=LEFT(')) {
      const rangeMatch = formula.match(/=LEFT\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [text, numChars] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        const value = text.slice(0, Number(numChars) || 0);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=LEN(')) {
      const cellRefMatch = formula.match(/=LEN\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = getSingleCellValueFromRef(cellRefMatch[1]).length;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=LOWER(')) {
      const cellRefMatch = formula.match(/=LOWER\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = getSingleCellValueFromRef(cellRefMatch[1]).toLowerCase();
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=MID(')) {
      const rangeMatch = formula.match(/=MID\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [text, startNum, numChars] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 3);
        const value = text.slice(Number(startNum) - 1, Number(startNum) - 1 + Number(numChars));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=PROPER(')) {
      const cellRefMatch = formula.match(/=PROPER\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = getSingleCellValueFromRef(cellRefMatch[1]).replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=REPLACE(')) {
      const rangeMatch = formula.match(/=REPLACE\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [oldText, startNum, numChars, newText] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 4);
        const value = oldText.slice(0, Number(startNum) - 1) + newText + oldText.slice(Number(startNum) - 1 + Number(numChars));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=REPT(')) {
      const rangeMatch = formula.match(/=REPT\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [text, numberTimes] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        const value = text.repeat(Number(numberTimes) || 0);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=RIGHT(')) {
      const rangeMatch = formula.match(/=RIGHT\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [text, numChars] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        const value = text.slice(-Number(numChars) || 0);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=SEARCH(')) {
      const rangeMatch = formula.match(/=SEARCH\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [findText, withinText] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        const value = withinText.toLowerCase().indexOf(findText.toLowerCase()) + 1 || 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=SUBSTITUTE(')) {
      const rangeMatch = formula.match(/=SUBSTITUTE\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [text, oldText, newText] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 3);
        const value = text.replace(new RegExp(oldText, 'g'), newText);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=T(')) {
      const cellRefMatch = formula.match(/=T\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = typeof getSingleCellValueFromRef(cellRefMatch[1]) === 'string' ? getSingleCellValueFromRef(cellRefMatch[1]) : '';
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=TEXT(')) {
      const rangeMatch = formula.match(/=TEXT\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [value, format] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        let formattedValue;
        if (format.includes('0')) {
          formattedValue = Number(value).toFixed(format.match(/0/g)?.length || 0);
        } else if (format.includes('yyyy')) {
          formattedValue = new Date(value).toLocaleDateString();
        } else {
          formattedValue = value.toString();
        }
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: formattedValue,
            value: formattedValue
          }
        }));
      }
    } else if (formula.startsWith('=TEXTNOW(')) {
      const cellRefMatch = formula.match(/=TEXTNOW\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const format = getSingleCellValueFromRef(cellRefMatch[1]);
        const value = new Date().toLocaleString(); // Simplified, apply format if provided
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=TRIM(')) {
      const cellRefMatch = formula.match(/=TRIM\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = getSingleCellValueFromRef(cellRefMatch[1]).trim();
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=UPPER(')) {
      const cellRefMatch = formula.match(/=UPPER\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = getSingleCellValueFromRef(cellRefMatch[1]).toUpperCase();
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=VALUE(')) {
      const cellRefMatch = formula.match(/=VALUE\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Number(getSingleCellValueFromRef(cellRefMatch[1])) || 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
      // Combinatorial Functions
    } else if (formula.startsWith('=COMBIN(')) {
      const rangeMatch = formula.match(/=COMBIN\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [n, k] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2).map(Number);
        const factorial = (x) => {
          let result = 1;
          for (let i = 1; i <= x; i++) result *= i;
          return result;
        };
        const value = factorial(n) / (factorial(k) * factorial(n - k));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : Math.round(value)).toString(),
            value: isNaN(value) ? 0 : Math.round(value)
          }
        }));
      }
    } else if (formula.startsWith('=PERMUT(')) {
      const rangeMatch = formula.match(/=PERMUT\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [n, k] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2).map(Number);
        const factorial = (x) => {
          let result = 1;
          for (let i = 1; i <= x; i++) result *= i;
          return result;
        };
        const value = factorial(n) / factorial(n - k);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : Math.round(value)).toString(),
            value: isNaN(value) ? 0 : Math.round(value)
          }
        }));
      }
      // Distribution Functions
    } else if (formula.startsWith('=NORMDIST(')) {
      const rangeMatch = formula.match(/=NORMDIST\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [x, mean, stdev] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 3).map(Number);
        const z = (x - mean) / stdev;
        const value = (1 / (stdev * Math.sqrt(2 * Math.PI))) * Math.exp(-(z ** 2) / 2);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=NORMSDIST(')) {
      const cellRefMatch = formula.match(/=NORMSDIST\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const z = Number(getSingleCellValueFromRef(cellRefMatch[1]));
        const value = 0.5 * (1 + erf(z / Math.sqrt(2)));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=NORMINV(')) {
      const rangeMatch = formula.match(/=NORMINV\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [p, mean, stdev] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 3).map(Number);
        const value = mean + stdev * normInv(p);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=NORMSINV(')) {
      const cellRefMatch = formula.match(/=NORMSINV\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const p = Number(getSingleCellValueFromRef(cellRefMatch[1]));
        const value = normInv(p);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=POISSON(')) {
      const rangeMatch = formula.match(/=POISSON\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [x, mean] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2).map(Number);
        const factorial = (x) => {
          let result = 1;
          for (let i = 1; i <= x; i++) result *= i;
          return result;
        };
        const value = (Math.exp(-mean) * Math.pow(mean, x)) / factorial(x);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=WEIBULL(')) {
      const rangeMatch = formula.match(/=WEIBULL\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [x, alpha, beta] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 3).map(Number);
        const value = (alpha / beta) * Math.pow(x / beta, alpha - 1) * Math.exp(-Math.pow(x / beta, alpha));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=AND(')) {
      const rangeMatch = formula.match(/=AND\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const value = values.every(val => Boolean(val)) ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=FALSE(')) {
      setCells(prev => ({
        ...prev,
        [cellKey]: {
          ...prev[cellKey],
          display: '0',
          value: 0
        }
      }));
    } else if (formula.startsWith('=IF(')) {
      const rangeMatch = formula.match(/=IF\(([A-Z]+[0-9]+),([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [condition, valueIfTrue, valueIfFalse] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 3);
        const value = Boolean(Number(condition)) ? valueIfTrue : valueIfFalse;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=IFERROR(')) {
      const rangeMatch = formula.match(/=IFERROR\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [value, valueIfError] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        const parsedValue = Number(value);
        const result = isNaN(parsedValue) ? valueIfError : parsedValue;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: result.toString(),
            value: result
          }
        }));
      }
    } else if (formula.startsWith('=IFS(')) {
      const rangeMatch = formula.match(/=IFS\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getMultipleCellValuesFromRefs(rangeMatch[1], parseRange(rangeMatch[1]).length);
        let value = '';
        for (let i = 0; i < values.length - 1; i += 2) {
          if (Boolean(Number(values[i]))) {
            value = values[i + 1];
            break;
          }
        }
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (value || 0).toString(),
            value: value || 0
          }
        }));
      }
    } else if (formula.startsWith('=NOT(')) {
      const cellRefMatch = formula.match(/=NOT\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Boolean(Number(getSingleCellValueFromRef(cellRefMatch[1]))) ? 0 : 1;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=OR(')) {
      const rangeMatch = formula.match(/=OR\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const value = values.some(val => Boolean(val)) ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=SWITCH(')) {
      const rangeMatch = formula.match(/=SWITCH\(([A-Z]+[0-9]+),([^)]+)\)/);
      if (rangeMatch) {
        const [expression, ...pairs] = getMultipleCellValuesFromRefs([rangeMatch[1], ...parseRange(rangeMatch[2])].join(','), parseRange(rangeMatch[2]).length + 1);
        let value = '';
        for (let i = 0; i < pairs.length - 1; i += 2) {
          if (expression === pairs[i]) {
            value = pairs[i + 1];
            break;
          }
        }
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (value || (pairs.length % 2 ? pairs[pairs.length - 1] : 0)).toString(),
            value: value || (pairs.length % 2 ? pairs[pairs.length - 1] : 0)
          }
        }));
      }
    } else if (formula.startsWith('=TRUE(')) {
      setCells(prev => ({
        ...prev,
        [cellKey]: {
          ...prev[cellKey],
          display: '1',
          value: 1
        }
      }));
    } else if (formula.startsWith('=XOR(')) {
      const rangeMatch = formula.match(/=XOR\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const value = values.reduce((acc, val) => acc ^ Boolean(val), 0);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
      // Statistical Functions
    } else if (formula.startsWith('=AVERAGE(')) {
      const rangeMatch = formula.match(/=AVERAGE\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const value = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=COUNT(')) {
      const rangeMatch = formula.match(/=COUNT\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const value = values.filter(val => !isNaN(val) && val !== '').length;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=COUNTA(')) {
      const rangeMatch = formula.match(/=COUNTA\(([^)]+)\)/);
      if (rangeMatch) {
        const cellsInRange = parseRange(rangeMatch[1]);
        const values = [];
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          if (cells[key]?.value !== undefined && cells[key]?.value !== '') values.push(cells[key].value);
        });
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: values.length.toString(),
            value: values.length
          }
        }));
      }
    } else if (formula.startsWith('=COUNTBLANK(')) {
      const rangeMatch = formula.match(/=COUNTBLANK\(([^)]+)\)/);
      if (rangeMatch) {
        const cellsInRange = parseRange(rangeMatch[1]);
        let count = 0;
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          if (!cells[key]?.value) count++;
        });
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: count.toString(),
            value: count
          }
        }));
      }
    } else if (formula.startsWith('=COUNTIF(')) {
      const rangeMatch = formula.match(/=COUNTIF\(([^,]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const cellsInRange = parseRange(rangeMatch[1]);
        const criterion = getSingleCellValueFromRef(rangeMatch[2]);
        let count = 0;
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          if (cells[key]?.value === criterion) count++;
        });
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: count.toString(),
            value: count
          }
        }));
      }
    } else if (formula.startsWith('=MEDIAN(')) {
      const rangeMatch = formula.match(/=MEDIAN\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]).sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        const value = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=MODE(')) {
      const rangeMatch = formula.match(/=MODE\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const counts = {};
        values.forEach(val => counts[val] = (counts[val] || 0) + 1);
        const value = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 0);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : Number(value)).toString(),
            value: isNaN(value) ? 0 : Number(value)
          }
        }));
      }
    } else if (formula.startsWith('=STDEV(')) {
      const rangeMatch = formula.match(/=STDEV\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const variance = values.length > 1 ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1) : 0;
        const value = Math.sqrt(variance);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=STDEVP(')) {
      const rangeMatch = formula.match(/=STDEVP\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const variance = values.length ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length : 0;
        const value = Math.sqrt(variance);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=VAR(')) {
      const rangeMatch = formula.match(/=VAR\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const value = values.length > 1 ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1) : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=VARP(')) {
      const rangeMatch = formula.match(/=VARP\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const value = values.length ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=STDEVA(')) {
      const rangeMatch = formula.match(/=STDEVA\(([^)]+)\)/);
      if (rangeMatch) {
        const cellsInRange = parseRange(rangeMatch[1]);
        const values = [];
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          values.push(cells[key]?.value ? Number(cells[key].value) : 0);
        });
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const variance = values.length > 1 ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1) : 0;
        const value = Math.sqrt(variance);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=STDEVPA(')) {
      const rangeMatch = formula.match(/=STDEVPA\(([^)]+)\)/);
      if (rangeMatch) {
        const cellsInRange = parseRange(rangeMatch[1]);
        const values = [];
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          values.push(cells[key]?.value ? Number(cells[key].value) : 0);
        });
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const variance = values.length ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length : 0;
        const value = Math.sqrt(variance);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=VARA(')) {
      const rangeMatch = formula.match(/=VARA\(([^)]+)\)/);
      if (rangeMatch) {
        const cellsInRange = parseRange(rangeMatch[1]);
        const values = [];
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          values.push(cells[key]?.value ? Number(cells[key].value) : 0);
        });
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const value = values.length > 1 ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1) : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=VARPA(')) {
      const rangeMatch = formula.match(/=VARPA\(([^)]+)\)/);
      if (rangeMatch) {
        const cellsInRange = parseRange(rangeMatch[1]);
        const values = [];
        cellsInRange.forEach(cellRef => {
          const [colLabel, rowStr] = cellRef.split(/(?=[0-9])/);
          const col = colLabel.charCodeAt(0) - 65;
          const row = parseInt(rowStr) - 1;
          const key = `${row},${col}`;
          values.push(cells[key]?.value ? Number(cells[key].value) : 0);
        });
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const value = values.length ? values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=CORREL(')) {
      const rangeMatch = formula.match(/=CORREL\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const mid = values.length / 2;
        const x = values.slice(0, mid);
        const y = values.slice(mid);
        const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
        const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
        const cov = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0) / x.length;
        const stdevX = Math.sqrt(x.reduce((sum, val) => sum + (val - meanX) ** 2, 0) / x.length);
        const stdevY = Math.sqrt(y.reduce((sum, val) => sum + (val - meanY) ** 2, 0) / y.length);
        const value = cov / (stdevX * stdevY);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=COVAR(')) {
      const rangeMatch = formula.match(/=COVAR\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const mid = values.length / 2;
        const x = values.slice(0, mid);
        const y = values.slice(mid);
        const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
        const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
        const value = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0) / x.length;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=GEOMEAN(')) {
      const rangeMatch = formula.match(/=GEOMEAN\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]).filter(val => val > 0);
        const value = Math.exp(values.reduce((sum, val) => sum + Math.log(val), 0) / values.length);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=HARMEAN(')) {
      const rangeMatch = formula.match(/=HARMEAN\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]).filter(val => val > 0);
        const value = values.length / values.reduce((sum, val) => sum + 1 / val, 0);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=KURT(')) {
      const rangeMatch = formula.match(/=KURT\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const stdev = Math.sqrt(values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1));
        const n = values.length;
        const value = (values.reduce((sum, val) => sum + ((val - mean) / stdev) ** 4, 0) * n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3)));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=SKEW(')) {
      const rangeMatch = formula.match(/=SKEW\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const stdev = Math.sqrt(values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1));
        const value = values.reduce((sum, val) => sum + ((val - mean) / stdev) ** 3, 0) * values.length / ((values.length - 1) * (values.length - 2));
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=SLOPE(')) {
      const rangeMatch = formula.match(/=SLOPE\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const mid = values.length / 2;
        const y = values.slice(0, mid);
        const x = values.slice(mid);
        const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
        const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
        const num = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
        const denom = x.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
        const value = num / denom;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=INTERCEPT(')) {
      const rangeMatch = formula.match(/=INTERCEPT\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const mid = values.length / 2;
        const y = values.slice(0, mid);
        const x = values.slice(mid);
        const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
        const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
        const num = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
        const denom = x.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
        const slope = num / denom;
        const value = meanY - slope * meanX;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=RSQ(')) {
      const rangeMatch = formula.match(/=RSQ\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const mid = values.length / 2;
        const y = values.slice(0, mid);
        const x = values.slice(mid);
        const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
        const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
        const num = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
        const denomX = x.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
        const denomY = y.reduce((sum, val) => sum + (val - meanY) ** 2, 0);
        const value = (num ** 2) / (denomX * denomY);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=FORECAST(')) {
      const rangeMatch = formula.match(/=FORECAST\(([A-Z]+[0-9]+),([^)]+)\)/);
      if (rangeMatch) {
        const x = Number(getSingleCellValueFromRef(rangeMatch[1]));
        const values = getRangeValuesFromRefs(rangeMatch[2]);
        const mid = values.length / 2;
        const y = values.slice(0, mid);
        const knownX = values.slice(mid);
        const meanX = knownX.reduce((sum, val) => sum + val, 0) / knownX.length;
        const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
        const num = knownX.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
        const denom = knownX.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
        const slope = num / denom;
        const intercept = meanY - slope * meanX;
        const value = slope * x + intercept;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=TREND(')) {
      const rangeMatch = formula.match(/=TREND\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const mid = values.length / 2;
        const y = values.slice(0, mid);
        const x = values.slice(mid);
        const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
        const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
        const num = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
        const denom = x.reduce((sum, val) => sum + (val - meanX) ** 2, 0);
        const slope = num / denom;
        const intercept = meanY - slope * meanX;
        const value = x.map(val => slope * val + intercept).join(',');
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value,
            value
          }
        }));
      }
    } else if (formula.startsWith('=PERCENTILE(')) {
      const rangeMatch = formula.match(/=PERCENTILE\(([^,]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const k = Number(getSingleCellValueFromRef(rangeMatch[2]));
        const values = getRangeValuesFromRefs(rangeMatch[1]).sort((a, b) => a - b);
        const n = values.length;
        const index = k * (n - 1);
        const lower = Math.floor(index);
        const fraction = index - lower;
        const value = lower < n - 1 ? values[lower] + fraction * (values[lower + 1] - values[lower]) : values[n - 1];
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=PERCENTRANK(')) {
      const rangeMatch = formula.match(/=PERCENTRANK\(([^,]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const x = Number(getSingleCellValueFromRef(rangeMatch[2]));
        const values = getRangeValuesFromRefs(rangeMatch[1]).sort((a, b) => a - b);
        const rank = values.findIndex(val => val >= x);
        const value = rank / (values.length - 1);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=QUARTILE(')) {
      const rangeMatch = formula.match(/=QUARTILE\(([^,]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const quart = Number(getSingleCellValueFromRef(rangeMatch[2]));
        const values = getRangeValuesFromRefs(rangeMatch[1]).sort((a, b) => a - b);
        const n = values.length;
        const k = quart * (n - 1) / 4;
        const lower = Math.floor(k);
        const fraction = k - lower;
        const value = lower < n - 1 ? values[lower] + fraction * (values[lower + 1] - values[lower]) : values[n - 1];
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=RANK(')) {
      const rangeMatch = formula.match(/=RANK\(([A-Z]+[0-9]+),([^)]+)\)/);
      if (rangeMatch) {
        const x = Number(getSingleCellValueFromRef(rangeMatch[1]));
        const values = getRangeValuesFromRefs(rangeMatch[2]).sort((a, b) => b - a);
        const value = values.indexOf(x) + 1;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (value || 0).toString(),
            value: value || 0
          }
        }));
      }
    } else if (formula.startsWith('=LARGE(')) {
      const rangeMatch = formula.match(/=LARGE\(([^,]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const k = Number(getSingleCellValueFromRef(rangeMatch[2]));
        const values = getRangeValuesFromRefs(rangeMatch[1]).sort((a, b) => b - a);
        const value = values[k - 1] || 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (functionName === 'SMALL') {
      const rangeMatch = formula.match(/=SMALL\(([^,]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const k = Number(getSingleCellValueFromRef(rangeMatch[2]));
        const values = getRangeValuesFromRefs(rangeMatch[1]).sort((a, b) => a - b);
        const value = values[k - 1] || 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=DEVSQ(')) {
      const rangeMatch = formula.match(/=DEVSQ\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const mean = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        const value = values.reduce((sum, val) => sum + (val - mean) ** 2, 0);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=TRIMMEAN(')) {
      const rangeMatch = formula.match(/=TRIMMEAN\(([^,]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const percent = Number(getSingleCellValueFromRef(rangeMatch[2]));
        const values = getRangeValuesFromRefs(rangeMatch[1]).sort((a, b) => a - b);
        const n = values.length;
        const trim = Math.floor(n * percent / 2);
        const trimmedValues = values.slice(trim, n - trim);
        const value = trimmedValues.length ? trimmedValues.reduce((sum, val) => sum + val, 0) / trimmedValues.length : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: (isNaN(value) ? 0 : value).toString(),
            value: isNaN(value) ? 0 : value
          }
        }));
      }
    } else if (formula.startsWith('=ARRAYFORMULA(')) {
      const rangeMatch = formula.match(/=ARRAYFORMULA\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const [rowStr, colStr] = cellKey.split(',');
        const row = parseInt(rowStr);
        const col = parseInt(colStr);
        const rowLength = parseRange(rangeMatch[1]).length / (parseRange(rangeMatch[1])[0].match(/[0-9]+/)[0] === parseRange(rangeMatch[1])[parseRange(rangeMatch[1]).length - 1].match(/[0-9]+/)[0] ? 1 : parseRange(rangeMatch[1]).length);
        values.forEach((value, index) => {
          const targetKey = `${row + Math.floor(index / rowLength)},${col + (index % rowLength)}`;
          setCells(prev => ({
            ...prev,
            [targetKey]: {
              ...prev[targetKey],
              display: value.toString(),
              value,
              formula
            }
          }));
        });
      }
    } else if (formula.startsWith('=FILTER(')) {
      const rangeMatch = formula.match(/=FILTER\(([^,]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const condition = Number(getSingleCellValueFromRef(rangeMatch[2]));
        const values = getRangeValuesFromRefs(rangeMatch[1]).filter((_, i) => Number(getRangeValuesFromRefs(rangeMatch[1])[i]) >= condition);
        const [rowStr, col] = cellKey.split(',');
        let row = parseInt(rowStr);
        values.forEach((value, index) => {
          const targetKey = `${row + index},${col}`;
          setCells(prev => ({
            ...prev,
            [targetKey]: {
              ...prev[targetKey],
              display: value.toString(),
              value,
              formula
            }
          }));
        });
      }
    } else if (formula.startsWith('=FLATTEN(')) {
      const rangeMatch = formula.match(/=FLATTEN\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const [rowStr, col] = cellKey.split(',');
        let row = parseInt(rowStr);
        values.forEach((value, index) => {
          const targetKey = `${row + index},${col}`;
          setCells(prev => ({
            ...prev,
            [targetKey]: {
              ...prev[targetKey],
              display: value.toString(),
              value,
              formula
            }
          }));
        });
      }
    } else if (formula.startsWith('=SORT(')) {
      const rangeMatch = formula.match(/=SORT\(([^)]+)\)/);
      if (rangeMatch) {
        const values = getRangeValuesFromRefs(rangeMatch[1]).sort((a, b) => Number(a) - Number(b));
        const [rowStr, col] = cellKey.split(',');
        let row = parseInt(rowStr);
        values.forEach((value, index) => {
          const targetKey = `${row + index},${col}`;
          setCells(prev => ({
            ...prev,
            [targetKey]: {
              ...prev[targetKey],
              display: value.toString(),
              value,
              formula
            }
          }));
        });
      }
    } else if (formula.startsWith('=SORTN(')) {
      const rangeMatch = formula.match(/=SORTN\(([^,]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const n = Number(getSingleCellValueFromRef(rangeMatch[2]));
        const values = getRangeValuesFromRefs(rangeMatch[1]).sort((a, b) => Number(a) - Number(b)).slice(0, n);
        const [rowStr, col] = cellKey.split(',');
        let row = parseInt(rowStr);
        values.forEach((value, index) => {
          const targetKey = `${row + index},${col}`;
          setCells(prev => ({
            ...prev,
            [targetKey]: {
              ...prev[targetKey],
              display: value.toString(),
              value,
              formula
            }
          }));
        });
      }
    } else if (formula.startsWith('=UNIQUE(')) {
      const rangeMatch = formula.match(/=UNIQUE\(([^)]+)\)/);
      if (rangeMatch) {
        const values = [...new Set(getRangeValuesFromRefs(rangeMatch[1]))];
        const [rowStr, col] = cellKey.split(',');
        let row = parseInt(rowStr);
        values.forEach((value, index) => {
          const targetKey = `${row + index},${col}`;
          setCells(prev => ({
            ...prev,
            [targetKey]: {
              ...prev[targetKey],
              display: value.toString(),
              value,
              formula
            }
          }));
        });
      }
      // Lookup Functions
    } else if (formula.startsWith('=CHOOSE(')) {
      const rangeMatch = formula.match(/=CHOOSE\(([A-Z]+[0-9]+),([^)]+)\)/);
      if (rangeMatch) {
        const index = Number(getSingleCellValueFromRef(rangeMatch[1]));
        const values = getRangeValuesFromRefs(rangeMatch[2]);
        const value = index > 0 && index <= values.length ? values[index - 1] : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=HLOOKUP(')) {
      const rangeMatch = formula.match(/=HLOOKUP\(([A-Z]+[0-9]+),([^,]+),2\)/);
      if (rangeMatch) {
        const lookupValue = getSingleCellValueFromRef(rangeMatch[1]);
        const values = getRangeValuesFromRefs(rangeMatch[2]);
        const rowLength = parseRange(rangeMatch[2]).length / (parseRange(rangeMatch[2])[0].match(/[0-9]+/)[0] === parseRange(rangeMatch[2])[parseRange(rangeMatch[2]).length - 1].match(/[0-9]+/)[0] ? 1 : 2);
        const firstRow = values.slice(0, rowLength);
        const secondRow = values.slice(rowLength, rowLength * 2);
        const index = firstRow.indexOf(lookupValue);
        const value = index >= 0 ? secondRow[index] : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=INDEX(')) {
      const rangeMatch = formula.match(/=INDEX\(([^,]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const rowNum = Number(getSingleCellValueFromRef(rangeMatch[2]));
        const values = getRangeValuesFromRefs(rangeMatch[1]);
        const rowLength = parseRange(rangeMatch[1]).length / (parseRange(rangeMatch[1])[0].match(/[0-9]+/)[0] === parseRange(rangeMatch[1])[parseRange(rangeMatch[1]).length - 1].match(/[0-9]+/)[0] ? 1 : parseRange(rangeMatch[1]).length);
        const value = rowNum > 0 && rowNum <= Math.ceil(values.length / rowLength) ? values[(rowNum - 1) * rowLength] : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=MATCH(')) {
      const rangeMatch = formula.match(/=MATCH\(([A-Z]+[0-9]+),([^)]+)\)/);
      if (rangeMatch) {
        const lookupValue = getSingleCellValueFromRef(rangeMatch[1]);
        const values = getRangeValuesFromRefs(rangeMatch[2]);
        const value = values.indexOf(lookupValue) + 1 || 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=VLOOKUP(')) {
      const rangeMatch = formula.match(/=VLOOKUP\(([A-Z]+[0-9]+),([^,]+),2\)/);
      if (rangeMatch) {
        const lookupValue = getSingleCellValueFromRef(rangeMatch[1]);
        const values = getRangeValuesFromRefs(rangeMatch[2]);
        const colLength = parseRange(rangeMatch[2]).length / (parseRange(rangeMatch[2])[0].match(/[A-Z]+/)[0] === parseRange(rangeMatch[2])[parseRange(rangeMatch[2]).length - 1].match(/[A-Z]+/)[0] ? 1 : 2);
        const firstCol = values.filter((_, i) => i % colLength === 0);
        const secondCol = values.filter((_, i) => i % colLength === 1);
        const index = firstCol.indexOf(lookupValue);
        const value = index >= 0 ? secondCol[index] : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
      // Information Functions
    } else if (formula.startsWith('=CELL(')) {
      const rangeMatch = formula.match(/=CELL\(([A-Z]+[0-9]+),([A-Z]+[0-9]+)\)/);
      if (rangeMatch) {
        const [infoType, cellRef] = getMultipleCellValuesFromRefs(rangeMatch.slice(1).join(','), 2);
        const [colLabel, rowStr] = cellRef.match(/([A-Z]+)([0-9]+)/)?.slice(1) || ['', '1'];
        const value = infoType === 'address' ? cellRef : infoType === 'row' ? rowStr : infoType === 'col' ? colLabel : '';
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ERROR_TYPE(')) {
      const cellRefMatch = formula.match(/=ERROR_TYPE\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = isNaN(Number(getSingleCellValueFromRef(cellRefMatch[1]))) ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=INFO(')) {
      const cellRefMatch = formula.match(/=INFO\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const infoType = getSingleCellValueFromRef(cellRefMatch[1]);
        const value = infoType === 'osversion' ? 'Browser' : infoType === 'system' ? 'Web' : '';
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ISBLANK(')) {
      const cellRefMatch = formula.match(/=ISBLANK\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = getSingleCellValueFromRef(cellRefMatch[1]) === '' ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ISERR(')) {
      const cellRefMatch = formula.match(/=ISERR\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = isNaN(Number(getSingleCellValueFromRef(cellRefMatch[1]))) && getSingleCellValueFromRef(cellRefMatch[1]) !== '#N/A' ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ISERROR(')) {
      const cellRefMatch = formula.match(/=ISERROR\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = isNaN(Number(getSingleCellValueFromRef(cellRefMatch[1]))) ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ISEVEN(')) {
      const cellRefMatch = formula.match(/=ISEVEN\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Number(getSingleCellValueFromRef(cellRefMatch[1])) % 2 === 0 ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ISFORMULA(')) {
      const cellRefMatch = formula.match(/=ISFORMULA\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const [colLabel, rowStr] = cellRefMatch[1].split(/(?=[0-9])/);
        const col = colLabel.charCodeAt(0) - 65;
        const row = parseInt(rowStr) - 1;
        const key = `${row},${col}`;
        const value = cells[key]?.formula ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ISLOGICAL(')) {
      const cellRefMatch = formula.match(/=ISLOGICAL\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = getSingleCellValueFromRef(cellRefMatch[1]) === '1' || getSingleCellValueFromRef(cellRefMatch[1]) === '0' ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ISNA(')) {
      const cellRefMatch = formula.match(/=ISNA\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = getSingleCellValueFromRef(cellRefMatch[1]) === '#N/A' ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ISNONTEXT(')) {
      const cellRefMatch = formula.match(/=ISNONTEXT\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = isNaN(Number(getSingleCellValueFromRef(cellRefMatch[1]))) ? 0 : 1;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ISNUMBER(')) {
      const cellRefMatch = formula.match(/=ISNUMBER\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = !isNaN(Number(getSingleCellValueFromRef(cellRefMatch[1]))) ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ISODD(')) {
      const cellRefMatch = formula.match(/=ISODD\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = Number(getSingleCellValueFromRef(cellRefMatch[1])) % 2 !== 0 ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ISREF(')) {
      const cellRefMatch = formula.match(/=ISREF\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = /^[A-Z]+[0-9]+$/.test(getSingleCellValueFromRef(cellRefMatch[1])) ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=ISTEXT(')) {
      const cellRefMatch = formula.match(/=ISTEXT\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const value = isNaN(Number(getSingleCellValueFromRef(cellRefMatch[1]))) && getSingleCellValueFromRef(cellRefMatch[1]) !== '' ? 1 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=N(')) {
      const cellRefMatch = formula.match(/=N\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const val = getSingleCellValueFromRef(cellRefMatch[1]);
        const value = val === '1' ? 1 : val === '0' ? 0 : Number(val) || 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    } else if (formula.startsWith('=NA(')) {
      setCells(prev => ({
        ...prev,
        [cellKey]: {
          ...prev[cellKey],
          display: '#N/A',
          value: '#N/A'
        }
      }));
    } else if (formula.startsWith('=SHEET(')) {
      setCells(prev => ({
        ...prev,
        [cellKey]: {
          ...prev[cellKey],
          display: '1',
          value: 1
        }
      }));
    } else if (formula.startsWith('=SHEETS(')) {
      setCells(prev => ({
        ...prev,
        [cellKey]: {
          ...prev[cellKey],
          display: '1',
          value: 1
        }
      }));
    } else if (formula.startsWith('=TYPE(')) {
      const cellRefMatch = formula.match(/=TYPE\(([A-Z]+[0-9]+)\)/);
      if (cellRefMatch) {
        const val = getSingleCellValueFromRef(cellRefMatch[1]);
        const value = !isNaN(Number(val)) ? 1 : val === '1' || val === '0' ? 4 : isNaN(Number(val)) ? 2 : 0;
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            display: value.toString(),
            value
          }
        }));
      }
    }
  };


  const handleChange = (key, value) => {
    const [row, col] = key.split(',').map(Number);
    const numValue = parseFloat(value);
    const updatedCells = {
      ...cells,
      [key]: {
        ...(cells[key] || {}),
        display: value,
        value: isNaN(numValue) ? 0 : numValue
      }
    };
    setCells(updatedCells);
    calculateStats(row, col);

    // Recalculate all formula cells when any cell changes
    Object.keys(cells).forEach(cellKey => {
      if (cells[cellKey]?.formula) {
        recalculateFormulas(cellKey);
      }
    });

    if (selectedRange) {
      calculateStats(selectedRange.end.row, selectedRange.end.col);
    }
  };


  const handleCellClick = (cellRef) => {
    setSelectedCell(cellRef);
    setIsEditingCell(false);
    const cell = cells[cellRef] || { value: '', formula: '', display: '' };
    setFormulaBar(cell.formula || cell.value);
  };


  const handleCellDoubleClick = (cellRef) => {
    setSelectedCell(cellRef);
    setIsEditingCell(true);
    const cell = cells[cellRef] || { value: '', formula: '', display: '' };
    setFormulaBar(cell.formula || cell.value);
    setTimeout(() => {
      if (editingCellRef.current) {
        editingCellRef.current.focus();
      }
    }, 0);
  };


  // Add to state declarations

  const formulaBarRef = useRef(null);

  useEffect(() => {
    if (selectedRange && selectedRange.start.row !== selectedRange.end.row) {
      // Range selection: show formula of target cell (below the range)
      const startRow = Math.min(selectedRange.start.row, selectedRange.end.row);
      const endRow = Math.max(selectedRange.start.row, selectedRange.end.row);
      const startCol = Math.min(selectedRange.start.col, selectedRange.end.col);
      const targetCell = coordsToCell(endRow + 1, startCol);
      const cell = cells[targetCell];
      const newValue = cell?.formula || cell?.display || '';
      setFormulaBar(newValue);
    } else if (selectedCell) {
      // Single cell selection: show its formula or value
      const key = getCellKey(selectedCell.row, selectedCell.col);
      const cell = cells[key];
      const newValue = cell?.formula || cell?.display || '';
      setFormulaBar(newValue);
    } else {
      setFormulaBar('');
    }
  }, [selectedCell, selectedRange, cells]);


  const handleFormulaBarChange = (value) => {
    setFormulaBar(value);
    if (selectedCell) {
      handleCellChange(selectedCell, value);
    }
  };




  useEffect(() => {
    if (selectedCell && cells[selectedCell]) {
      const content = cells[selectedCell].formula || cells[selectedCell].value || '';
      setFormulaBar(content);
    } else {
      setFormulaBar('');
    }
  }, [selectedCell, cells]);


  const insertFunction = (funcName) => {
    const newFormula = `=${funcName}()`;
    setFormulaBar(newFormula);
    setShowDropdown(false);
    setSelectedCategory(null);
    handleCellChange(selectedCell, newFormula);
  };




  useEffect(() => {
    if (selectedCell) {
      const key = getCellKey(selectedCell.row, selectedCell.col);
      const cell = cells[key];
      const newValue = cell?.formula || cell?.display || '';
      setFormulaBar(newValue);
    } else {
      setFormulaBar('');
    }
  }, [selectedCell, cells]);

  const formatCell = (styleUpdates) => {
    if (!selectedCell) return;
    setCells(prevCells => {
      const newCells = { ...prevCells };
      if (!newCells[selectedCell]) {
        newCells[selectedCell] = { value: '', formula: '', display: '', style: {} };
      }
      newCells[selectedCell] = {
        ...newCells[selectedCell],
        style: {
          ...newCells[selectedCell].style,
          ...styleUpdates
        }
      };
      return newCells;
    });
  };


  <button
    onClick={() => formatCell({
      whiteSpace: cells[selectedCell]?.style?.whiteSpace === 'normal' ? 'nowrap' : 'normal'
    })}
    className={`p-2 rounded transition-colors ${cells[selectedCell]?.style?.whiteSpace === 'normal' ? 'bg-gray-300' : 'hover:bg-gray-200'
      }`}
    title="Toggle text wrap"
  >
    <WrapText size={16} />
  </button>


  const renderCell = (row, col) => {
    const cellRef = coordsToCell(row, col);
    const cell = cells[cellRef] || { value: '', formula: '', display: '', style: {} };
    const isSelected = selectedCell === cellRef;
    const isInRange = isSelecting && selectedRange.startRow !== null && selectedRange.startCol !== null &&
      row >= Math.min(selectedRange.startRow, selectedRange.endRow) &&
      row <= Math.max(selectedRange.startRow, selectedRange.endRow) &&
      col >= Math.min(selectedRange.startCol, selectedRange.endCol) &&
      col <= Math.max(selectedRange.startCol, selectedRange.endCol);

    return (
      <td
        key={cellRef}
        className={`border border-gray-300 relative ${isSelected ? 'bg-blue-100' : isInRange ? 'bg-blue-50' : ''}`}
        style={{
          width: getColWidth(String.fromCharCode(65 + col)),
          height: getRowHeight(row + 1),
          ...cell.style
        }}
        onClick={(e) => {
          handleCellClick(cellRef);
          handleCellMouseDown(cellRef, e);
        }}
        onDoubleClick={() => handleCellDoubleClick(cellRef)}
        onMouseDown={(e) => handleCellMouseDown(cellRef, e)}
        onMouseMove={(e) => handleCellMouseMove(cellRef, e)}
        onMouseUp={(e) => handleCellMouseUp(e)}
      >
        <input
          ref={isSelected && isEditingCell ? editingCellRef : null}
          className="w-full h-full bg-transparent outline-none"
          value={isSelected && isEditingCell ? formulaBar : cell.display || ''}
          onChange={(e) => {
            setFormulaBar(e.target.value);
            handleCellChange(cellRef, e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsEditingCell(false);
              const [col, rowNum] = cellRef.match(/([A-Z]+)(\d+)/).slice(1);
              const nextRow = parseInt(rowNum) + 1;
              if (nextRow <= ROWS) {
                const nextCell = `${col}${nextRow}`;
                setSelectedCell(nextCell);
                setFormulaBar(cells[nextCell]?.formula || cells[nextCell]?.value || '');
                handleCellClick(nextCell);
              }
            }
          }}
          onBlur={() => setIsEditingCell(false)}
        />
      </td>
    );
  };


  // // In your cell rendering logic (where you create the td elements)
  // const renderCellContent = (cell, cellRef) => {
  //   const isEditing = editingCell === cellRef;
  //   const showValue = showFormulas
  //     ? (cell?.formula || cell?.value || '')
  //     : (cell?.display || cell?.value || '');

  //   if (isEditing) {
  //     return (
  //       <input
  //         type="text"
  //         value={formulaBar}
  //         onChange={(e) => handleFormulaBarChange(e.target.value)}
  //         className="w-full h-full px-2 outline-none bg-white"
  //         autoFocus
  //         onBlur={() => setEditingCell(null)}
  //         onKeyDown={(e) => {
  //           if (e.key === 'Enter') {
  //             setEditingCell(null);
  //           }
  //         }}
  //       />
  //     );
  //   }

  //   return (
  //     <div className="w-full h-full px-2 overflow-hidden">
  //       {showValue}
  //     </div>
  //   );
  // };

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

  const handleHeaderDoubleClick = (type, index) => {
    if (type === 'col') {

      let maxWidth = DEFAULT_COL_WIDTH;

      for (let row = 0; row < ROWS; row++) {
        const cellRef = coordsToCell(row, index);
        const cell = cells[cellRef];
        if (cell?.display) {

          const textWidth = cell.display.length * 10;
          if (textWidth > maxWidth) {
            maxWidth = Math.min(300, textWidth + 10);
          }
        }
      }

      setColWidths(prev => ({ ...prev, [index]: maxWidth }));
    } else {
      // Auto-size row based on content
      let maxHeight = DEFAULT_ROW_HEIGHT;

      for (let col = 0; col < COLS; col++) {
        const cellRef = coordsToCell(index, col);
        const cell = cells[cellRef];
        if (cell?.display) {
          // Count lines if wrapping is enabled
          const lines = cell.style?.whiteSpace === 'normal'
            ? Math.ceil(cell.display.length / 20)
            : 1;
          const height = lines * DEFAULT_ROW_HEIGHT;
          if (height > maxHeight) {
            maxHeight = Math.min(200, height);
          }
        }
      }

      setRowHeights(prev => ({ ...prev, [index]: maxHeight }));
    }
  };



  const importCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const rows = csv.trim().split('\n');
      const newCells = {};

      rows.forEach((row, rowIndex) => {
        const columns = row.split(',');
        columns.forEach((value, colIndex) => {
          if (rowIndex < ROWS && colIndex < COLS) {
            const key = `${rowIndex},${colIndex}`;
            const trimmed = value.trim();
            newCells[key] = {
              value: trimmed,
              display: trimmed,
              formula: ''
            };
          }
        });
      });

      setCells((prev) => ({ ...prev, ...newCells }));
    };

    reader.readAsText(file);
  };



  const addSheet = () => {
    const newId = Math.max(...sheets.map(s => s.id)) + 1;
    setSheets(prev => [...prev, { id: newId, name: `Sheet${newId}`, active: false }]);
  };

  const switchSheet = (sheetId) => {
    setSheets(prev =>
      prev.map(sheet => ({ ...sheet, active: sheet.id === sheetId }))
    );
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


  function handleSpellCheck(setNotification, documentText) {

    setNotification('Starting spell check...');


    const dictionary = ['apple', 'banana', 'document', 'check', 'example'];


    const words = documentText.split(/\s+/);
    const errors = [];


    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?]/g, '');
      if (cleanWord.length > 0 && !dictionary.includes(cleanWord)) {
        errors.push({
          word,
          position: index,
          suggestions: getSuggestions(cleanWord, dictionary)
        });
      }
    });


    if (errors.length === 0) {
      setNotification('Spell check complete - no errors found');
    } else {
      setNotification(`Found ${errors.length} errors. ${errors.length > 10 ? 'First 10 shown' : ''}`);
      console.log('Spelling errors:', errors.slice(0, 10));
      return errors; // Return errors for highlighting
    }
  }



  // function handleSortRange(selectedRange, setCells) {
  //   if (!selectedRange) {
  //     console.error("No range selected");
  //     return;
  //   }

  //   // Get all cells in the selected range
  //   const rangeCells = Object.entries(cells).filter(([key]) => {
  //     const [row, col] = key.split('-').map(Number);
  //     return (
  //       row >= selectedRange.startRow &&
  //       row <= selectedRange.endRow &&
  //       col >= selectedRange.startCol &&
  //       col <= selectedRange.endCol
  //     );
  //   });

  //   // Sort by the first column in the range
  //   const sortColumn = selectedRange.startCol;

  //   rangeCells.sort((a, b) => {
  //     const [keyA] = a;
  //     const [keyB] = b;
  //     const [rowA] = keyA.split('-').map(Number);
  //     const [rowB] = keyB.split('-').map(Number);

  //     const cellA = cells[`${rowA}-${sortColumn}`]?.value;
  //     const cellB = cells[`${rowB}-${sortColumn}`]?.value;

  //     // Numeric comparison
  //     if (!isNaN(cellA) && !isNaN(cellB)) {
  //       return Number(cellA) - Number(cellB);
  //     }

  //     // String comparison
  //     return String(cellA).localeCompare(String(cellB));
  //   });

  //   // Rebuild the cells object with new order
  //   const newCells = { ...cells };
  //   let newRowIndex = selectedRange.startRow;

  //   rangeCells.forEach(([key, cellData]) => {
  //     const [oldRow, col] = key.split('-').map(Number);
  //     const newKey = `${newRowIndex}-${col}`;

  //     if (newKey !== key) {
  //       newCells[newKey] = { ...cellData };
  //       delete newCells[key];
  //     }

  //     newRowIndex++;
  //   });

  //   setCells(newCells);
  // }



  const loadFromStorage = () => {
    try {
      const savedData = localStorage.getItem('spreadsheetData');
      if (savedData) {
        const data = JSON.parse(savedData);
        setCells(data.cells || {});
        setSheetName(data.sheetName || 'Untitled spreadsheet');
        setHistory(data.history || [{}]);
        setHistoryIndex(data.historyIndex || 0);
        showNotification('Spreadsheet loaded from storage');
      }
    } catch (error) {
      console.error('Load failed:', error);
      showNotification('Error: Could not load saved data');
    }
  };

  // Call this in useEffect when component mounts
  useEffect(() => {
    loadFromStorage();
  }, []);
  const handleSave = async () => {
    try {
      // Convert cells data to CSV format
      const csvData = convertToCSV(cells);

      // Check if File System Access API is available (Chrome/Edge)
      if ('showSaveFilePicker' in window) {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: `${sheetName}.csv`,
          types: [{
            description: 'CSV Files',
            accept: { 'text/csv': ['.csv'] },
          }],
        });

        // Write CSV content to the selected file
        const writableStream = await fileHandle.createWritable();
        await writableStream.write(csvData);
        await writableStream.close();

        showNotification(`Saved as "${fileHandle.name}"`);
      } else {
        // Fallback for browsers without File System Access API
        downloadCSV(csvData, `${sheetName}.csv`);
        showNotification(`Downloaded "${sheetName}.csv"`);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Save failed:', error);
        showNotification('Error: Could not save file');
      }
    }
  };
  const convertToCSV = (cells) => {
    const ROWS = 100;
    const COLS = 26;
    let csvContent = '';

    // Build header row (A, B, C, ...)
    const headers = Array.from({ length: COLS }, (_, i) =>
      String.fromCharCode(65 + i)
    );
    csvContent += headers.join(',') + '\n';

    // Build data rows
    for (let row = 1; row <= ROWS; row++) {
      const rowData = [];
      for (let col = 0; col < COLS; col++) {
        const cellRef = `${String.fromCharCode(65 + col)}${row}`;
        const cellValue = cells[cellRef]?.display || cells[cellRef]?.value || '';
        // Escape CSV special characters (comma, quotes, newlines)
        rowData.push(`"${cellValue.toString().replace(/"/g, '""')}"`);
      }
      csvContent += rowData.join(',') + '\n';
    }

    return csvContent;
  };

  const downloadCSV = (csvData, filename) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [findReplace, setFindReplace] = useState({
    show: false,
    find: '',
    replace: '',
    matchCase: false,
    results: [],
    currentIndex: 0
  });

  const handleFindReplace = (action) => {
    if (action === 'find') {
      const results = Object.keys(cells).filter((key) => {
        const value = cells[key]?.display || cells[key] || '';
        const search = findReplace.find;
        return findReplace.matchCase
          ? value.includes(search)
          : value.toLowerCase().includes(search.toLowerCase());
      });

      setFindReplace((prev) => ({
        ...prev,
        results,
        currentIndex: 0
      }));

      if (results.length > 0) {
        setSelectedCell(results[0]);
      }
    }

    // Optional: replace logic
  };




  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  const handleInputChange = async (value) => {
    setCurrentInput(value);
    const cellKey = getCellKey(selectedCell.row, selectedCell.col);

    // Check if the input is a URL
    if (isValidUrl(value)) {
      setIsLoadingLink(true);
      try {
        const title = await fetchPageTitle(value);
        setCells(prev => ({
          ...prev,
          [cellKey]: {
            value: title,
            type: 'link',
            url: value,
            displayText: title
          }
        }));
        setCurrentInput(title);
      } catch (error) {
        setCells(prev => ({
          ...prev,
          [cellKey]: { value, type: 'text' }
        }));
      }
      setIsLoadingLink(false);
    } else {
      setCells(prev => ({
        ...prev,
        [cellKey]: { ...prev[cellKey], value, type: 'text' }
      }));
    }
  };
  const insertLink = () => {
    if (!selectedCell || !linkText) {
      showNotification('Link text cannot be empty');
      return;
    }

    // Add https:// if missing
    let finalUrl = linkUrl;
    if (linkUrl && !/^https?:\/\//i.test(linkUrl)) {
      finalUrl = `https://${linkUrl}`;
    }

    setCells(prev => ({
      ...prev,
      [selectedCell]: {
        ...prev[selectedCell],
        type: 'link',
        value: linkText,
        display: linkText,
        url: finalUrl,
        style: prev[selectedCell]?.style || {}
      }
    }));

    setShowLinkDialog(false);
    showNotification('Link inserted successfully');
  };
  const removeLink = (row, col) => {
    const cellKey = getCellKey(row, col);
    const currentCell = cells[cellKey];
    setCells(prev => ({
      ...prev,
      [cellKey]: { value: currentCell.displayText || currentCell.value, type: 'text' }
    }));
  };

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const applyValidation = () => {
    const { cell, type, condition, min, max, list, customFormula, inputMessage, errorMessage } = validationDialog;

    let validator;

    switch (type) {
      case 'number':
        validator = (value) => {
          const num = parseFloat(value);
          if (isNaN(num)) return false;

          switch (condition) {
            case 'between':
              return num >= parseFloat(min) && num <= parseFloat(max);
            case 'greater':
              return num > parseFloat(min);
            case 'less':
              return num < parseFloat(min);
            case 'equal':
              return num === parseFloat(min);
            case 'notEqual':
              return num !== parseFloat(min);
            default:
              return true;
          }
        };
        break;

      case 'list':
        const items = list.split(',').map(item => item.trim());
        validator = (value) => items.includes(value);
        break;

      case 'custom':
        validator = (value) => {
          try {
            // This is a simplified implementation - you'd need a proper formula evaluator
            return eval(customFormula.replace(/=/g, '').replace(/value/g, value));
          } catch {
            return false;
          }
        };
        break;

      default:
        validator = () => true;
    }

    setValidations(prev => ({
      ...prev,
      [cell]: {
        validator,
        inputMessage,
        errorMessage
      }
    }));

    setNotification(`Validation rules set for ${cell}`);
    setValidationDialog({ ...validationDialog, show: false });
  };
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }




  const handleCopy = () => {
    if (!selectedCell && !selectedRange) {
      showNotification('No cell or range selected');
      return;
    }

    let copiedData = {};

    if (selectedRange) {
      const startRow = Math.min(selectedRange.start.row, selectedRange.end.row);
      const endRow = Math.max(selectedRange.start.row, selectedRange.end.row);
      const startCol = Math.min(selectedRange.start.col, selectedRange.end.col);
      const endCol = Math.max(selectedRange.start.col, selectedRange.end.col);

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const key = getCellKey(r, c);
          copiedData[key] = {
            value: cells[key]?.value || '',
            display: cells[key]?.display || '',
            style: cellStyles[key] || {}
          };
        }
      }
    } else {
      const key = getCellKey(selectedCell.row, selectedCell.col);
      copiedData[key] = {
        value: cells[key]?.value || '',
        display: cells[key]?.display || '',
        style: cellStyles[key] || {}
      };
    }

    setClipboard(copiedData);
    showNotification('Copied to clipboard');
  };


    const handlePaste = () => {
    if (!clipboard || !selectedCell) {
      showNotification('Nothing to paste or no cell selected');
      return;
    }

    const newCells = { ...cells };
    const newStyles = { ...cellStyles };
    const startRow = selectedCell.row;
    const startCol = selectedCell.col;

    // Get the dimensions of the copied data
    const copiedKeys = Object.keys(clipboard);
    const rows = copiedKeys.map(key => parseInt(key.split(',')[0]));
    const cols = copiedKeys.map(key => parseInt(key.split(',')[1]));
    const minRow = Math.min(...rows);
    const minCol = Math.min(...cols);

    // Iterate over each cell in the copied data
    copiedKeys.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const relativeRow = r - minRow;
      const relativeCol = c - minCol;
      const newRow = startRow + relativeRow;
      const newCol = startCol + relativeCol;
      const newKey = getCellKey(newRow, newCol);

      // Skip if the target cell is outside the spreadsheet bounds
      if (newRow >= ROWS || newCol >= COLS) {
        return;
      }

      // Validate cell if validation exists
      if (validations[newKey]) {
        if (!validateCell(newKey, clipboard[key].value)) {
          return;
        }
      }

      // Paste the cell data
      newCells[newKey] = {
        ...newCells[newKey],
        value: clipboard[key].value || '',
        display: clipboard[key].display || '',
        formula: clipboard[key].formula || '' // Preserve formula if present
      };

      // Paste the cell styles
      newStyles[newKey] = {
        ...newStyles[newKey],
        ...clipboard[key].style
      };
    });

    setCells(newCells);
    setCellStyles(newStyles);
    addToHistory(newCells, newStyles);
    showNotification('Pasted successfully');
  };

  const handleCut = () => {
    if (selectedCell && cells[selectedCell] !== undefined) {
      const val = typeof cells[selectedCell] === 'object'
        ? cells[selectedCell].display || ''
        : cells[selectedCell];

      setCopiedValue(val); // reuse the copy buffer

      const newCells = { ...cells };
      if (typeof newCells[selectedCell] === 'object') {
        newCells[selectedCell] = { ...newCells[selectedCell], display: '' };
      } else {
        newCells[selectedCell] = '';
      }

      setCells(newCells);
    }
  };
  
  const getActiveCell = () => {
    if (!selectedCell) return null;
    return {
      setValue: (val) => {
        setCells(prev => ({ ...prev, [selectedCell]: val }));
      },
      getValue: () => cells[selectedCell] || ''
    };
  };

  const runScript = () => {
    try {
      const script = scriptEditor.scripts.find(s => s.id === scriptEditor.activeScriptId);
      const func = new Function("getActiveCell", script.code);
      func(getActiveCell);
      showNotification("Script executed successfully");
    } catch (err) {
      showNotification("Script Error: " + err.message, { type: 'error' });
    }
  };







  const insertRow = (position) => {
    if (!selectedCell) return;

    const [rowStr] = selectedCell.split(',');
    const targetRow = parseInt(rowStr, 10);
    const insertAt = position === 'above' ? targetRow : targetRow + 1;

    const newCells = {};
    const newStyles = {};

    for (let r = ROWS - 1; r >= insertAt; r--) {
      for (let c = 0; c < COLS; c++) {
        const oldKey = `${r - 1},${c}`;
        const newKey = `${r},${c}`;
        if (cells[oldKey]) newCells[newKey] = cells[oldKey];
        if (cellStyles[oldKey]) newStyles[newKey] = cellStyles[oldKey];
      }
    }

    // Copy cells above the inserted row
    for (let r = 0; r < insertAt; r++) {
      for (let c = 0; c < COLS; c++) {
        const key = `${r},${c}`;
        if (cells[key]) newCells[key] = cells[key];
        if (cellStyles[key]) newStyles[key] = cellStyles[key];
      }
    }

    // Clear the new row
    for (let c = 0; c < COLS; c++) {
      const key = `${insertAt},${c}`;
      newCells[key] = '';
      newStyles[key] = {};
    }

    setCells(newCells);
    setCellStyles(newStyles);
    showNotification('Row inserted');
  };



  const insertColumn = (position) => {
    if (!selectedCell) return;

    const [, colStr] = selectedCell.split(',');
    const targetCol = parseInt(colStr, 10);
    const insertAt = position === 'left' ? targetCol : targetCol + 1;

    const newCells = {};
    const newStyles = {};

    for (let r = 0; r < ROWS; r++) {
      for (let c = COLS - 1; c >= insertAt; c--) {
        const oldKey = `${r},${c - 1}`;
        const newKey = `${r},${c}`;
        if (cells[oldKey]) newCells[newKey] = cells[oldKey];
        if (cellStyles[oldKey]) newStyles[newKey] = cellStyles[oldKey];
      }
    }

    // Copy cells left of inserted column
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < insertAt; c++) {
        const key = `${r},${c}`;
        if (cells[key]) newCells[key] = cells[key];
        if (cellStyles[key]) newStyles[key] = cellStyles[key];
      }
    }

    // Clear the inserted column
    for (let r = 0; r < ROWS; r++) {
      const key = `${r},${insertAt}`;
      newCells[key] = '';
      newStyles[key] = {};
    }

    setCells(newCells);
    setCellStyles(newStyles);
    showNotification('Column inserted');
  };


  const toggleFilter = () => {
    setFilterActive(!filterActive);
    showNotification(filterActive ? 'Filter removed' : 'Filter applied');
  };
  const handleZoomIn = () => setZoom(Math.min(200, zoom + 25));
  const handleZoomOut = () => setZoom(Math.max(50, zoom - 25));
  const toggleFormulas = () => {
    setShowFormulas(!showFormulas);
    setNotification(`Formulas ${!showFormulas ? 'shown' : 'hidden'}`);
  };
  const restoreVersion = (index) => {
    if (index < 0 || index >= history.length) return;

    const version = history[index];
    setCells(version.cells || {});
    setHistoryIndex(index);
    setShowHistory(false);
    showNotification(`Restored version ${index + 1}`);
  };
  const [showGridlines, setShowGridlines] = useState(true);
  useEffect(() => {
    console.log('Current gridlines state:', showGridlines);
  }, [showGridlines]);
  const toggleGridlines = () => {
    setShowGridlines(prev => !prev);
  };

  const generatePivotTable = (cells, startPosition) => {
    const pivotData = {};

    // Get column letters (assuming data starts from column A)
    const valueCol = 'B'; // Column with values to sum
    const categoryCol = 'A'; // Column with categories

    // Analyze data (assuming data starts from row 2)
    for (let row = 2; row <= 100; row++) {
      const categoryCell = `${categoryCol}${row}`;
      const valueCell = `${valueCol}${row}`;

      if (cells[categoryCell] && cells[valueCell]) {
        const category = cells[categoryCell].display || cells[categoryCell].value;
        const value = parseFloat(cells[valueCell].display || cells[valueCell].value) || 0;

        if (category) {
          pivotData[category] = (pivotData[category] || 0) + value;
        }
      }
    }

    return pivotData;
  };
  const handleLinkInsert = () => {
    if (!selectedCell) {
      showNotification("Please select a cell first");
      return;
    }

    const url = prompt("Enter the URL:");
    if (!url) return;

    const text = prompt("Enter the display text:", "Click Here");
    const link = `<a href="${url}" target="_blank">${text}</a>`;

    setCells((prev) => ({
      ...prev,
      [selectedCell]: {
        ...(prev[selectedCell] || {}),
        value: link,
        display: text, // Display text only
        isLink: true,
        url
      }
    }));
  };

  const menuItems = {
    File: [
      {
        icon: FileText,
        label: 'New',
        action: () => {
          addSheet();
          setNotification('New spreadsheet created');
        },
        shortcut: 'Ctrl+N'
      },
      {
        icon: Folder,
        label: 'Open',
        action: () => fileInputRef.current?.click(),
        shortcut: 'Ctrl+O'
      },
      {
        icon: Save,
        label: 'Save',
        action: handleSave,
        shortcut: 'Ctrl+S'
      },
      {
        icon: Download,
        label: 'Download as CSV',
        action: exportToCSV
      },
      {
        icon: Share2,
        label: 'Share',
        action: () => {
          if (navigator.share) {
            navigator.share({
              title: sheetName,
              text: 'Check out this spreadsheet',
              url: window.location.href
            }).catch(console.error);
          } else {
            setShowShareDropdown(!showShareDropdown);
          }
        }
      },
      {
        icon: Clock,
        label: 'Version history',
        action: () => {
          setShowHistory(true);
          showNotification(`Loaded ${history.length} versions`);
        },
        shortcut: 'Ctrl+H'
      }
    ],
    Edit: [
      {
        icon: Undo2,
        label: 'Undo',
        action: handleUndo,
        shortcut: 'Ctrl+Z',
        disabled: historyIndex === 0
      },
      {
        icon: Redo2,
        label: 'Redo',
        action: handleRedo,
        shortcut: 'Ctrl+Y',
        disabled: historyIndex === history.length - 1
      },
      {
        icon: Scissors, // or another suitable icon
        label: 'Cut',
        action: handleCut,
        shortcut: 'Ctrl+X',
        disabled: !selectedCell || cells[selectedCell] === undefined
      },
      {
        icon: Copy,
        label: 'Copy',
        action: handleCopy,
        shortcut: 'Ctrl+C',
        disabled: !selectedCell || !cells[selectedCell]
      },
      {
        icon: Clipboard,
        label: 'Paste',
        action: handlePaste,
        shortcut: 'Ctrl+V',
        disabled: !clipboard
      }
      ,
      {
        icon: Search,
        label: 'Find and replace',
        action: () => setFindReplace({
          show: true,
          find: '',
          replace: '',
          matchCase: false,
          results: [],
          currentIndex: 0
        }),
        shortcut: 'Ctrl+F'
      },
      {
        icon: Trash2,
        label: 'Delete',
        action: () => {
          if (selectedCell) {
            handleCut();
            setNotification('Cell content deleted');
          } else {
            setNotification('No cell selected');
          }
        },
        shortcut: 'Delete'
      }
    ],
    View: [
      {
        icon: Grid3X3,
        label: showGridlines ? 'Hide gridlines' : 'Show gridlines',
        action: toggleGridlines,
        className: showGridlines ? 'bg-blue-100' : ''
      },
      {
        icon: Eye,
        label: showFormulas ? 'Hide formulas' : 'Show formulas',
        action: toggleFormulas,
        shortcut: 'Ctrl+`'
      },
      {
        icon: ZoomIn,
        label: 'Zoom in',
        action: handleZoomIn,
        shortcut: 'Ctrl+Plus'
      },
      {
        icon: ZoomOut,
        label: 'Zoom out',
        action: handleZoomOut,
        shortcut: 'Ctrl+-'
      },
      {
        icon: Maximize,
        label: 'Full screen',
        action: () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        },
        shortcut: 'F11'
      }
    ],
    Insert: [
      {
        icon: Plus,
        label: 'Insert row above',
        action: () => {
          if (selectedCell) {
            insertRow('above');
          } else {
            showNotification('Please select a cell first');
          }
        },
        shortcut: 'Ctrl+Shift++',
        disabled: !selectedCell
      }
      ,
      {
        icon: Plus,
        label: 'Insert column left',
        action: () => {
          if (selectedCell) {
            insertColumn('left');
          } else {
            showNotification('Please select a cell first', { type: 'error' });
          }
        },
        shortcut: 'Ctrl+Shift+]',
        disabled: !selectedCell
      },
      {
        icon: BarChart3,
        label: 'Chart',
        action: handleGenerateChart
      },
      {
        icon: Image,
        label: 'Image',
        action: handleImageInsert
      },
      {
        icon: Link2,
        label: 'Link',
        action: handleLinkInsert,
        shortcut: 'Ctrl+K'
      }
    ],
    Format: [
      {
        icon: Bold,
        label: 'Bold',
        action: toggleBold,
        shortcut: 'Ctrl+B',
        active: selectedCell && cells[selectedCell]?.style?.fontWeight === 'bold'
      },
      {
        icon: Italic,
        label: 'Italic',
        action: toggleItalic,
        shortcut: 'Ctrl+I',
        active: selectedCell && cells[selectedCell]?.style?.fontStyle === 'italic'
      },
      {
        icon: Underline,
        label: 'Underline',
        action: toggleUnderline,
        shortcut: 'Ctrl+U',
        active: selectedCell && cells[selectedCell]?.style?.textDecoration === 'underline'
      },
      {
        icon: AlignLeft,
        label: 'Align left',
        action: alignLeft,
        active: selectedCell && cells[selectedCell]?.style?.textAlign === 'left'
      },
      {
        icon: AlignCenter,
        label: 'Align center',
        action: alignCenter,
        active: selectedCell && cells[selectedCell]?.style?.textAlign === 'center'
      },
      {
        icon: AlignRight,
        label: 'Align right',
        action: alignRight,
        active: selectedCell && cells[selectedCell]?.style?.textAlign === 'right'
      },
      {
        icon: Palette,
        label: 'Fill color',
        action: () => {
          if (selectedCell) {
            setShowColorPicker({
              show: true,
              cell: selectedCell,
              type: 'background'
            });
          }
        }
      },
      {
        icon: WrapText,
        label: 'Wrap text',
        action: () => {
          if (selectedCell) {
            const currentCell = cells[selectedCell];
            const isCurrentlyWrapped = currentCell?.style?.whiteSpace === 'normal';

            formatCell({
              whiteSpace: isCurrentlyWrapped ? 'nowrap' : 'normal'
            });

            setNotification(
              isCurrentlyWrapped
                ? 'Text unwrapped'
                : 'Text wrapped'
            );
          } else {
            setNotification('Please select a cell first');
          }
        },
        active: selectedCell && cells[selectedCell]?.style?.whiteSpace === 'normal',
        shortcut: 'Ctrl+Shift+W'
      }
    ],
    Data: [
      {
        icon: ArrowUpDown,
        label: 'Sort',
        submenu: [
          {
            icon: ArrowUp,
            label: 'A → Z (Ascending)',
            action: () => {
              if (!selectedRange) {
                showNotification('Please select a range first (Shift+Click)');
                return;
              }
              handleSort(selectedRange, 'asc');
            },
            shortcut: 'Alt+Shift+A'
          },
          {
            icon: ArrowDown,
            label: 'Z → A (Descending)',
            action: () => {
              if (!selectedRange) {
                showNotification('Please select a range first (Shift+Click)');
                return;
              }
              handleSort(selectedRange, 'desc');
            },
            shortcut: 'Alt+Shift+Z'
          },
          {
            icon: Settings,
            label: 'Custom sort...',
            action: () => {
              if (!selectedRange) {
                showNotification('Please select a range first (Shift+Click)');
                return;
              }
              setSortDialog({
                show: true,
                range: selectedRange,
                sortBy: 'A',
                order: 'asc',
                hasHeader: true
              });
            }
          }
        ]
      },
      {
        icon: Filter,
        label: filterActive ? 'Remove filter' : 'Create filter',
        action: toggleFilter
      },
      {
        icon: Shield,
        label: 'Data validation',
        action: () => {
          if (!selectedCell) {
            setNotification('Please select a cell first');
            return;
          }
          setValidationDialog({
            show: true,
            cell: selectedCell,
            type: 'number',
            condition: 'between',
            min: '',
            max: '',
            list: '',
            customFormula: '',
            inputMessage: '',
            errorMessage: 'Invalid input'
          });
        }
      },
      {
        icon: Table,
        label: 'Pivot table',
        action: () => {
          if (!selectedCell) {
            setNotification('Please select a cell first to define the pivot table location');
            return;
          }
          const col = selectedCell.replace(/\d+/g, '');
          const row = parseInt(selectedCell.match(/\d+$/)[0]);
          const pivotTableData = generatePivotTable(cells, { row, col });

          setCells(prev => {
            const newCells = { ...prev };
            newCells[`${col}${row}`] = { value: 'Category', display: 'Category' };
            newCells[`${String.fromCharCode(col.charCodeAt(0) + 1)}${row}`] = {
              value: 'Sum',
              display: 'Sum'
            };

            Object.entries(pivotTableData).forEach(([category, sum], index) => {
              const currentRow = row + index + 1;
              newCells[`${col}${currentRow}`] = { value: category, display: category };
              newCells[`${String.fromCharCode(col.charCodeAt(0) + 1)}${currentRow}`] = {
                value: sum.toString(),
                display: sum.toString()
              };
            });

            return newCells;
          });

          setNotification('Pivot table created');
        }
      }
    ],
    Tools: [
      {
        icon: Settings,
        label: 'Spell check',
        action: startSpellCheck,
        shortcut: 'F7'
      },
      {
        icon: Mail,
        label: 'Notifications',
        action: () => setShowNotifications(!showNotifications),
        render: (
          <div className="relative">
            <Mail size={16} />
            {notifications.some(n => !n.read) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </div>
        )
      },
      {
        icon: Calculator,
        label: 'Script Editor',
        action: () => setScriptEditor(prev => ({ ...prev, isOpen: true })),
        shortcut: 'Alt+Shift+X'
      }
    ],
    Extensions: [
      {
        icon: Puzzle,
        label: 'Add-ons',
        action: () => setShowAddonsMenu(true)
      }
    ],
    Help: [
      {
        icon: HelpCircle,
        label: 'Help',
        action: () => window.open('https://support.google.com/docs/answer/6000292', '_blank'),
        shortcut: 'F1'
      },
      {
        icon: Keyboard,
        label: 'Keyboard shortcuts',
        action: () => {
          setNotification(`
          Common shortcuts:
          Ctrl+C - Copy
          Ctrl+V - Paste
          Ctrl+Z - Undo
          Ctrl+Y - Redo
          Ctrl+F - Find
        `);
        },
        shortcut: 'Ctrl+/'
      },
      {
        icon: BookOpen,
        label: 'Training',
        action: () => window.open('https://support.google.com/a/users/answer/9282664', '_blank')
      }
    ]
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      } else if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, handlePaste, selectedCell, selectedRange, cells, cellStyles, clipboard, validations]);

  function handleImageUpload(setNotification) {
    return new Promise((resolve) => {
      // Create file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none'; // Hide the input element

      // Add to DOM temporarily
      document.body.appendChild(input);

      input.onchange = async (e) => {
        const file = e.target.files[0];

        if (!file) {
          setNotification('No file selected');
          document.body.removeChild(input);
          return resolve(null);
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          setNotification('Please select an image file (JPEG, PNG, etc.)');
          document.body.removeChild(input);
          return resolve(null);
        }

        try {
          // Create preview URL
          const imageUrl = URL.createObjectURL(file);

          setNotification(`Image loaded: ${file.name}`);

          // Return both URL and file data
          resolve({
            url: imageUrl,
            file: file,
            name: file.name,
            size: file.size,
            type: file.type
          });

        } catch (error) {
          console.error('Upload error:', error);
          setNotification('Failed to load image');
          resolve(null);
        } finally {
          // Clean up
          document.body.removeChild(input);
        }
      };

      // Trigger file dialog
      input.click();
    });
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const ctrlKey = e.ctrlKey || e.metaKey; // Support both Ctrl and Cmd

      if (ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'x':
            e.preventDefault();
            handleCut();
            break;
          case 'c':
            e.preventDefault();
            handleCopy();
            break;
          case 'v':
            e.preventDefault();
            handlePaste();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, clipboard, cells]);

  {/* Calculate Stats Function */ }
  const calculateStats = () => {
    if (!selectedRange) {
      return { sum: 0, avg: 0, count: 0, min: 0, max: 0 };
    }

    const { start, end } = selectedRange;
    const startRow = Math.min(start.row, end.row);
    const endRow = Math.max(start.row, end.row);
    const startCol = Math.min(start.col, end.col);
    const endCol = Math.max(start.col, end.col);

    let sum = 0;
    let count = 0;
    const values = [];

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const key = `${row},${col}`; // Directly use row,col format
        const cell = cells[key];
        const value = cell?.display || cell?.value || '';
        const num = parseFloat(value);
        if (!isNaN(num)) {
          sum += num;
          count += 1;
          values.push(num);
        }
      }
    }

    const avg = count > 0 ? sum / count : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;

    return { sum, avg, count, min, max };
  };

  {/* Update Stats with useEffect */ }
  useEffect(() => {
    setStats(calculateStats());
  }, [selectedRange, cells]);

 const handledashboard = () => {
    navigate("/dashboard");
  };

  

  return (
    <div className="w-full h-screen bg-white flex flex-col font-sans text-gray-800">
      {/* Main App Container */}
      <div className="flex flex-col h-full">
        {/* Top Toolbar */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-1 flex justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent ">Strix Sheets</div>
        
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 mr-25 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md shadow-sm transition-colors"
          >
            <LogOut size={10} />
            Logout
          </button>
        </div>

          <div className="flex items-start gap-1 ">
            {Object.keys(menuItems).map((menuName) => (
              <div
                key={menuName}
                className="relative"
                onMouseEnter={() => handleMenuEnter(menuName)}
                onMouseLeave={handleMenuLeave}
              >
                <button
                  className={`px-3 py-2 rounded hover:bg-gray-200 ${activeMenu === menuName ? 'bg-gray-200' : ''
                    }`}
                >
                  {menuName}
                </button>

                {activeMenu === menuName && (
                  <div
                    ref={menuRef}
                    className="absolute left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-48 py-1"
                    onMouseEnter={() => handleMenuEnter(menuName)}
                    onMouseLeave={handleMenuLeave}
                  >
                    {menuItems[menuName].map((item, index) => (
                      <div
                        key={index}
                        className="relative"
                        onMouseEnter={() => handleItemEnter(item)}
                        onMouseLeave={() => {
                          timeoutRef.current = setTimeout(() => {
                            setHoveredItem(null);
                          }, 200);
                        }}
                      >
                        <button
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left ${item.disabled
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100'
                            } ${item.active ? 'bg-blue-50 text-blue-700' : ''}`}
                          onClick={() => {
                            if (!item.disabled && !item.submenu) {
                              item.action();
                              setActiveMenu(null);
                            }
                          }}
                          disabled={item.disabled}
                        >
                          {item.icon && (
                            <item.icon
                              size={16}
                              className={`flex-shrink-0 ${item.active ? 'text-blue-600' : 'text-gray-500'
                                }`}
                            />
                          )}
                          <span className="flex-grow">{item.label}</span>
                          {item.shortcut && (
                            <span className="text-xs text-gray-400 ml-2">
                              {item.shortcut}
                            </span>
                          )}
                          {item.submenu && (
                            <ChevronRight size={16} className="text-gray-400" />
                          )}
                        </button>

                        {item.submenu && hoveredItem === item && (
                          <div
                            className="absolute left-full top-0 ml-0.5 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-48 py-1"
                            onMouseEnter={() => handleItemEnter(item)}
                            onMouseLeave={() => {
                              timeoutRef.current = setTimeout(() => {
                                setHoveredItem(null);
                              }, 200);
                            }}
                          >
                            {item.submenu.map((subItem, subIndex) => (
                              <button
                                key={subIndex}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left ${subItem.disabled
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                onClick={() => {
                                  if (!subItem.disabled) {
                                    subItem.action();
                                    setActiveMenu(null);
                                    setHoveredItem(null);
                                  }
                                }}
                                disabled={subItem.disabled}
                              >
                                {subItem.icon && (
                                  <subItem.icon
                                    size={16}
                                    className="flex-shrink-0 text-gray-500"
                                  />
                                )}
                                <span className="flex-grow">{subItem.label}</span>
                                {subItem.shortcut && (
                                  <span className="text-xs text-gray-400 ml-2">
                                    {subItem.shortcut}
                                  </span>
                                )}
                              </button>

                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

        {/* Formatting Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1 flex-wrap">
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className={`p-1.5 rounded-md ${historyIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              title="Undo (Ctrl+Z)"
            >
              <Undo size={18} className="text-gray-700" />
            </button>


            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className={`p-1.5 rounded-md ${historyIndex === history.length - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              title="Redo (Ctrl+Y)"
            >
              <Redo size={18} className="text-gray-700" />
            </button>
          </div>

          {/* Text Formatting */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
            <button onClick={toggleBold} className="p-1 hover:bg-gray-200 rounded">
              <Bold size={18} />
            </button>
            <button onClick={toggleItalic} className="p-1 hover:bg-gray-200 rounded">
              <Italic size={18} />
            </button>
            <button onClick={toggleUnderline} className="p-1 hover:bg-gray-200 rounded">
              <Underline size={18} />
            </button>

          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">

            <button onClick={alignLeft} className="p-1 hover:bg-gray-200 rounded">
              <AlignLeft size={18} />
            </button>
            <button onClick={alignCenter} className="p-1 hover:bg-gray-200 rounded">
              <AlignCenter size={18} />
            </button>
            <button onClick={alignRight} className="p-1 hover:bg-gray-200 rounded">
              <AlignRight size={18} />
            </button>


          </div>

          {/* Number Formatting */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
            <button
              className="p-1.5 rounded-md hover:bg-gray-100"
              title="Currency Format"
            >
              <DollarSign size={18} />
            </button>
            <button
              className="p-1.5 rounded-md hover:bg-gray-100"
              title="Percentage Format"
            >
              <Percent size={18} />
            </button>
          </div>

          {/* Formula Button */}
          <div style={{ position: "relative", display: "inline-block", marginLeft: "10px" }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              <FunctionSquare size={16} />
              Function ▾
            </button>
            {showDropdown && (
              <div className="absolute left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-64 py-2 max-h-96 overflow-y-auto">
                <input
                  type="text"
                  placeholder="Search functions..."
                  className="w-full px-4 py-2 text-sm border-b border-gray-200 focus:outline-none"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  value={searchTerm}
                />
                {[
                  {
                    name: 'Math',
                    functions: [
                      'ABS', 'ACOS', 'ASIN', 'ATAN', 'ATAN2', 'CEILING', 'COS', 'DEGREES',
                      'EXP', 'FACT', 'FLOOR', 'GCD', 'LCM', 'LN', 'LOG', 'LOG10', 'MAX',
                      'MIN', 'MOD', 'PI', 'POWER', 'PRODUCT', 'RADIANS', 'RAND', 'RANDBETWEEN',
                      'ROUND', 'ROUNDDOWN', 'ROUNDUP', 'SIGN', 'SIN', 'SQRT', 'SUM',
                      'SUMPRODUCT', 'TAN', 'TANRADIAN', 'TRUNC'
                    ]
                  },
                  {
                    name: 'Financial',
                    functions: ['FV', 'PV', 'NPV', 'PMT', 'IPMT', 'PPMT', 'NPER', 'RATE',
                      'IRR', 'MIRR', 'SLN', 'SYD', 'DB', 'DDB', 'VDB']
                  },
                  {
                    name: 'Date',
                    functions: [
                      'NOW', 'TODAY', 'DATE', 'DATEVALUE', 'DAY', 'DAYS', 'DAYS360',
                      'EDATE', 'EOMONTH', 'HOUR', 'MINUTE', 'MONTH', 'NETWORKDAYS',
                      'SECOND', 'TIME', 'TIMEVALUE', 'WEEKDAY', 'WEEKNUM',
                      'WORKDAY', 'YEAR', 'YEARFRAC'
                    ]
                  },
                  {
                    name: 'Text',
                    functions: [
                      'CHAR', 'CLEAN', 'CODE', 'CONCATENATE', 'EXACT', 'FIND', 'LEFT',
                      'LEN', 'LOWER', 'MID', 'PROPER', 'REPLACE', 'REPT', 'RIGHT',
                      'SEARCH', 'SUBSTITUTE', 'T', 'TEXT', 'TEXTNOW', 'TRIM', 'UPPER', 'VALUE'
                    ]
                  },
                  {
                    name: 'Combinatorial',
                    functions: ['COMBIN', 'PERMUT']
                  },
                  {
                    name: 'Distribution',
                    functions: [
                      'NORMDIST', 'NORMSDIST', 'NORMINV', 'NORMSINV', 'POISSON', 'WEIBULL'
                    ]
                  },
                  {
                    name: 'Logical',
                    functions: [
                      'AND', 'FALSE', 'IF', 'IFERROR', 'IFS', 'NOT',
                      'OR', 'SWITCH', 'TRUE', 'XOR'
                    ]
                  },
                  {
                    name: 'Statistical',
                    functions: [
                      'AVERAGE', 'COUNT', 'COUNTA', 'COUNTBLANK', 'COUNTIF', 'MEDIAN', 'MODE',
                      'STDEV', 'STDEVP', 'VAR', 'VARP', 'STDEVA', 'STDEVPA', 'VARA', 'VARPA',
                      'CORREL', 'COVAR', 'GEOMEAN', 'HARMEAN', 'KURT', 'SKEW', 'SLOPE',
                      'INTERCEPT', 'RSQ', 'FORECAST', 'TREND', 'PERCENTILE', 'PERCENTRANK',
                      'QUARTILE', 'RANK', 'LARGE', 'SMALL', 'DEVSQ', 'TRIMMEAN'
                    ]
                  },
                  {
                    name: 'Array',
                    functions: [
                      'ARRAYFORMULA', 'FILTER', 'FLATTEN',
                      'SORT', 'SORTN', 'UNIQUE'
                    ]
                  },
                  {
                    name: 'Lookup',
                    functions: ['CHOOSE', 'HLOOKUP', 'INDEX', 'MATCH', 'VLOOKUP']
                  },
                  {
                    name: 'Information',
                    functions: [
                      'CELL', 'ERROR_TYPE', 'INFO', 'ISBLANK', 'ISERR', 'ISERROR', 'ISEVEN',
                      'ISFORMULA', 'ISLOGICAL', 'ISNA', 'ISNONTEXT', 'ISNUMBER', 'ISODD',
                      'ISREF', 'ISTEXT', 'N', 'NA', 'SHEET', 'SHEETS', 'TYPE'
                    ]
                  }
                ].map((category) => (
                  <div key={category.name}>
                    <div className="px-4 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                      {category.name}
                    </div>
                    {category.functions
                      .filter((func) => func.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((func) => (
                        <div
                          key={func}
                          onClick={() => {
                            applyFunctionToSelection(func);
                            setShowDropdown(false);
                          }}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                          {func}
                        </div>
                      ))
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 rounded-md hover:bg-gray-100 flex items-center gap-1"
            >
              <Palette size={18} />
              <ChevronDown size={16} className="text-gray-500" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full mt-1 left-0 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-3">
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Text Color</div>
                  <div className="grid grid-cols-8 gap-1">
                    {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'].map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          formatCell({ color });
                          setShowColorPicker(false);
                        }}
                        className="w-6 h-6 rounded-md border border-gray-200 hover:ring-2 hover:ring-blue-200"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Fill Color</div>
                  <div className="grid grid-cols-8 gap-1">
                    {['#FFFFFF', '#FFEEEE', '#EEFFEE', '#EEEEFF', '#FFFFEE', '#FFEEFF', '#EEFFFF', '#FFE4B5'].map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          formatCell({ backgroundColor: color });
                          setShowColorPicker(false);
                        }}
                        className="w-6 h-6 rounded-md border border-gray-200 hover:ring-2 hover:ring-blue-200"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* A-Z and Z-A Sort Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleQuickSort('asc')}
              disabled={!selectedRange}
              className={`p-1.5 rounded-md text-sm font-medium flex items-center gap-1 ${selectedRange ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-400 cursor-not-allowed'
                }`}
              title="Sort A to Z"
            >
              <ArrowUp size={16} />
              A-Z
            </button>
            <button
              onClick={() => handleQuickSort('desc')}
              disabled={!selectedRange}
              className={`p-1.5 rounded-md text-sm font-medium flex items-center gap-1 ${selectedRange ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-400 cursor-not-allowed'
                }`}
              title="Sort Z to A"
            >
              <ArrowDown size={16} />
              Z-A
            </button>
          </div>



          {/* Action Buttons */}
          <div className="ml-auto flex items-center gap-2">


            <button
              onClick={handledashboard}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
            >
              <BarChart3 size={16} />
               Dashboard
            </button>
              <button
              onClick={handleGenerateChart}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
            >
              <BarChart3 size={16} />
              Create Chart
            </button>
            <label className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md shadow-sm cursor-pointer transition-colors">
              <Upload size={16} />
              Import CSV
              <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
            </label>
          </div>
        </div>

        {/* Formula Bar */}
        <div className="bg-white border-b border-gray-200 p-2 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calculator size={16} className="text-gray-500" />
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded min-w-[40px] font-semibold">
              {selectedRange
                ? `${getColumnLabel(selectedRange.start.col)}${selectedRange.start.row + 1}:${getColumnLabel(selectedRange.end.col)}${selectedRange.end.row + 1}`
                : getCellLabel(selectedCell)}
            </span>
          </div>
          <input
            type="text"
            value={formulaBar}
            onChange={(e) => handleFormulaBarChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter formula or value..."
          />
        </div>


        <div className="flex-1 overflow-auto">
          <table className="table-fixed border-separate border-spacing-0 min-w-full">
            <thead>
              <tr>
                <th className="w-10 h-8 bg-gray-200 border border-gray-300"></th>
                {Array.from({ length: COLS }).map((_, c) => (
                  <th
                    key={c}
                    className="h-8 w-24 text-center text-sm font-medium bg-gray-200 border border-gray-300"
                  >
                    {getColLetter(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>


{Array.from({ length: ROWS }).map((_, r) => (
    <tr key={r}>
      <th className="w-10 text-center bg-gray-200 border border-gray-300 text-sm font-medium">
        {r + 1}
      </th>
      {Array.from({ length: COLS }).map((_, c) => {
        const key = `${r},${c}`;
        const isInRange =
          selectedRange &&
          r >= Math.min(selectedRange.start.row, selectedRange.end.row) &&
          r <= Math.max(selectedRange.start.row, selectedRange.end.row) &&
          c >= Math.min(selectedRange.start.col, selectedRange.end.col) &&
          c <= Math.max(selectedRange.start.col, selectedRange.end.col);

        return (
          <td
            key={key}
            className={`w-24 h-8 p-0 ${
              showGridlines ? "border border-gray-300" : ""
            } ${isInRange ? "bg-blue-100" : ""}`}
            onMouseDown={(e) => {
              if (e.button === 0) {
                setDragRange({
                  start: { row: r, col: c },
                  end: { row: r, col: c },
                });
                setSelectedRange({
                  start: { row: r, col: c },
                  end: { row: r, col: c },
                });
                setSelectedCell({ row: r, col: c });
              }
            }}
            onMouseMove={(e) => {
              if (dragRange && e.buttons === 1) {
                const newEnd = { row: r, col: c };
                setDragRange((prev) => ({ ...prev, end: newEnd }));
                setSelectedRange((prev) => ({ ...prev, end: newEnd }));
                calculateStats(r, c);
              }
            }}
            onMouseUp={() => {
              if (dragRange) {
                setSelectedRange(dragRange);
                setDragRange(null);
                calculateStats(dragRange.end.row, dragRange.end.col);
              }
            }}
            onClick={() => {
              setSelectedCell({ row: r, col: c });
              setSelectedRange({
                start: { row: r, col: c },
                end: { row: r, col: c },
              });
              calculateStats(r, c);
            }}
          >
            <input
              ref={(el) => {
                if (el) {
                  cellRefs.current[key] = el;
                }
              }}
              type="text"
              value={cells[key]?.display || ""}
              onChange={(e) => handleChange(key, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const nextRow = Math.min(r + 1, ROWS - 1);
                  const nextKey = `${nextRow},${c}`;
                  setSelectedCell({ row: nextRow, col: c });
                  setTimeout(() => {
                    cellRefs.current[nextKey]?.focus();
                  }, 0);
                }
              }}
              className={`w-full h-full px-2 text-sm outline-none
                ${cellStyles[key]?.bold ? "font-bold" : ""}
                ${cellStyles[key]?.italic ? "italic" : ""}
                ${cellStyles[key]?.underline ? "underline" : ""}
                ${cellStyles[key]?.align === "center" ? "text-center" : ""}
                ${cellStyles[key]?.align === "right" ? "text-right" : ""}`}
              style={{
                color: cellStyles[key]?.color || "inherit",
                backgroundColor:
                  cellStyles[key]?.backgroundColor || "transparent",
              }}
            />
          </td>
        );
      })}
    </tr>
  ))}


            </tbody>
          </table>


          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-80">
                <h3 className="text-lg font-semibold mb-4">Statistics</h3>
                <div className="space-y-2">
                  <p>Sum: {stats.sum.toFixed(2)}</p>
                  <p>Avg: {stats.avg.toFixed(2)}</p>
                  <p>Count: {stats.count}</p>
                  <p>Min: {stats.min.toFixed(2)}</p>
                  <p>Max: {stats.max.toFixed(2)}</p>
                </div>
                <button
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>


        <div className="bg-gray-50 border-t border-gray-200 px-4 py-1 flex items-center gap-2 z-10">
          <div className="flex items-center gap-1 overflow-x-auto">
            {sheets.map(sheet => (
              <div key={sheet.id} className="flex items-center shrink-0">
                {editingSheetId === sheet.id ? (
                  <input
                    type="text"
                    value={tempSheetName}
                    onChange={(e) => setTempSheetName(e.target.value)}
                    onBlur={() => {
                      if (tempSheetName.trim()) {
                        setSheets(prev =>
                          prev.map(s =>
                            s.id === sheet.id ? { ...s, name: tempSheetName.trim() } : s
                          )
                        );
                      }
                      setEditingSheetId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempSheetName.trim()) {
                        setSheets(prev =>
                          prev.map(s =>
                            s.id === sheet.id ? { ...s, name: tempSheetName.trim() } : s
                          )
                        );
                        setEditingSheetId(null);
                      } else if (e.key === 'Escape') {
                        setEditingSheetId(null);
                      }
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-t-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => switchSheet(sheet.id)}
                    onDoubleClick={() => {
                      setEditingSheetId(sheet.id);
                      setTempSheetName(sheet.name);
                    }}
                    className={`px-3 py-1.5 text-sm rounded-t-md transition-colors flex items-center gap-1 ${sheet.active
                      ? 'bg-white border-t-2 border-t-blue-500 border-l border-r border-gray-300 -mb-px font-medium text-gray-900'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                  >
                    {sheet.name}
                  </button>
                )}
                {sheets.length > 1 && (
                  <button
                    onClick={() => deleteSheet(sheet.id)}
                    className="ml-1 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addSheet}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 shrink-0"
          >
            <Plus size={16} />
            Add Sheet
          </button>

          {/* Summary Footer */}
          {(selectedRange && initialStat) && (
            <div className="bg-gray-100 border-t border-gray-300 p-2 text-sm flex justify-end ">
              <span
                className="cursor-pointer text-black"
                onClick={() => setShowModal(true)}
              >
                {initialStat === 'sum' && `Sum: ${stats.sum.toFixed(2)}`}
              </span>
            </div>
          ) || (!selectedRange && Object.keys(cells).filter(key => cells[key]?.value).length > 0 && (
            <div className="bg-gray-100 border-t border-gray-300 p-2 text-sm flex justify-end">
              {/* Empty div as placeholder if needed */}
            </div>
          ))}

          <div className="ml-auto text-xs text-gray-500 shrink-0">
            {Object.keys(cells).filter(key => cells[key]?.value).length} cells with data
          </div>
        </div>
      </div>
      {/* Find/Replace Dialog */}
      {findReplace.show && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-xl z-50 w-96">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Find and Replace</h3>
            <button
              onClick={() => setFindReplace(prev => ({ ...prev, show: false }))}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Find</label>
              <input
                type="text"
                value={findReplace.find}
                onChange={(e) => setFindReplace(prev => ({ ...prev, find: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Replace with</label>
              <input
                type="text"
                value={findReplace.replace}
                onChange={(e) => setFindReplace(prev => ({ ...prev, replace: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={findReplace.matchCase}
                onChange={(e) => setFindReplace(prev => ({ ...prev, matchCase: e.target.checked }))}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Match case</span>
            </label>

            <div className="flex justify-between pt-2">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const results = Object.keys(cells).filter(key => {
                      const val = typeof cells[key] === 'object' ? cells[key]?.display : cells[key] || '';
                      const search = findReplace.find;
                      return findReplace.matchCase
                        ? val.includes(search)
                        : val.toLowerCase().includes(search.toLowerCase());
                    });

                    if (results.length > 0) {
                      setSelectedCell(results[0]);
                    }

                    setFindReplace(prev => ({
                      ...prev,
                      results,
                      currentIndex: 0
                    }));
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                >
                  Find
                </button>

                <button
                  onClick={() => {
                    if (findReplace.results.length === 0) return;

                    const updated = { ...cells };
                    findReplace.results.forEach(key => {
                      let val = typeof updated[key] === 'object' ? updated[key]?.display : updated[key];
                      const search = findReplace.find;
                      const replacement = findReplace.replace;

                      if (!findReplace.matchCase) {
                        const regex = new RegExp(search, 'gi');
                        val = val.replace(regex, replacement);
                      } else {
                        val = val.replaceAll(search, replacement);
                      }

                      // Handle structured or plain cells
                      if (typeof updated[key] === 'object') {
                        updated[key] = { ...updated[key], display: val };
                      } else {
                        updated[key] = val;
                      }
                    });

                    setCells(updated);
                    setFindReplace(prev => ({
                      ...prev,
                      results: [],
                      currentIndex: 0
                    }));
                  }}
                  className={`px-4 py-2 rounded-md text-sm ${findReplace.results.length === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                    }`}
                  disabled={findReplace.results.length === 0}
                >
                  Replace All
                </button>
              </div>

              {findReplace.results.length > 0 && (
                <div className="text-sm text-gray-500">
                  {findReplace.currentIndex + 1} of {findReplace.results.length}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Version History ({history.length})</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {history.map((version, index) => (
                <div
                  key={index}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${historyIndex === index ? 'bg-blue-50' : ''
                    }`}
                  onClick={() => restoreVersion(index)}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">
                      Version {index + 1} - {new Date(version.timestamp || Date.now()).toLocaleString()}
                    </span>
                    {historyIndex === index && (
                      <span className="text-sm text-green-600">Current</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {Object.keys(version.cells || {}).length} cells modified
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t bg-gray-50 text-right">
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {validationDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Data Validation for {validationDialog.cell}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Validation type</label>
                <select
                  value={validationDialog.type}
                  onChange={(e) => setValidationDialog({ ...validationDialog, type: e.target.value })}
                  className="w-full border rounded p-2"
                >
                  <option value="number">Number</option>
                  <option value="text">Text</option>
                  <option value="date">Date</option>
                  <option value="list">List from range</option>
                  <option value="custom">Custom formula</option>
                </select>
              </div>

              {validationDialog.type === 'number' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Condition</label>
                    <select
                      value={validationDialog.condition}
                      onChange={(e) => setValidationDialog({ ...validationDialog, condition: e.target.value })}
                      className="w-full border rounded p-2"
                    >
                      <option value="between">Between</option>
                      <option value="greater">Greater than</option>
                      <option value="less">Less than</option>
                      <option value="equal">Equal to</option>
                      <option value="notEqual">Not equal to</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {validationDialog.condition === 'between' ? 'Minimum' : 'Value'}
                      </label>
                      <input
                        type="number"
                        value={validationDialog.min}
                        onChange={(e) => setValidationDialog({ ...validationDialog, min: e.target.value })}
                        className="w-full border rounded p-2"
                      />
                    </div>

                    {validationDialog.condition === 'between' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Maximum</label>
                        <input
                          type="number"
                          value={validationDialog.max}
                          onChange={(e) => setValidationDialog({ ...validationDialog, max: e.target.value })}
                          className="w-full border rounded p-2"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {validationDialog.type === 'list' && (
                <div>
                  <label className="block text-sm font-medium mb-1">List items (comma separated)</label>
                  <input
                    type="text"
                    value={validationDialog.list}
                    onChange={(e) => setValidationDialog({ ...validationDialog, list: e.target.value })}
                    className="w-full border rounded p-2"
                    placeholder="e.g., Yes,No,Maybe"
                  />
                </div>
              )}

              {validationDialog.type === 'custom' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Custom formula</label>
                  <input
                    type="text"
                    value={validationDialog.customFormula}
                    onChange={(e) => setValidationDialog({ ...validationDialog, customFormula: e.target.value })}
                    className="w-full border rounded p-2"
                    placeholder="e.g., =A1>B1"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Input message (optional)</label>
                <input
                  type="text"
                  value={validationDialog.inputMessage}
                  onChange={(e) => setValidationDialog({ ...validationDialog, inputMessage: e.target.value })}
                  className="w-full border rounded p-2"
                  placeholder="e.g., Enter a number between 1 and 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Error message</label>
                <input
                  type="text"
                  value={validationDialog.errorMessage}
                  onChange={(e) => setValidationDialog({ ...validationDialog, errorMessage: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setValidationDialog({ ...validationDialog, show: false })}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={applyValidation}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {scriptEditor.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-xl w-[600px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Script Editor</h2>
              <button onClick={() => setScriptEditor(prev => ({ ...prev, isOpen: false }))}>✕</button>
            </div>
            <textarea
              value={scriptEditor.scripts[0].code}
              onChange={(e) => {
                const updated = [...scriptEditor.scripts];
                updated[0].code = e.target.value;
                setScriptEditor(prev => ({ ...prev, scripts: updated }));
              }}
              rows={12}
              className="w-full font-mono text-sm border rounded p-2"
            />
            <div className="flex justify-end mt-4">
              <button onClick={runScript} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Run Script
              </button>
            </div>
          </div>
        </div>
      )}

      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">Insert link</h2>
              <button
                onClick={() => setShowLinkDialog(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Enter text to display"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Paste or type a link"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowLinkDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  insertLink();
                  setShowLinkDialog(false);
                }}
                disabled={!linkText.trim() || !linkUrl.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl ">
            <div className="flex justify-between items-center p-4 border-b ">
              <h3 className="text-lg font-medium">Insert Image</h3>
              <button onClick={() => setShowImageDialog(false)} className="text-gray-500">
                <X size={24} />
              </button>
            </div>

            <div className="p-4">
              <div className="flex border-b ">
                <button
                  className={`px-4 py-2 ${activeImageTab === 'url' ? 'border-b-2 border-blue-500' : ''}`}
                  onClick={() => setActiveImageTab('url')}
                >
                  From URL
                </button>
                <button
                  className={`px-4 py-2 ${activeImageTab === 'upload' ? 'border-b-2 border-blue-500' : ''}`}
                  onClick={() => setActiveImageTab('upload')}
                >
                  Upload
                </button>
              </div>

              <div className="mt-4">
                {activeImageTab === 'url' ? (
                  <div className="space-y-4">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={handleUrlChange}
                      placeholder="Enter image URL"
                      className="w-full p-2 border rounded"
                    />
                    {previewImage && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Preview:</p>
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="max-w-full max-h-48 object-contain border"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="w-full p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:bg-gray-50"
                    >
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <p>Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                    </button>
                    {previewImage && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Preview:</p>
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="max-w-full max-h-48 object-contain border"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setShowImageDialog(false)}
                className="px-4 py-2 mr-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={insertImage}
                disabled={!previewImage}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}
      {spellCheck.active && spellCheck.errors.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl z-50 w-96">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-medium text-gray-800">
              Spell Check ({spellCheck.currentErrorIndex + 1}/{spellCheck.errors.length})
            </h3>
            <button
              onClick={() => setSpellCheck(prev => ({ ...prev, active: false }))}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Misspelled word in cell {spellCheck.errors[spellCheck.currentErrorIndex].cellRef}:</p>
              <div className="font-medium bg-red-50 px-3 py-2 rounded border border-red-100 text-red-800">
                {spellCheck.errors[spellCheck.currentErrorIndex].word}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Suggestions:</p>
              <div className="grid grid-cols-2 gap-2">
                {spellCheck.errors[spellCheck.currentErrorIndex].suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSpellCheckAction('replace', suggestion)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm text-left truncate"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <div className="flex gap-2">
                <button
                  onClick={() => handleSpellCheckAction('ignore')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                >
                  Ignore
                </button>
                <button
                  onClick={() => handleSpellCheckAction('add')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                >
                  Add to Dictionary
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={moveToPrevError}
                  disabled={spellCheck.currentErrorIndex === 0}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={moveToNextError}
                  disabled={spellCheck.currentErrorIndex === spellCheck.errors.length - 1}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {spellCheck.currentErrorIndex === spellCheck.errors.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showNotifications && (
        <div className="fixed top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-80">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-medium">Notifications</h3>
            <button
              onClick={() => {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setShowNotifications(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''
                    }`}
                  onClick={() => {
                    setNotifications(prev =>
                      prev.map(n =>
                        n.id === notification.id ? { ...n, read: true } : n
                      )
                    );
                    // Handle notification click action
                  }}
                >
                  <div className="flex justify-between">
                    <span className={!notification.read ? 'font-medium' : ''}>
                      {notification.message}
                    </span>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t text-center">
            <button
              onClick={() => setShowNotifications(false)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {sortDialog.show && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-5 rounded shadow-lg w-96 z-50">
          <h3 className="text-lg font-medium mb-4">Custom Sort</h3>

          <div className="space-y-3">
            <label className="block">
              Sort by column:
              <select
                className="w-full mt-1 border rounded px-2 py-1"
                value={sortDialog.sortBy}
                onChange={(e) => setSortDialog(prev => ({ ...prev, sortBy: e.target.value }))}
              >
                {Array.from({ length: COLS }).map((_, colIndex) => (
                  <div
                    key={colIndex}
                    className="relative border-r border-gray-300"
                    style={{
                      width: getColWidth(colIndex),
                      minWidth: getColWidth(colIndex),
                      maxWidth: getColWidth(colIndex),
                      overflow: 'hidden',
                      display: 'inline-block',
                    }}
                  >
                    <div className="text-center font-semibold">
                      {String.fromCharCode(65 + colIndex)}
                    </div>

                    {/* Resize Handle */}
                    <div
                      onMouseDown={(e) => handleResizeMouseDown('col', colIndex, e)}
                      className="absolute top-0 right-0 h-full w-2 cursor-col-resize z-10"
                      style={{ cursor: 'col-resize' }}
                    />
                  </div>
                ))}

              </select>
            </label>

            <label className="block">
              Order:
              <select
                className="w-full mt-1 border rounded px-2 py-1"
                value={sortDialog.order}
                onChange={(e) => setSortDialog(prev => ({ ...prev, order: e.target.value }))}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={sortDialog.hasHeader}
                onChange={(e) => setSortDialog(prev => ({ ...prev, hasHeader: e.target.checked }))}
                className="mr-2"
              />
              My data has headers
            </label>
          </div>

          <div className="flex justify-end mt-4 space-x-2">
            <button
              onClick={() => setSortDialog(prev => ({ ...prev, show: false }))}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomSort}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Sort
            </button>
          </div>
        </div>
      )}

      {validationDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Data Validation</h3>
              <button
                onClick={() => setValidationDialog({ ...validationDialog, show: false })}
                className="text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Validation type</label>
                <select
                  value={validationDialog.type}
                  onChange={(e) => setValidationDialog({ ...validationDialog, type: e.target.value })}
                  className="w-full border rounded p-2"
                >
                  <option value="number">Number</option>
                  <option value="text">Text</option>
                  <option value="date">Date</option>
                  <option value="list">List from range</option>
                  <option value="custom">Custom formula</option>
                </select>
              </div>

              {validationDialog.type === 'number' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Condition</label>
                    <select
                      value={validationDialog.condition}
                      onChange={(e) => setValidationDialog({ ...validationDialog, condition: e.target.value })}
                      className="w-full border rounded p-2"
                    >
                      <option value="between">Between</option>
                      <option value="greater">Greater than</option>
                      <option value="less">Less than</option>
                      <option value="equal">Equal to</option>
                      <option value="notEqual">Not equal to</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {validationDialog.condition === 'between' ? 'Minimum' : 'Value'}
                      </label>
                      <input
                        type="number"
                        value={validationDialog.min}
                        onChange={(e) => setValidationDialog({ ...validationDialog, min: e.target.value })}
                        className="w-full border rounded p-2"
                      />
                    </div>

                    {validationDialog.condition === 'between' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Maximum</label>
                        <input
                          type="number"
                          value={validationDialog.max}
                          onChange={(e) => setValidationDialog({ ...validationDialog, max: e.target.value })}
                          className="w-full border rounded p-2"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {validationDialog.type === 'list' && (
                <div>
                  <label className="block text-sm font-medium mb-1">List items (comma separated)</label>
                  <input
                    type="text"
                    value={validationDialog.list}
                    onChange={(e) => setValidationDialog({ ...validationDialog, list: e.target.value })}
                    className="w-full border rounded p-2"
                    placeholder="e.g., Yes,No,Maybe"
                  />
                </div>
              )}

              {validationDialog.type === 'custom' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Custom formula</label>
                  <input
                    type="text"
                    value={validationDialog.customFormula}
                    onChange={(e) => setValidationDialog({ ...validationDialog, customFormula: e.target.value })}
                    className="w-full border rounded p-2"
                    placeholder="e.g., =A1>B1"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Input message (optional)</label>
                <input
                  type="text"
                  value={validationDialog.inputMessage}
                  onChange={(e) => setValidationDialog({ ...validationDialog, inputMessage: e.target.value })}
                  className="w-full border rounded p-2"
                  placeholder="e.g., Enter a number between 1 and 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Error message</label>
                <input
                  type="text"
                  value={validationDialog.errorMessage}
                  onChange={(e) => setValidationDialog({ ...validationDialog, errorMessage: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Error style</label>
                <select
                  value={validationDialog.errorStyle}
                  onChange={(e) => setValidationDialog({ ...validationDialog, errorStyle: e.target.value })}
                  className="w-full border rounded p-2"
                >
                  <option value="stop">Stop (prevent invalid data)</option>
                  <option value="warning">Warning (warn but allow)</option>
                  <option value="info">Information (show message)</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => setValidationDialog({ ...validationDialog, show: false })}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={applyValidation}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg text-sm animate-fade-in z-50">
          <div className="flex items-center justify-between gap-4">
            <span>{notification}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-300 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for opening files */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={importCSV}
        className="hidden"
        accept=".json,.csv"
      />
      <SpellCheckModal />
    </div>
  );


};
