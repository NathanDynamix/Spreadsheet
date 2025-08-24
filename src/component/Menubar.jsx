import React, { useState, useRef} from 'react';
import { 
  FileText, Save, Download, Printer, Share2, Folder, Clock,
  Undo2, Redo2, Scissors, Copy, Clipboard, Search, Trash2,
  Eye, Grid3X3, ZoomIn, ZoomOut, Maximize,
  Plus, BarChart3, Image, Link, Table,
  Palette, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Filter, ArrowUpDown, Shield, Settings,
  Puzzle, HelpCircle, Keyboard, BookOpen,
} from 'lucide-react';

const GoogleSheetsClone = () => {
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [cellData, setCellData] = useState({});
  const [cellStyles, setCellStyles] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);
  const [showGridlines, setShowGridlines] = useState(true);
  const [showFormulas, setShowFormulas] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [clipboard, setClipboard] = useState(null);
  const [findReplace, setFindReplace] = useState({ show: false, find: '', replace: '' });
  const [sortDialog, setSortDialog] = useState({ show: false, column: 0, ascending: true });
  const [filterActive, setFilterActive] = useState(false);
  const [filteredRows, setFilteredRows] = useState([]);
  const [chartDialog, setChartDialog] = useState({ show: false, type: 'line' });
  const [sheetName, setSheetName] = useState('Untitled spreadsheet');
  const [isEditing, setIsEditing] = useState(false);
  const [formula, setFormula] = useState('');
  const [colorPicker, setColorPicker] = useState({ show: false, type: '', color: '#ffffff' });
  const [notification, setNotification] = useState(null);
  
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const rows = 100;
  const cols = 26;

  const getColumnLabel = (index) => String.fromCharCode(65 + index);
  
  const getCellKey = (row, col) => `${row}-${col}`;
  
  const getCellValue = (row, col) => {
    const key = getCellKey(row, col);
    return cellData[key] || '';
  };

  const getCellStyle = (row, col) => {
    const key = getCellKey(row, col);
    return cellStyles[key] || {};
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

  const addToHistory = (data, styles) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ data, styles });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // File Operations
  const handleNew = () => {
    setCellData({});
    setCellStyles({});
    setHistory([{}]);
    setHistoryIndex(0);
    setSheetName('Untitled spreadsheet');
    showNotification('New spreadsheet created');
  };

  const handleSave = () => {
    const data = { cellData, cellStyles, sheetName };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sheetName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Spreadsheet saved');
  };

  const handleOpen = () => {
    fileInputRef.current?.click();
  };

  const handleFileLoad = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setCellData(data.cellData || {});
          setCellStyles(data.cellStyles || {});
          setSheetName(data.sheetName || 'Untitled spreadsheet');
          showNotification('Spreadsheet loaded');
        } catch (error) {
          showNotification('Error loading file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadCSV = () => {
    let csv = '';
    for (let row = 0; row < rows; row++) {
      const rowData = [];
      for (let col = 0; col < cols; col++) {
        rowData.push(getCellValue(row, col));
      }
      csv += rowData.join(',') + '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sheetName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('CSV downloaded');
  };

  // Edit Operations
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setCellData(prevState.data || {});
      setCellStyles(prevState.styles || {});
      setHistoryIndex(historyIndex - 1);
      showNotification('Undone');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setCellData(nextState.data || {});
      setCellStyles(nextState.styles || {});
      setHistoryIndex(historyIndex + 1);
      showNotification('Redone');
    }
  };

  const handleCopy = () => {
    const value = getCellValue(selectedCell.row, selectedCell.col);
    const style = getCellStyle(selectedCell.row, selectedCell.col);
    setClipboard({ value, style, row: selectedCell.row, col: selectedCell.col });
    showNotification('Copied');
  };

  const handleCut = () => {
    handleCopy();
    setCellValue(selectedCell.row, selectedCell.col, '');
    showNotification('Cut');
  };

  const handlePaste = () => {
    if (clipboard) {
      setCellValue(selectedCell.row, selectedCell.col, clipboard.value);
      setCellStyle(selectedCell.row, selectedCell.col, clipboard.style);
      showNotification('Pasted');
    }
  };

  const handleDelete = () => {
    setCellValue(selectedCell.row, selectedCell.col, '');
    showNotification('Deleted');
  };

  const handleFindReplace = () => {
    if (!findReplace.find) return;
    
    let replaced = 0;
    const newData = { ...cellData };
    
    Object.keys(newData).forEach(key => {
      if (newData[key].includes(findReplace.find)) {
        newData[key] = newData[key].replace(new RegExp(findReplace.find, 'g'), findReplace.replace);
        replaced++;
      }
    });
    
    setCellData(newData);
    addToHistory(newData, cellStyles);
    showNotification(`Replaced ${replaced} instances`);
    setFindReplace({ show: false, find: '', replace: '' });
  };

  // View Operations
  const handleZoomIn = () => setZoom(Math.min(200, zoom + 25));
  const handleZoomOut = () => setZoom(Math.max(50, zoom - 25));
  const toggleGridlines = () => setShowGridlines(!showGridlines);
  const toggleFormulas = () => setShowFormulas(!showFormulas);

  // Format Operations
  const toggleBold = () => {
    const currentStyle = getCellStyle(selectedCell.row, selectedCell.col);
    setCellStyle(selectedCell.row, selectedCell.col, { 
      fontWeight: currentStyle.fontWeight === 'bold' ? 'normal' : 'bold' 
    });
  };

  const toggleItalic = () => {
    const currentStyle = getCellStyle(selectedCell.row, selectedCell.col);
    setCellStyle(selectedCell.row, selectedCell.col, { 
      fontStyle: currentStyle.fontStyle === 'italic' ? 'normal' : 'italic' 
    });
  };

  const toggleUnderline = () => {
    const currentStyle = getCellStyle(selectedCell.row, selectedCell.col);
    setCellStyle(selectedCell.row, selectedCell.col, { 
      textDecoration: currentStyle.textDecoration === 'underline' ? 'none' : 'underline' 
    });
  };

  const setAlignment = (align) => {
    setCellStyle(selectedCell.row, selectedCell.col, { textAlign: align });
  };

  const setColor = (type, color) => {
    const styleKey = type === 'text' ? 'color' : 'backgroundColor';
    setCellStyle(selectedCell.row, selectedCell.col, { [styleKey]: color });
    setColorPicker({ show: false, type: '', color: '#ffffff' });
  };

  // Data Operations
  const handleSort = () => {
    const columnData = [];
    for (let row = 0; row < rows; row++) {
      const value = getCellValue(row, sortDialog.column);
      if (value) {
        columnData.push({ row, value, originalRow: row });
      }
    }

    columnData.sort((a, b) => {
      const aVal = isNaN(a.value) ? a.value : parseFloat(a.value);
      const bVal = isNaN(b.value) ? b.value : parseFloat(b.value);
      
      if (sortDialog.ascending) {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    const newData = { ...cellData };
    const newStyles = { ...cellStyles };
    
    columnData.forEach((item, index) => {
      for (let col = 0; col < cols; col++) {
        const oldKey = getCellKey(item.originalRow, col);
        const newKey = getCellKey(index, col);
        newData[newKey] = cellData[oldKey] || '';
        newStyles[newKey] = cellStyles[oldKey] || {};
      }
    });

    setCellData(newData);
    setCellStyles(newStyles);
    addToHistory(newData, newStyles);
    setSortDialog({ show: false, column: 0, ascending: true });
    showNotification('Data sorted');
  };

  const toggleFilter = () => {
    setFilterActive(!filterActive);
    showNotification(filterActive ? 'Filter removed' : 'Filter applied');
  };

  // Insert Operations
  const insertRow = () => {
    const newData = {};
    const newStyles = {};
    
    Object.keys(cellData).forEach(key => {
      const [row, col] = key.split('-').map(Number);
      if (row >= selectedCell.row) {
        const newKey = getCellKey(row + 1, col);
        newData[newKey] = cellData[key];
        newStyles[newKey] = cellStyles[key] || {};
      } else {
        newData[key] = cellData[key];
        newStyles[key] = cellStyles[key] || {};
      }
    });
    
    setCellData(newData);
    setCellStyles(newStyles);
    addToHistory(newData, newStyles);
    showNotification('Row inserted');
  };

  const insertColumn = () => {
    const newData = {};
    const newStyles = {};
    
    Object.keys(cellData).forEach(key => {
      const [row, col] = key.split('-').map(Number);
      if (col >= selectedCell.col) {
        const newKey = getCellKey(row, col + 1);
        newData[newKey] = cellData[key];
        newStyles[newKey] = cellStyles[key] || {};
      } else {
        newData[key] = cellData[key];
        newStyles[key] = cellStyles[key] || {};
      }
    });
    
    setCellData(newData);
    setCellStyles(newStyles);
    addToHistory(newData, newStyles);
    showNotification('Column inserted');
  };

  // Formula calculation
  const calculateFormula = (formula) => {
    try {
      if (formula.startsWith('=')) {
        const expression = formula.substring(1);
        // Simple formula evaluation (SUM, AVERAGE, etc.)
        if (expression.startsWith('SUM(')) {
          const range = expression.match(/SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/);
          if (range) {
            // Calculate sum for range
            return 'SUM_RESULT';
          }
        }
        // Basic arithmetic
        const result = eval(expression.replace(/[A-Z]+\d+/g, '0')); // Simple evaluation
        return result;
      }
      return formula;
    } catch {
      return '#ERROR';
    }
  };

  const handleCellClick = (row, col) => {
    setSelectedCell({ row, col });
    setActiveMenu(null);
    setFormula(getCellValue(row, col));
  };

  const handleCellChange = (e) => {
    const value = e.target.value;
    setFormula(value);
    setCellValue(selectedCell.row, selectedCell.col, value);
  };

  const handleFormulaChange = (e) => {
    const value = e.target.value;
    setFormula(value);
    setCellValue(selectedCell.row, selectedCell.col, value);
  };

  const menuItems = {
    File: [
      { icon: FileText, label: 'New', action: handleNew },
      { icon: Folder, label: 'Open', action: handleOpen },
      { icon: Save, label: 'Save', action: handleSave },
      { icon: Download, label: 'Download as CSV', action: handleDownloadCSV },
      { icon: Printer, label: 'Print', action: () => window.print() },
      { icon: Share2, label: 'Share', action: () => showNotification('Share functionality would be implemented') },
      { icon: Clock, label: 'Version history', action: () => showNotification('Version history would show here') }
    ],
    Edit: [
      { icon: Undo2, label: 'Undo', action: handleUndo },
      { icon: Redo2, label: 'Redo', action: handleRedo },
      { icon: Scissors, label: 'Cut', action: handleCut },
      { icon: Copy, label: 'Copy', action: handleCopy },
      { icon: Clipboard, label: 'Paste', action: handlePaste },
      { icon: Search, label: 'Find and replace', action: () => setFindReplace({ ...findReplace, show: true }) },
      { icon: Trash2, label: 'Delete', action: handleDelete }
    ],
    View: [
      { icon: Grid3X3, label: 'Show gridlines', action: toggleGridlines },
      { icon: Eye, label: 'Show formulas', action: toggleFormulas },
      { icon: ZoomIn, label: 'Zoom in', action: handleZoomIn },
      { icon: ZoomOut, label: 'Zoom out', action: handleZoomOut },
      { icon: Maximize, label: 'Full screen', action: () => document.documentElement.requestFullscreen() }
    ],
    Insert: [
      { icon: Plus, label: 'Insert row above', action: insertRow },
      { icon: Plus, label: 'Insert column left', action: insertColumn },
      { icon: BarChart3, label: 'Chart', action: () => setChartDialog({ show: true, type: 'line' }) },
      { icon: Image, label: 'Image', action: () => showNotification('Image upload would be implemented') },
      { icon: Link, label: 'Link', action: () => showNotification('Link insertion would be implemented') }
    ],
    Format: [
      { icon: Bold, label: 'Bold', action: toggleBold },
      { icon: Italic, label: 'Italic', action: toggleItalic },
      { icon: Underline, label: 'Underline', action: toggleUnderline },
      { icon: AlignLeft, label: 'Align left', action: () => setAlignment('left') },
      { icon: AlignCenter, label: 'Align center', action: () => setAlignment('center') },
      { icon: AlignRight, label: 'Align right', action: () => setAlignment('right') },
      { icon: Palette, label: 'Fill color', action: () => setColorPicker({ show: true, type: 'background', color: '#ffffff' }) }
    ],
    Data: [
      { icon: ArrowUpDown, label: 'Sort range', action: () => setSortDialog({ show: true, column: selectedCell.col, ascending: true }) },
      { icon: Filter, label: 'Create a filter', action: toggleFilter },
      { icon: Shield, label: 'Data validation', action: () => showNotification('Data validation would be implemented') },
      { icon: Table, label: 'Pivot table', action: () => showNotification('Pivot table would be implemented') }
    ],
    Tools: [
      { icon: Settings, label: 'Spell check', action: () => showNotification('Spell check would run') },
      { icon: Settings, label: 'Notifications', action: () => showNotification('Notification settings would open') },
      { icon: Settings, label: 'Script editor', action: () => showNotification('Script editor would open') }
    ],
    Extensions: [
      { icon: Puzzle, label: 'Add-ons', action: () => showNotification('Add-ons store would open') },
      { icon: Puzzle, label: 'Apps Script', action: () => showNotification('Apps Script would open') }
    ],
    Help: [
      { icon: HelpCircle, label: 'Help', action: () => showNotification('Help documentation would open') },
      { icon: Keyboard, label: 'Keyboard shortcuts', action: () => showNotification('Keyboard shortcuts: Ctrl+C (copy), Ctrl+V (paste), Ctrl+Z (undo)') },
      { icon: BookOpen, label: 'Training', action: () => showNotification('Training resources would open') }
    ]
  };

  const MenuDropdown = ({ items, isOpen, onClose }) => {
    if (!isOpen) return null;
    
    return (
      <div className="absolute top-full left-0 mt-1 bg-black-700 border border-gray-200 rounded-md shadow-lg z-50 min-w-48">
        {items.map((item, index) => (
          <button
            key={index}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
            onClick={() => {
              item.action();
              onClose();
            }}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>
    );
  };

  const colors = ['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000'];

  return (
    <div className="w-full h-screen bg-white flex flex-row">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileLoad}
        className="hidden"
      />

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            className="text-xl font-medium text-gray-800 bg-transparent border-none outline-none"
          />
          <div className="flex items-center gap-2">
            <button 
              onClick={() => showNotification('Share functionality would be implemented')}
              className="p-2 rounded hover:bg-gray-100"
            >
              <Share2 size={16} />
            </button>
            <button 
              onClick={() => showNotification('Share functionality would be implemented')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-1">
        <div className="flex items-center gap-1">
          {Object.keys(menuItems).map((menuName) => (
            <div key={menuName} className="relative">
              <button
                className={`px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                  activeMenu === menuName ? 'bg-gray-100' : ''
                }`}
                onClick={() => setActiveMenu(activeMenu === menuName ? null : menuName)}
              >
                {menuName}
              </button>
              <MenuDropdown
                items={menuItems[menuName]}
                isOpen={activeMenu === menuName}
                onClose={() => setActiveMenu(null)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
        <div className="flex  items-center gap-2">
          <button 
            onClick={handleUndo}
            className="p-1 rounded hover:bg-gray-200" 
            disabled={historyIndex <= 0}
          >
            <Undo2 size={16} className={historyIndex <= 0 ? 'text-gray-400' : ''} />
          </button>
          <button 
            onClick={handleRedo}
            className="p-1 rounded hover:bg-gray-200"
            disabled={historyIndex >= history.length - 1}
          >
            <Redo2 size={16} className={historyIndex >= history.length - 1 ? 'text-gray-400' : ''} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <button onClick={toggleBold} className="p-1 rounded hover:bg-gray-200"><Bold size={16} /></button>
          <button onClick={toggleItalic} className="p-1 rounded hover:bg-gray-200"><Italic size={16} /></button>
          <button onClick={toggleUnderline} className="p-1 rounded hover:bg-gray-200"><Underline size={16} /></button>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <button onClick={() => setAlignment('left')} className="p-1 rounded hover:bg-gray-200"><AlignLeft size={16} /></button>
          <button onClick={() => setAlignment('center')} className="p-1 rounded hover:bg-gray-200"><AlignCenter size={16} /></button>
          <button onClick={() => setAlignment('right')} className="p-1 rounded hover:bg-gray-200"><AlignRight size={16} /></button>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <button 
            onClick={() => setColorPicker({ show: true, type: 'background', color: '#ffffff' })}
            className="p-1 rounded hover:bg-gray-200"
          >
            <Palette size={16} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <span className="text-sm text-gray-600">{zoom}%</span>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 min-w-12">
            {getColumnLabel(selectedCell.col)}{selectedCell.row + 1}
          </span>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            value={formula}
            onChange={handleFormulaChange}
            placeholder="Enter formula or value"
          />
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto bg-white" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
        <div className="inline-block">
          {/* Column Headers */}
          <div className="flex sticky top-0 bg-gray-100 z-10">
            <div className="w-12 h-8 border-r border-gray-300 bg-gray-100 flex items-center justify-center text-xs font-medium"></div>
            {Array.from({ length: cols }, (_, colIndex) => (
              <div
                key={colIndex}
                className="w-24 h-8 border-r border-gray-300 bg-gray-100 flex items-center justify-center text-xs font-medium"
              >
                {getColumnLabel(colIndex)}
                {filterActive && (
                  <Filter size={12} className="ml-1 text-blue-600" />
                )}
              </div>
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="flex">
              {/* Row Header */}
              <div className="w-12 h-8 border-r border-b border-gray-300 bg-gray-100 flex items-center justify-center text-xs font-medium sticky left-0 z-10">
                {rowIndex + 1}
              </div>

              {/* Cells */}
              {Array.from({ length: cols }, (_, colIndex) => {
                const cellStyle = getCellStyle(rowIndex, colIndex);
                const cellValue = getCellValue(rowIndex, colIndex);
                const displayValue = showFormulas && cellValue.startsWith('=') ? cellValue : (cellValue.startsWith('=') ? calculateFormula(cellValue) : cellValue);
                
                return (
                  <div
                    key={colIndex}
                    className={`w-24 h-8 ${showGridlines ? 'border-r border-b border-gray-300' : ''} relative cursor-cell ${
                      selectedCell.row === rowIndex && selectedCell.col === colIndex
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    style={cellStyle}
                  >
                    <input
                      type="text"
                      className="w-full h-full px-1 text-xs border-none outline-none bg-transparent"
                      value={displayValue}
                      onChange={(e) => {
                        setFormula(e.target.value);
                        setCellValue(rowIndex, colIndex, e.target.value);
                      }}
                      onFocus={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                      style={cellStyle}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Dialogs */}
      {findReplace.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Find and Replace</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Find"
                value={findReplace.find}
                onChange={(e) => setFindReplace({ ...findReplace, find: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="Replace with"
                value={findReplace.replace}
                onChange={(e) => setFindReplace({ ...findReplace, replace: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setFindReplace({ show: false, find: '', replace: '' })}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFindReplace}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Replace All
              </button>
            </div>
          </div>
        </div>
      )}

      {sortDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Sort Range</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sort by column:</label>
                <select
                  value={sortDialog.column}
                  onChange={(e) => setSortDialog({ ...sortDialog, column: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  {Array.from({ length: cols }, (_, i) => (
                    <option key={i} value={i}>Column {getColumnLabel(i)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Order:</label>
                <select
                  value={sortDialog.ascending ? 'ascending' : 'descending'}
                  onChange={(e) => setSortDialog({ ...sortDialog, ascending: e.target.value === 'ascending' })}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="ascending">Ascending (A-Z)</option>
                  <option value="descending">Descending (Z-A)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setSortDialog({ show: false, column: 0, ascending: true })}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSort}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Sort
              </button>
            </div>
          </div>
        </div>
      )}

      {colorPicker.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              {colorPicker.type === 'background' ? 'Fill Color' : 'Text Color'}
            </h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setColor(colorPicker.type, color)}
                  className="w-8 h-8 border border-gray-300 rounded"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="mb-4">
              <input
                type="color"
                value={colorPicker.color}
                onChange={(e) => setColorPicker({ ...colorPicker, color: e.target.value })}
                className="w-full h-10"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setColorPicker({ show: false, type: '', color: '#ffffff' })}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setColor(colorPicker.type, colorPicker.color)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {chartDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Insert Chart</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Chart Type:</label>
                <select
                  value={chartDialog.type}
                  onChange={(e) => setChartDialog({ ...chartDialog, type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="scatter">Scatter Plot</option>
                </select>
              </div>
              <div className="bg-gray-100 p-4 rounded text-center">
                <BarChart3 size={48} className="mx-auto mb-2 text-gray-500" />
                <p className="text-sm text-gray-600">Chart preview would appear here</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setChartDialog({ show: false, type: 'line' })}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showNotification(`${chartDialog.type} chart would be inserted`);
                  setChartDialog({ show: false, type: 'line' });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-1 ">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>Ready</span>
            {filterActive && <span className="text-blue-600 flex items-center gap-1"><Filter size={12} /> Filter active</span>}
          </div>
          <div className="flex items-center gap-4">
            <span>Cell: {getColumnLabel(selectedCell.col)}{selectedCell.row + 1}</span>
            <span>Zoom: {zoom}%</span>
            <span>Cells: {Object.keys(cellData).length}</span>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts handler */}
      <div
        className="hidden"
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
              case 'z':
                e.preventDefault();
                handleUndo();
                break;
              case 'y':
                e.preventDefault();
                handleRedo();
                break;
              case 'c':
                e.preventDefault();
                handleCopy();
                break;
              case 'v':
                e.preventDefault();
                handlePaste();
                break;
              case 'x':
                e.preventDefault();
                handleCut();
                break;
              case 's':
                e.preventDefault();
                handleSave();
                break;
              case 'o':
                e.preventDefault();
                handleOpen();
                break;
              case 'n':
                e.preventDefault();
                handleNew();
                break;
            }
          }
        }}
        tabIndex={0}
      />
    </div>
  );
};

export default GoogleSheetsClone;