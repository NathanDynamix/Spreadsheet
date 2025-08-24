import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, AreaChart, Area
} from 'recharts';
import { Upload, Filter, Download, Settings, BarChart3, TrendingUp, Target, DollarSign, Activity, Gauge, Grid3X3, X, Eye, Table, Plus, Trash2, Move, Maximize, CreditCard, Users, ShoppingCart, TrendingDown, Calculator, ChevronDown, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import _ from 'lodash';
import { Rnd } from 'react-rnd';


const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#06b6d4', '#84cc16', '#f97316'];
const CHART_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

// Google Sheets-like formulas
const FORMULAS = {
  // Math Functions
  SUM: (values) => values.reduce((a, b) => a + b, 0),
  AVERAGE: (values) => values.reduce((a, b) => a + b, 0) / values.length,
  COUNT: (values) => values.length,
  MAX: (values) => Math.max(...values),
  MIN: (values) => Math.min(...values),
  MEDIAN: (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },
  STDEV: (values) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
  },
  VAR: (values) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  },

  // Text Functions
  CONCATENATE: (...args) => args.join(''),
  UPPER: (text) => String(text).toUpperCase(),
  LOWER: (text) => String(text).toLowerCase(),
  LEN: (text) => String(text).length,
  LEFT: (text, num) => String(text).substring(0, num),
  RIGHT: (text, num) => String(text).substring(String(text).length - num),
  MID: (text, start, num) => String(text).substring(start - 1, start - 1 + num),

  // Logical Functions
  IF: (condition, trueValue, falseValue) => condition ? trueValue : falseValue,
  AND: (...conditions) => conditions.every(Boolean),
  OR: (...conditions) => conditions.some(Boolean),
  NOT: (condition) => !condition,

  // Date Functions
  TODAY: () => new Date(),
  NOW: () => new Date(),
  YEAR: (date) => new Date(date).getFullYear(),
  MONTH: (date) => new Date(date).getMonth() + 1,
  DAY: (date) => new Date(date).getDate(),

  // Financial Functions
  PMT: (rate, nper, pv) => {
    if (rate === 0) return -pv / nper;
    return -pv * (rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
  },
  FV: (rate, nper, pmt, pv = 0) => {
    if (rate === 0) return -(pv + pmt * nper);
    return -(pv * Math.pow(1 + rate, nper) + pmt * ((Math.pow(1 + rate, nper) - 1) / rate));
  },
  PV: (rate, nper, pmt, fv = 0) => {
    if (rate === 0) return -(fv + pmt * nper);
    return -(fv + pmt * ((Math.pow(1 + rate, nper) - 1) / rate)) / Math.pow(1 + rate, nper);
  },

  // Lookup Functions
  VLOOKUP: (lookup, table, colIndex, exactMatch = false) => {
    for (let row of table) {
      if (exactMatch ? row[0] === lookup : String(row[0]).includes(String(lookup))) {
        return row[colIndex - 1];
      }
    }
    return '#N/A';
  },
  INDEX: (array, row, col = 1) => array[row - 1] && array[row - 1][col - 1],
  MATCH: (lookup, array, type = 1) => {
    const index = array.findIndex(item => item === lookup);
    return index >= 0 ? index + 1 : '#N/A';
  }
};

const AdvancedBIDashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filters, setFilters] = useState({});
  const [charts, setCharts] = useState([]);
  const [cards, setCards] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [draggedChart, setDraggedChart] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedColumns, setSelectedColumns] = useState({ x: '', y: [] });
  const [chartType, setChartType] = useState('bar');
  const [showFilters, setShowFilters] = useState(true);
  const [showFormulas, setShowFormulas] = useState(false);
  const [formulaInput, setFormulaInput] = useState('');
  const [formulaResult, setFormulaResult] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [calculatedColumns, setCalculatedColumns] = useState({});
  const [editingCardId, setEditingCardId] = useState(null);

  // Sample data with more realistic business data
  // const sampleData = [
  //   { product: 'iPhone 14', price: 999, category: 'Electronics', sales: 12500, profit: 4000, expenses: 1200, quantity: 125, date: '2024-01-15', region: 'North America' },
  //   { product: 'Samsung TV', price: 1299, category: 'Electronics', sales: 8900, profit: 2800, expenses: 900, quantity: 89, date: '2024-01-20', region: 'Europe' },
  //   { product: 'Nike Shoes', price: 149, category: 'Clothing', sales: 3500, profit: 1200, expenses: 400, quantity: 235, date: '2024-01-25', region: 'Asia' },
  //   { product: 'MacBook Pro', price: 2499, category: 'Electronics', sales: 18750, profit: 6500, expenses: 1800, quantity: 75, date: '2024-02-01', region: 'North America' },
  //   { product: 'Adidas Jacket', price: 89, category: 'Clothing', sales: 2100, profit: 750, expenses: 250, quantity: 156, date: '2024-02-05', region: 'Europe' },
  //   { product: 'iPad Air', price: 649, category: 'Electronics', sales: 9750, profit: 3200, expenses: 950, quantity: 150, date: '2024-02-10', region: 'Asia' },
  //   { product: 'Book Set', price: 45, category: 'Books', sales: 900, profit: 300, expenses: 100, quantity: 200, date: '2024-02-15', region: 'North America' },
  //   { product: 'Gaming Chair', price: 299, category: 'Furniture', sales: 4200, profit: 1400, expenses: 420, quantity: 140, date: '2024-02-20', region: 'Europe' }
  // ];

  useEffect(() => {
    if (data.length === 0) return;

      // Set charts
const initialCharts = [
  {
    id: 1,
    type: 'bar',
    title: 'Sales by Product',
    xColumn: 'product',
    yColumns: ['sales'],
    position: { x: 50, y: 50 },
    size: { width: 450, height: 300 }
  },
  {
    id: 2,
    type: 'line',
    title: 'Profit vs Expenses',
    xColumn: 'product',
    yColumns: ['profit', 'expenses'],
    position: { x: 520, y: 50 },
    size: { width: 450, height: 300 }
  },
  {
    id: 3,
    type: 'pie',
    title: 'Sales by Category',
    xColumn: 'category',
    yColumns: ['sales'],
    position: { x: 50, y: 370 },
    size: { width: 450, height: 300 }
  }
];
setCharts(initialCharts);

// Set KPI cards
const newCards = [
  { id: 1, title: 'Total Revenue', value: _.sumBy(jsonData, 'sales'), format: 'currency', icon: 'sales', color: 'bg-blue-500' },
  { id: 2, title: 'Total Profit', value: _.sumBy(jsonData, 'profit'), format: 'currency', icon: 'profit', color: 'bg-green-500' },
  { id: 3, title: 'Products Sold', value: _.sumBy(jsonData, 'quantity'), format: 'number', icon: 'products', color: 'bg-purple-500' },
  { id: 4, title: 'Avg Order Value', value: _.meanBy(jsonData, 'price'), format: 'currency', icon: 'price', color: 'bg-orange-500' },
  { id: 5, title: 'Profit Margin', value: (_.sumBy(jsonData, 'profit') / _.sumBy(jsonData, 'sales') * 100), format: 'percentage', icon: 'margin', color: 'bg-indigo-500' },
  { id: 6, title: 'Categories', value: _.uniq(jsonData.map(item => item.category)).length, format: 'number', icon: 'categories', color: 'bg-pink-500' }
];
setCards(newCards);
    
  }, []);



  const updateCardTitle = (cardId, newTitle) => {
    setCards(prev =>
      prev.map(card => card.id === cardId ? { ...card, title: newTitle } : card)
    );
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...data];

    Object.entries(filters).forEach(([column, filterValue]) => {
      if (filterValue && filterValue !== '' && filterValue !== 'all') {
        if (typeof data[0]?.[column] === 'string') {
          filtered = filtered.filter(row => {
            const cellValue = String(row[column]).toLowerCase();
            const searchValue = String(filterValue).toLowerCase();
            return cellValue.includes(searchValue);
          });
        } else if (typeof data[0]?.[column] === 'number') {
          const numFilter = parseFloat(filterValue);
          if (!isNaN(numFilter)) {
            filtered = filtered.filter(row => row[column] >= numFilter);
          }
        }
      }
    });

    setFilteredData(filtered);
    updateCards(filtered);
  }, [filters, data]);

  const updateCards = (filteredData) => {
    if (filteredData.length > 0) {
      const updatedCards = [
        { id: 1, title: 'Total Revenue', value: _.sumBy(filteredData, 'sales'), format: 'currency', icon: 'sales', color: 'bg-blue-500' },
        { id: 2, title: 'Total Profit', value: _.sumBy(filteredData, 'profit'), format: 'currency', icon: 'profit', color: 'bg-green-500' },
        { id: 3, title: 'Products Sold', value: _.sumBy(filteredData, 'quantity'), format: 'number', icon: 'products', color: 'bg-purple-500' },
        { id: 4, title: 'Avg Order Value', value: _.meanBy(filteredData, 'price'), format: 'currency', icon: 'price', color: 'bg-orange-500' },
        { id: 5, title: 'Profit Margin', value: (_.sumBy(filteredData, 'profit') / _.sumBy(filteredData, 'sales') * 100), format: 'percentage', icon: 'margin', color: 'bg-indigo-500' },
        { id: 6, title: 'Categories', value: _.uniq(filteredData.map(item => item.category)).length, format: 'number', icon: 'categories', color: 'bg-pink-500' }
      ];
      setCards(updatedCards);
    }
  };

  // Execute formula
  const executeFormula = (formula) => {
    try {
      // Simple formula parser
      const formulaUpper = formula.toUpperCase().trim();

      if (formulaUpper.startsWith('=')) {
        const expr = formulaUpper.substring(1);

        // Handle SUM function
        if (expr.includes('SUM(')) {
          const match = expr.match(/SUM\(([^)]+)\)/);
          if (match) {
            const columnName = match[1].toLowerCase();
            const values = filteredData.map(row => row[columnName]).filter(v => typeof v === 'number');
            return FORMULAS.SUM(values);
          }
        }

        // Handle AVERAGE function
        if (expr.includes('AVERAGE(')) {
          const match = expr.match(/AVERAGE\(([^)]+)\)/);
          if (match) {
            const columnName = match[1].toLowerCase();
            const values = filteredData.map(row => row[columnName]).filter(v => typeof v === 'number');
            return FORMULAS.AVERAGE(values);
          }
        }

        // Handle COUNT function
        if (expr.includes('COUNT(')) {
          const match = expr.match(/COUNT\(([^)]+)\)/);
          if (match) {
            const columnName = match[1].toLowerCase();
            const values = filteredData.map(row => row[columnName]).filter(v => v != null);
            return FORMULAS.COUNT(values);
          }
        }

        // Handle MAX function
        if (expr.includes('MAX(')) {
          const match = expr.match(/MAX\(([^)]+)\)/);
          if (match) {
            const columnName = match[1].toLowerCase();
            const values = filteredData.map(row => row[columnName]).filter(v => typeof v === 'number');
            return FORMULAS.MAX(values);
          }
        }

        // Handle MIN function
        if (expr.includes('MIN(')) {
          const match = expr.match(/MIN\(([^)]+)\)/);
          if (match) {
            const columnName = match[1].toLowerCase();
            const values = filteredData.map(row => row[columnName]).filter(v => typeof v === 'number');
            return FORMULAS.MIN(values);
          }
        }
      }

      return 'Invalid formula';
    } catch (error) {
      return 'Error: ' + error.message;
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
          setData(jsonData);
          setFilteredData(jsonData);
          setColumns(Object.keys(jsonData[0]));
          setFilters({});
          const newCards = [
            { id: 1, title: 'Total Revenue', value: _.sumBy(jsonData, 'sales'), format: 'currency', icon: 'sales', color: 'bg-blue-500' },
            { id: 2, title: 'Total Profit', value: _.sumBy(jsonData, 'profit'), format: 'currency', icon: 'profit', color: 'bg-green-500' },
            { id: 3, title: 'Products Sold', value: _.sumBy(jsonData, 'quantity'), format: 'number', icon: 'products', color: 'bg-purple-500' },
            { id: 4, title: 'Avg Order Value', value: _.meanBy(jsonData, 'price'), format: 'currency', icon: 'price', color: 'bg-orange-500' },
            { id: 5, title: 'Profit Margin', value: (_.sumBy(jsonData, 'profit') / _.sumBy(jsonData, 'sales') * 100), format: 'percentage', icon: 'margin', color: 'bg-indigo-500' },
            { id: 6, title: 'Categories', value: _.uniq(jsonData.map(item => item.category)).length, format: 'number', icon: 'categories', color: 'bg-pink-500' }
          ];
          setCards(newCards);

        }
      } catch (error) {
        alert('Error reading file. Please ensure it\'s a valid Excel file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Get column type
  const getColumnType = (column) => {
    if (data.length === 0) return 'string';
    const sample = data[0][column];
    return typeof sample === 'number' ? 'number' : 'string';
  };

  // Get unique values for string columns
  const getUniqueValues = (column) => {
    return [...new Set(data.map(row => row[column]))].filter(Boolean).sort();
  };

  // Add new chart
  const addChart = () => {
    if (!selectedColumns.x || selectedColumns.y.length === 0) {
      alert('Please select X-axis and at least one Y-axis column');
      return;
    }

    const newChart = {
      id: Date.now(),
      type: chartType,
      title: `${selectedColumns.x} vs ${selectedColumns.y.join(', ')}`,
      xColumn: selectedColumns.x,
      yColumns: selectedColumns.y,
      position: { x: Math.random() * 100 + 50, y: Math.random() * 100 + 50 },
      size: { width: 450, height: 300 }
    };

    setCharts([...charts, newChart]);
    setSelectedColumns({ x: '', y: [] });
  };

  // Remove chart
  const removeChart = (chartId) => {
    setCharts(charts.filter(chart => chart.id !== chartId));
  };

  // Handle Y-axis selection
  const toggleYAxis = (column) => {
    const newYColumns = selectedColumns.y.includes(column)
      ? selectedColumns.y.filter(col => col !== column)
      : [...selectedColumns.y, column];
    setSelectedColumns({ ...selectedColumns, y: newYColumns });
  };

  // Format value for cards
  const formatValue = (value, format) => {
    if (!value && value !== 0) return '0';
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  // Get icon for card
  const getCardIcon = (iconType) => {
    switch (iconType) {
      case 'sales': return <ShoppingCart size={20} />;
      case 'profit': return <TrendingUp size={20} />;
      case 'products': return <Grid3X3 size={20} />;
      case 'price': return <DollarSign size={20} />;
      case 'margin': return <Target size={20} />;
      case 'categories': return <Activity size={20} />;
      default: return <Activity size={20} />;
    }
  };

  // Handle chart drag
  const handleMouseDown = (e, chartId) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedChart(chartId);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (draggedChart) {
      const container = document.getElementById('chart-container');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const newX = e.clientX - containerRect.left - dragOffset.x;
        const newY = e.clientY - containerRect.top - dragOffset.y;

        setCharts(charts.map(chart =>
          chart.id === draggedChart
            ? { ...chart, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
            : chart
        ));
      }
    }
  };

  const handleMouseUp = () => {
    setDraggedChart(null);
  };

  // Handle formula execution
  const handleFormulaSubmit = () => {
    const result = executeFormula(formulaInput);
    setFormulaResult(result);
  };

  // Render chart based on type
  const renderChart = (chart) => {
    if (!chart.xColumn || chart.yColumns.length === 0 || filteredData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <BarChart3 size={48} className="mx-auto mb-2 text-gray-300" />
            <p>No data available</p>
          </div>
        </div>
      );
    }

    if (chart.type === 'pie') {
      // For pie charts, group data by x column and sum y values
      const groupedData = _.groupBy(filteredData, chart.xColumn);
      const pieData = Object.entries(groupedData).map(([key, values]) => ({
        name: key,
        value: _.sumBy(values, chart.yColumns[0])
      }));

      return (
        <PieChart data={pieData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      );
    }

    const chartData = filteredData.map(row => {
      const item = { name: String(row[chart.xColumn] || '') };
      chart.yColumns.forEach(col => {
        item[col] = row[col] || 0;
      });
      return item;
    });

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 40 }
    };

    switch (chart.type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" fontSize={11} angle={-45} textAnchor="end" height={80} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Legend />
            {chart.yColumns.map((col, idx) => (
              <Bar key={col} dataKey={col} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
            ))}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" fontSize={11} angle={-45} textAnchor="end" height={80} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Legend />
            {chart.yColumns.map((col, idx) => (
              <Line
                key={col}
                type="monotone"
                dataKey={col}
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" fontSize={11} angle={-45} textAnchor="end" height={80} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Legend />
            {chart.yColumns.map((col, idx) => (
              <Area
                key={col}
                type="monotone"
                dataKey={col}
                stackId="1"
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                fill={CHART_COLORS[idx % CHART_COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        ); case 'stackedBar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {chart.yColumns.map((col, idx) => (
              <Bar key={col} dataKey={col} stackId="a" fill={CHART_COLORS[idx % CHART_COLORS.length]} />
            ))}
          </BarChart>
        ); case 'radialBar':
        const radialData = chart.yColumns.map((col, idx) => ({
          name: col,
          value: _.sumBy(filteredData, col),
          fill: CHART_COLORS[idx % CHART_COLORS.length]
        }));
        return (
          <RadialBarChart width={300} height={300} innerRadius="10%" outerRadius="80%" data={radialData}>
            <RadialBar dataKey="value" label background />
            <Legend iconSize={10} layout="vertical" verticalAlign="middle" />
            <Tooltip />
          </RadialBarChart>
        ); case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid stroke="#f5f5f5" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {chart.yColumns.map((col, idx) => {
              if (idx % 3 === 0) return <Bar key={col} dataKey={col} fill={CHART_COLORS[idx % CHART_COLORS.length]} />;
              if (idx % 3 === 1) return <Line key={col} dataKey={col} stroke={CHART_COLORS[idx % CHART_COLORS.length]} />;
              return <Area key={col} dataKey={col} fill={CHART_COLORS[idx % CHART_COLORS.length]} />;
            })}
          </ComposedChart>
        ); case 'funnel':
        const funnelData = chart.yColumns.map(col => ({
          label: col,
          value: _.sumBy(filteredData, col)
        }));

        const maxVal = Math.max(...funnelData.map(f => f.value));
        return (
          <div className="space-y-2 p-4">
            {funnelData.map((item, idx) => (
              <div key={item.label} className="text-xs">
                <div className="flex justify-between">
                  <span>{item.label}</span>
                  <span>{item.value.toLocaleString()}</span>
                </div>
                <div className="h-4 bg-gray-200 rounded">
                  <div
                    className={`${chart.color || 'bg-blue-500'} h-full rounded`}
                    style={{ width: `${(item.value / maxVal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ); case 'gauge':
        const gaugeValue = chart.yColumns.length
          ? _.meanBy(filteredData, chart.yColumns[0])
          : 0;
        const percent = Math.min(100, (gaugeValue / 1000) * 100); // adjust scale
        return (
          <div className="flex items-center justify-center h-full">
            <div className="relative w-40 h-40 rounded-full border-8 border-blue-500">
              <div
                className="absolute inset-0 flex items-center justify-center font-bold text-xl"
              >
                {percent.toFixed(1)}%
              </div>
            </div>
          </div>
        ); case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chart.xColumn} />
            <YAxis />
            <Tooltip />
            <Legend />
            {chart.yColumns.map((col, idx) => (
              <Scatter
                key={col}
                name={col}
                data={filteredData}
                fill={CHART_COLORS[idx % CHART_COLORS.length]}
                line
                shape="circle"
              />
            ))}
          </ScatterChart>
        ); case 'bubble':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chart.xColumn} />
            <YAxis />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            {chart.yColumns.map((col, idx) => (
              <Scatter
                key={col}
                name={col}
                data={filteredData.map(item => ({
                  ...item,
                  z: item[col]
                }))}
                fill={CHART_COLORS[idx % CHART_COLORS.length]}
              />
            ))}
          </ScatterChart>
        ); case 'combo':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {chart.yColumns.map((col, idx) =>
              idx % 2 === 0 ? (
                <Bar key={col} dataKey={col} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ) : (
                <Line
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  strokeWidth={2}
                />
              )
            )}
          </LineChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Left Sidebar - Chart Builder */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="text-blue-600" size={24} />
            <h1 className="text-lg font-bold text-gray-800">BI Dashboard</h1>
          </div>
          <p className="text-xs text-gray-600">Advanced Business Intelligence</p>
        </div>

        {/* Upload Data */}
        <div className="p-4 border-b border-gray-200">
          <label className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg cursor-pointer transition-colors border border-blue-200 text-sm">
            <Upload size={16} />
            <span className="font-medium">Upload Data</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Chart Builder */}
        <div className="p-4 border-b border-gray-200 flex-1 overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
            <Plus size={16} />
            Chart Builder
          </h3>

          <div className="space-y-3">
            {/* Chart Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
              >
                <option value="bar">Bar Chart</option>
                <option value="stackedBar">Stacked Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="scatter">Scatter Chart</option>
                <option value="bubble">Bubble Chart</option>
                <option value="combo">Combo Chart (Bar + Line)</option>
                <option value="radialBar">Radial Bar Chart</option>
                <option value="composed">Composed Chart</option>
                <option value="funnel">Funnel Chart (custom)</option>
                <option value="gauge">Gauge (custom static)</option>
              </select>
            </div>

            {/* X-Axis Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">X-Axis</label>
              <select
                value={selectedColumns.x}
                onChange={(e) => setSelectedColumns({ ...selectedColumns, x: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
              >
                <option value="">Select Column</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Y-Axis Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Y-Axis</label>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {columns.filter(col => getColumnType(col) === 'number').map(col => (
                  <label key={col} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedColumns.y.includes(col)}
                      onChange={() => toggleYAxis(col)}
                      className="text-blue-600"
                    />
                    <span className="text-xs text-gray-700">{col}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={addChart}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-xs"
            >
              <Plus size={14} />
              Add Chart
            </button>
          </div>
        </div>

        {/* Formula Bar */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => setShowFormulas(!showFormulas)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-purple-600" />
              <span className="font-semibold text-gray-800 text-sm">Formula Bar</span>
            </div>
            {showFormulas ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {showFormulas && (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="=SUM(sales), =AVERAGE(profit), =MAX(price)"
                    value={formulaInput}
                    onChange={(e) => setFormulaInput(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleFormulaSubmit}
                    className="flex-1 bg-purple-600 text-white px-2 py-1 rounded-md hover:bg-purple-700 transition-colors text-xs"
                  >
                    Execute
                  </button>
                  <button
                    onClick={() => setFormulaInput('')}
                    className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-xs"
                  >
                    Clear
                  </button>
                </div>
                {formulaResult && (
                  <div className="p-2 bg-white border border-gray-300 rounded-md">
                    <span className="text-xs font-mono text-gray-800">{formulaResult}</span>
                  </div>
                )}

                {/* Formula Help */}
                <div className="text-xs text-gray-600">
                  <p className="font-medium mb-1">Available Functions:</p>
                  <div className="space-y-1">
                    <p>• SUM(column) - Sum values</p>
                    <p>• AVERAGE(column) - Average</p>
                    <p>• COUNT(column) - Count items</p>
                    <p>• MAX(column) - Maximum value</p>
                    <p>• MIN(column) - Minimum value</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeView === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Eye size={14} />
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('table')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeView === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Table size={14} />
                Data
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {filteredData.length} of {data.length} records
            </span>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Main Content */}
          <div className="flex-1">
            {activeView === 'dashboard' ? (
              <div className="h-full p-4">
                {/* KPI Cards */}
                <div className="grid grid-cols-6 gap-4 mb-6">
                  {cards.map(card => (
                    <div key={card.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          {editingCardId === card.id ? (
                            <input
                              value={card.title}
                              onChange={(e) => updateCardTitle(card.id, e.target.value)}
                              onBlur={() => setEditingCardId(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCardId(null)}
                              className="text-xs font-medium text-gray-600 border border-gray-300 rounded px-1"
                              autoFocus
                            />
                          ) : (
                            <p
                              className="text-xs font-medium text-gray-600 cursor-pointer"
                              onDoubleClick={() => setEditingCardId(card.id)}
                            >
                              {card.title}
                            </p>
                          )}

                          <p className="text-lg font-bold text-gray-900 mt-1">
                            {formatValue(card.value, card.format)}
                          </p>
                        </div>
                        <div className={`${card.color} text-white p-2 rounded-lg`}>
                          {getCardIcon(card.icon)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Draggable Charts */}
                <div
                  id="chart-container"
                  className="relative h-full bg-white rounded-lg border border-gray-200"
                  style={{ minHeight: '500px' }}
                >
                  {charts.map(chart => (
                    <Rnd
                      key={chart.id}
                      size={{ width: chart.size.width, height: chart.size.height }}
                      position={{ x: chart.position.x, y: chart.position.y }}
                      bounds="parent"
                      minWidth={300}
                      minHeight={200}
                      onDragStop={(e, d) => {
                        setCharts(prev =>
                          prev.map(c =>
                            c.id === chart.id ? { ...c, position: { x: d.x, y: d.y } } : c
                          )
                        );
                      }}
                      onResizeStop={(e, direction, ref, delta, position) => {
                        setCharts(prev =>
                          prev.map(c =>
                            c.id === chart.id
                              ? {
                                ...c,
                                size: {
                                  width: parseInt(ref.style.width),
                                  height: parseInt(ref.style.height)
                                },
                                position
                              }
                              : c
                          )
                        );
                      }}
                      className="bg-white rounded-lg shadow-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between p-3 border-b border-gray-200 cursor-move">
                        <h4 className="font-medium text-gray-800 flex items-center gap-2 text-sm">
                          <Move size={14} className="text-gray-400" />
                          {chart.title}
                        </h4>
                        <button
                          onClick={() => removeChart(chart.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="p-2" style={{ height: chart.size.height - 60 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          {renderChart(chart)}
                        </ResponsiveContainer>
                      </div>
                    </Rnd>

                  ))}

                  {charts.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No charts yet</p>
                        <p className="text-sm">Use the Chart Builder to create visualizations</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full p-6 overflow-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Data Table ({filteredData.length} records)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          {columns.map(col => (
                            <th key={col} className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.slice(0, 100).map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            {columns.map(col => (
                              <td key={col} className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                                {typeof row[col] === 'number' ? row[col].toLocaleString() : row[col]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Filters */}
          <div className="w-80 bg-white border-l border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Filter size={18} />
                  Smart Filters
                </h3>
                <button
                  onClick={() => setFilters({})}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              {columns.map(column => (
                <div key={column}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {column.charAt(0).toUpperCase() + column.slice(1)}
                  </label>
                  {getColumnType(column) === 'string' ? (
                    <select
                      value={filters[column] || ''}
                      onChange={(e) => setFilters({ ...filters, [column]: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All {column}</option>
                      {getUniqueValues(column).map(value => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      placeholder={`Min ${column}`}
                      value={filters[column] || ''}
                      onChange={(e) => setFilters({ ...filters, [column]: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedBIDashboard;