import React, { useState, useEffect, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList, Treemap, RadialBarChart, 
  RadialBar
} from 'recharts';
import { Sankey } from 'recharts';
import { ResponsiveSunburst } from '@nivo/sunburst';
import GaugeChart from 'react-gauge-chart';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useSpreadsheetData } from '../context/SpreadsheetDataContext';
import { 
  Upload, FileText, Download, Settings, Eye, BarChart2, LineChart as LineChartIcon, 
  PieChart as PieChartIcon, ScatterChart as ScatterChartIcon, AreaChart as AreaChartIcon,
  Gauge as GaugeIcon, Target, DollarSign, Award, AlertTriangle,
  CheckCircle, Layers, ChevronsUp, ChevronsDown, TrendingUp, TrendingDown,
  Activity, Grid, Table, Database, Sliders, Filter
} from 'lucide-react';

const ChartLibrary = () => {
  // Consolidated state management
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [dataView, setDataView] = useState('chart');
  
  const [chartConfig, setChartConfig] = useState({
    xAxis: '',
    yAxis: [],
    colors: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f']
  });

  const { spreadsheetData, source } = useSpreadsheetData();

  // Sample data fallback
  const sampleData = [
    { product: 'Apple', price: 500, category: 'Jan', sales: 4000, profit: 2400, expenses: 1600 },
    { product: 'Orange', price: 200, category: 'Feb', sales: 3000, profit: 1398, expenses: 1602 },
    { product: 'Grapes', price: 800, category: 'Mar', sales: 2000, profit: 9800, expenses: 800 },
    { product: 'Mango', price: 1000, category: 'Apr', sales: 2780, profit: 3908, expenses: 872 },
    { product: 'Guava', price: 300, category: 'May', sales: 1890, profit: 4800, expenses: 1090 },
    { product: 'Pineapple', price: 398, category: 'Jun', sales: 2390, profit: 3800, expenses: 590 }
  ];

  // Enhanced data processing function
  const processIncomingData = (rawData) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return sampleData;
    }

    // Remove completely empty rows
    const filteredData = rawData.filter(row => 
      row && typeof row === 'object' && 
      Object.values(row).some(val => 
        val !== null && val !== undefined && val !== '' && !isNaN(val) || 
        (typeof val === 'string' && val.trim() !== '')
      )
    );

    if (filteredData.length === 0) {
      return sampleData;
    }

    // Get all possible keys from all rows
    const allKeys = new Set();
    filteredData.forEach(row => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach(key => {
          if (key && key.trim() !== '') {
            allKeys.add(key.trim());
          }
        });
      }
    });

    // Process each row to ensure consistent structure and proper data types
    return filteredData.map((row, index) => {
      const processedRow = {};
      
      allKeys.forEach(key => {
        let value = row[key];
        
        // Handle various data types
        if (value === null || value === undefined) {
          processedRow[key] = '';
        } else if (typeof value === 'string') {
          const trimmedValue = value.trim();
          // Try to convert numeric strings to numbers
          if (trimmedValue !== '' && !isNaN(trimmedValue) && !isNaN(parseFloat(trimmedValue))) {
            processedRow[key] = parseFloat(trimmedValue);
          } else {
            processedRow[key] = trimmedValue;
          }
        } else if (typeof value === 'number') {
          processedRow[key] = isNaN(value) ? 0 : value;
        } else {
          processedRow[key] = String(value);
        }
      });
      
      return processedRow;
    });
  };

  // Initialize data from context or fallback
  useEffect(() => {
    if (spreadsheetData && spreadsheetData.length > 0) {
      const processedData = processIncomingData(spreadsheetData);
      setData(processedData);
      
      if (processedData.length > 0) {
        const newColumns = Object.keys(processedData[0]);
        setColumns(newColumns);
        setFileName(source === 'spreadsheet' ? 'Current Spreadsheet' : 'Imported Data');
        
        // Auto-configure chart with first available columns
        const firstCol = newColumns.find(col => 
          processedData.some(row => typeof row[col] === 'string')
        ) || newColumns[0];
        
        const numericCols = newColumns.filter(col => 
          processedData.some(row => typeof row[col] === 'number' && !isNaN(row[col]))
        );
        
        setChartConfig(prev => ({
          ...prev,
          xAxis: firstCol || '',
          yAxis: numericCols.length > 0 ? [numericCols[0]] : [newColumns[1] || newColumns[0] || '']
        }));
      }
    } else {
      // Fallback to sample data
      const processedSample = processIncomingData(sampleData);
      setData(processedSample);
      setColumns(['product', 'price', 'category', 'sales', 'profit', 'expenses']);
      setFileName('Sample Data');
      setChartConfig(prev => ({
        ...prev,
        xAxis: 'category',
        yAxis: ['sales', 'profit']
      }));
    }
  }, [spreadsheetData, source]);

  // Enhanced file upload handler
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setFileName(file.name);
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'csv') {
      Papa.parse(file, {
        complete: (result) => {
          console.log('CSV Parse Result:', result);
          if (result.errors.length > 0) {
            console.warn('CSV Parse Errors:', result.errors);
          }
          processUploadedData(result.data);
        },
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(), // Clean headers
        transform: (value, field) => {
          if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed === '' ? null : trimmed;
          }
          return value;
        }
      });
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { 
            type: 'array',
            cellDates: true,
            cellNF: false,
            cellText: false
          });
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Enhanced JSON conversion with better options
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Get array of arrays first
            defval: '', // Default value for empty cells
            blankrows: false
          });
          
          console.log('Raw Excel Data:', jsonData);
          
          if (jsonData.length > 1) {
            // Convert array of arrays to array of objects
            const headers = jsonData[0].map(header => 
              typeof header === 'string' ? header.trim() : String(header || '').trim()
            ).filter(h => h !== '');
            
            const rows = jsonData.slice(1).map(row => {
              const obj = {};
              headers.forEach((header, index) => {
                const value = row[index];
                obj[header] = value !== undefined ? value : '';
              });
              return obj;
            });
            
            console.log('Processed Excel Data:', rows);
            processUploadedData(rows);
          } else {
            console.warn('Excel file appears to be empty');
            setLoading(false);
          }
        } catch (error) {
          console.error('Error processing Excel file:', error);
          alert('Error processing Excel file. Please check the file format.');
          setLoading(false);
        }
      };
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Error reading file');
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Please upload a CSV or Excel file');
      setLoading(false);
    }
  };

  const processUploadedData = (rawData) => {
    try {
      console.log('Processing uploaded data:', rawData);
      
      const processedData = processIncomingData(rawData);
      console.log('Processed data:', processedData);
      
      if (processedData.length === 0) {
        alert('No valid data found in the uploaded file');
        setLoading(false);
        return;
      }
      
      setData(processedData);
      
      const newColumns = Object.keys(processedData[0] || {});
      setColumns(newColumns);
      
      // Smart column detection and auto-configuration
      if (newColumns.length > 0) {
        // Find the best X-axis column (preferably categorical/string)
        const categoricalCols = newColumns.filter(col => 
          processedData.some(row => 
            typeof row[col] === 'string' && row[col] !== ''
          )
        );
        
        // Find numeric columns for Y-axis
        const numericCols = newColumns.filter(col => 
          processedData.some(row => 
            typeof row[col] === 'number' && !isNaN(row[col]) && row[col] !== 0
          )
        );
        
        const bestXAxis = categoricalCols[0] || newColumns[0];
        const bestYAxis = numericCols.length > 0 ? [numericCols[0]] : 
                         newColumns.length > 1 ? [newColumns[1]] : [newColumns[0]];
        
        setChartConfig(prev => ({
          ...prev,
          xAxis: bestXAxis,
          yAxis: bestYAxis
        }));
        
        console.log('Auto-configured:', { xAxis: bestXAxis, yAxis: bestYAxis });
      }
      
      // Clear existing filters
      setFilters({});
      
    } catch (error) {
      console.error('Error processing uploaded data:', error);
      alert('Error processing uploaded data');
    } finally {
      setLoading(false);
    }
  };

  // Process data with filters and sorting
  const processedData = useMemo(() => {
    if (!data.length) return [];
    
    let result = [...data];
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        result = result.filter(item => {
          const itemValue = item[key];
          if (itemValue === null || itemValue === undefined) return false;
          return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
        });
      }
    });
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Handle null/undefined values
        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';
        
        // Convert to comparable format
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // String comparison
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [data, filters, sortConfig]);

  // Get chart data with proper validation
  const getChartData = () => {
    if (!processedData.length || !chartConfig.xAxis) {
      console.log('No processed data or xAxis configured');
      return [];
    }
    
    const chartData = processedData.map(row => {
      const item = { [chartConfig.xAxis]: row[chartConfig.xAxis] };
      
      chartConfig.yAxis.forEach(col => {
        const value = row[col];
        // Convert to number if possible, otherwise use 0
        if (typeof value === 'number' && !isNaN(value)) {
          item[col] = value;
        } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
          item[col] = parseFloat(value);
        } else {
          item[col] = 0;
        }
      });
      
      return item;
    }).filter(item => {
      // Filter out items where xAxis is empty or invalid
      const xValue = item[chartConfig.xAxis];
      return xValue !== null && xValue !== undefined && xValue !== '';
    });
    
    console.log('Chart data generated:', chartData);
    return chartData;
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!processedData.length || !chartConfig.yAxis.length) return {};
    
    const stats = {};
    chartConfig.yAxis.forEach(col => {
      const values = processedData.map(row => {
        const val = row[col];
        return typeof val === 'number' ? val : parseFloat(val);
      }).filter(val => !isNaN(val) && isFinite(val));
      
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        stats[col] = {
          sum,
          avg: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
          last: values[values.length - 1] || 0,
          first: values[0] || 0,
          trend: values.length > 1 ? ((values[values.length - 1] - values[0]) / Math.abs(values[0]) || 0) : 0
        };
      }
    });
    return stats;
  }, [processedData, chartConfig.yAxis]);

  // Column selection handlers
  const handleColumnSelect = (column, type) => {
    if (type === 'x') {
      setChartConfig(prev => ({ ...prev, xAxis: column }));
    } else if (type === 'y') {
      setChartConfig(prev => ({
        ...prev,
        yAxis: prev.yAxis.includes(column) 
          ? prev.yAxis.filter(col => col !== column)
          : [...prev.yAxis, column]
      }));
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Enhanced chart types with categories
  const chartTypes = [
    // Cards
    { id: 'numberCard', name: 'Number Card', icon: DollarSign, category: 'Cards' },
    { id: 'kpiCard', name: 'KPI Card', icon: Target, category: 'Cards' },
    { id: 'gaugeCard', name: 'Gauge Card', icon: GaugeIcon, category: 'Cards' },
    { id: 'metricCard', name: 'Metric Card', icon: Award, category: 'Cards' },
    { id: 'trendCard', name: 'Trend Card', icon: TrendingUp, category: 'Cards' },
    { id: 'statusCard', name: 'Status Card', icon: Activity, category: 'Cards' },
    
    // Bar/Column Charts
    { id: 'bar', name: 'Bar Chart', icon: BarChart2, category: 'Bar/Column' },
    { id: 'stackedBar', name: 'Stacked Bar', icon: BarChart2, category: 'Bar/Column' },
    { id: 'horizontalBar', name: 'Horizontal Bar', icon: BarChart2, category: 'Bar/Column' },
    { id: 'groupedBar', name: 'Grouped Bar', icon: BarChart2, category: 'Bar/Column' },
    { id: 'waterfall', name: 'Waterfall Chart', icon: BarChart2, category: 'Bar/Column' },
    
    // Line/Area Charts
    { id: 'line', name: 'Line Chart', icon: LineChartIcon, category: 'Line/Area' },
    { id: 'multiLine', name: 'Multi-Line Chart', icon: LineChartIcon, category: 'Line/Area' },
    { id: 'area', name: 'Area Chart', icon: AreaChartIcon, category: 'Line/Area' },
    { id: 'stackedArea', name: 'Stacked Area', icon: AreaChartIcon, category: 'Line/Area' },
    
    // Pie/Doughnut Charts
    { id: 'pie', name: 'Pie Chart', icon: PieChartIcon, category: 'Pie/Doughnut' },
    { id: 'doughnut', name: 'Doughnut Chart', icon: PieChartIcon, category: 'Pie/Doughnut' },
    { id: 'radialBar', name: 'Radial Bar', icon: PieChartIcon, category: 'Pie/Doughnut' },
    
    // Scatter/Bubble
    { id: 'scatter', name: 'Scatter Plot', icon: ScatterChartIcon, category: 'Scatter/Bubble' },
    { id: 'bubble', name: 'Bubble Chart', icon: ScatterChartIcon, category: 'Scatter/Bubble' },
    
    // Special Charts
    { id: 'radar', name: 'Radar Chart', icon: Activity, category: 'Special' },
    { id: 'treemap', name: 'Treemap', icon: Layers, category: 'Special' },
    { id: 'sunburst', name: 'Sunburst', icon: Layers, category: 'Special' },
    { id: 'funnel', name: 'Funnel Chart', icon: Filter, category: 'Special' },
    { id: 'gauge', name: 'Gauge Chart', icon: GaugeIcon, category: 'Special' }
  ];

  // Enhanced card components
  const renderCard = (type, data, title, value, subtitle) => {
    const formatValue = (val) => {
      if (typeof val === 'number' && isFinite(val)) {
        return val > 1000000 ? `${(val / 1000000).toFixed(1)}M` : 
               val > 1000 ? `${(val / 1000).toFixed(1)}K` : 
               val.toFixed(2);
      }
      return String(val || '0');
    };

    const cardClasses = "bg-white rounded-lg shadow p-4 border-l-4 flex flex-col h-full";
    
    switch(type) {
      case 'number':
        return (
          <div key={title} className={`${cardClasses} border-l-blue-500`}>
            <div className="flex items-center mb-2">
              <DollarSign className="text-blue-500 mr-2" size={18} />
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{formatValue(value)}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        );
      
      case 'kpi':
        const isPositive = parseFloat(value) >= 0;
        return (
          <div key={title} className={`${cardClasses} border-l-green-500`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              <Target className="text-green-500" size={18} />
            </div>
            <p className="text-2xl font-bold text-green-600 mb-1">{formatValue(value)}</p>
            <div className="flex items-center text-xs">
              {isPositive ? (
                <ChevronsUp className="text-green-500 mr-1" size={14} />
              ) : (
                <ChevronsDown className="text-red-500 mr-1" size={14} />
              )}
              <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(parseFloat(value) || 0).toFixed(2)}%
              </span>
              <span className="text-gray-500 ml-1">{subtitle}</span>
            </div>
          </div>
        );

      case 'gauge':
        const maxVal = summaryStats[chartConfig.yAxis[0]]?.max || 100;
        const percentage = Math.min((parseFloat(value) / maxVal) * 100, 100);
        return (
          <div key={title} className={`${cardClasses} border-l-purple-500`}>
            <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
            <div className="relative pt-1 flex-grow flex flex-col justify-center">
              <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-purple-200">
                <div 
                  style={{ width: `${percentage}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">0</span>
                <span className="text-lg font-bold text-purple-600">{percentage.toFixed(1)}%</span>
                <span className="text-xs text-gray-500">100</span>
              </div>
            </div>
          </div>
        );

      case 'metric':
        return (
          <div key={title} className={`${cardClasses} border-l-orange-500`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              <Award className="text-orange-500" size={18} />
            </div>
            <p className="text-2xl font-bold text-orange-600 mb-1">{formatValue(value)}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        );

      case 'trend':
        const trendValue = parseFloat(value) || 0;
        const isTrendPositive = trendValue >= 0;
        return (
          <div key={title} className={`${cardClasses} border-l-indigo-500`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              {isTrendPositive ? (
                <TrendingUp className="text-green-500" size={18} />
              ) : (
                <TrendingDown className="text-red-500" size={18} />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{formatValue(value)}</p>
            <div className="flex items-center text-xs">
              {isTrendPositive ? (
                <ChevronsUp className="text-green-500 mr-1" size={14} />
              ) : (
                <ChevronsDown className="text-red-500 mr-1" size={14} />
              )}
              <span className={isTrendPositive ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(trendValue).toFixed(2)}%
              </span>
              <span className="text-gray-500 ml-1">vs previous</span>
            </div>
          </div>
        );

      case 'status':
        const statusValue = parseFloat(value) || 0;
        let statusColor = 'gray';
        let statusIcon = <Activity className="text-gray-500" size={18} />;

        if (statusValue > 0) {
          statusColor = 'green';
          statusIcon = <CheckCircle className="text-green-500" size={18} />;
        } else if (statusValue < 0) {
          statusColor = 'red';
          statusIcon = <AlertTriangle className="text-red-500" size={18} />;
        }

        return (
          <div key={title} className={`${cardClasses} border-l-${statusColor}-500`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              {statusIcon}
            </div>
            <p className={`text-2xl font-bold text-${statusColor}-600 mb-1`}>{formatValue(value)}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        );

      default:
        return null;
    }
  };

  // Waterfall chart data builder
  const buildWaterfallData = (rawData, { categoryField = 'category' } = {}) => {
    if (!rawData || rawData.length === 0) return [];

    const categories = ['sales', 'expenses', 'profit'];
    const chartData = [];
    let cumulative = 0;

    chartData.push({
      name: "Start",
      value: 0,
      cumulative: 0,
      fill: "#8884d8",
    });

    rawData.forEach((row) => {
      categories.forEach((field) => {
        const val = field === "expenses" ? -(row[field] || 0) : (row[field] || 0);
        cumulative += val;
        const label = `${row[categoryField] || 'Unknown'} ${field}`;

        chartData.push({
          name: label,
          value: val,
          cumulative,
          fill: field === "expenses" ? "#f87171" : "#34d399",
        });
      });
    });

    chartData.push({
      name: "End",
      value: 0,
      cumulative,
      fill: "#8884d8",
    });

    return chartData;
  };

  // Main chart rendering function
  const renderChart = () => {
    const chartData = getChartData();
    
    // Debug logging
    console.log('Rendering chart:', { 
      chartType, 
      chartData: chartData.slice(0, 3), 
      dataLength: chartData.length,
      xAxis: chartConfig.xAxis,
      yAxis: chartConfig.yAxis 
    });
    
    if (!chartData.length) {
      return (
        <div className="text-center text-gray-500 py-8">
          <p>No data available for visualization</p>
          <p className="text-sm mt-2">
            Please ensure your data has been uploaded correctly and columns are selected
          </p>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    // Card Types
    if (chartType.includes('Card')) {
      const firstYCol = chartConfig.yAxis[0];
      if (!firstYCol || !summaryStats[firstYCol]) {
        return <div className="text-center text-gray-500 py-8">Select a numeric column for card display</div>;
      }
      
      const stats = summaryStats[firstYCol];
      const cards = [];
      
      if (chartType === 'numberCard') {
        cards.push(renderCard('number', chartData, `Total ${firstYCol}`, stats.sum, `${stats.count} records`));
        cards.push(renderCard('number', chartData, `Average ${firstYCol}`, stats.avg, 'Mean value'));
        cards.push(renderCard('number', chartData, `Maximum ${firstYCol}`, stats.max, 'Highest value'));
        cards.push(renderCard('number', chartData, `Minimum ${firstYCol}`, stats.min, 'Lowest value'));
      } else if (chartType === 'kpiCard') {
        cards.push(renderCard('kpi', chartData, `${firstYCol} Performance`, stats.sum, 'Total'));
        cards.push(renderCard('kpi', chartData, `${firstYCol} Average`, stats.avg, 'Mean'));
        cards.push(renderCard('kpi', chartData, `${firstYCol} Trend`, stats.trend * 100, 'Change'));
      } else if (chartType === 'gaugeCard') {
        cards.push(renderCard('gauge', chartData, `${firstYCol} Progress`, stats.avg, ''));
        cards.push(renderCard('gauge', chartData, `${firstYCol} Completion`, stats.sum, ''));
      } else if (chartType === 'metricCard') {
        cards.push(renderCard('metric', chartData, `${firstYCol} Score`, stats.avg, ''));
        cards.push(renderCard('metric', chartData, `${firstYCol} Total`, stats.sum, ''));
      } else if (chartType === 'trendCard') {
        cards.push(renderCard('trend', chartData, `${firstYCol} Trend`, stats.trend * 100, 'Change'));
        cards.push(renderCard('trend', chartData, `${firstYCol} Growth`, (stats.last - stats.first) * 100, 'Overall'));
      } else if (chartType === 'statusCard') {
        cards.push(renderCard('status', chartData, `${firstYCol} Status`, stats.trend * 100, 'Trend'));
        cards.push(renderCard('status', chartData, `${firstYCol} Alert`, stats.last - stats.avg, 'Deviation'));
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {cards}
        </div>
      );
    }

    // Chart types
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartConfig.xAxis}
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toLocaleString() : value, 
                  name
                ]}
              />
              <Legend />
              {chartConfig.yAxis.map((col, index) => (
                <Bar 
                  key={col} 
                  dataKey={col} 
                  fill={chartConfig.colors[index % chartConfig.colors.length]} 
                  name={col}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'stackedBar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartConfig.xAxis}
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {chartConfig.yAxis.map((col, index) => (
                <Bar 
                  key={col} 
                  dataKey={col} 
                  stackId="a" 
                  fill={chartConfig.colors[index % chartConfig.colors.length]} 
                  name={col}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'horizontalBar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                dataKey={chartConfig.xAxis} 
                type="category" 
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip />
              <Legend />
              {chartConfig.yAxis.map((col, index) => (
                <Bar 
                  key={col} 
                  dataKey={col} 
                  fill={chartConfig.colors[index % chartConfig.colors.length]} 
                  name={col}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'groupedBar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartConfig.xAxis}
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {chartConfig.yAxis.map((col, index) => (
                <Bar 
                  key={col} 
                  dataKey={col} 
                  fill={chartConfig.colors[index % chartConfig.colors.length]} 
                  name={col}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'waterfall':
        const waterfallData = buildWaterfallData(processedData, { categoryField: chartConfig.xAxis });
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="value"
                stackId="a"
                fill="#8884d8"
                label={{ position: "top" }}
                isAnimationActive={false}
              >
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
      case 'multiLine':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartConfig.xAxis}
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {chartConfig.yAxis.map((col, index) => (
                <Line 
                  key={col} 
                  type="monotone" 
                  dataKey={col} 
                  stroke={chartConfig.colors[index % chartConfig.colors.length]} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={col}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartConfig.xAxis}
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {chartConfig.yAxis.map((col, index) => (
                <Area 
                  key={col} 
                  type="monotone" 
                  dataKey={col} 
                  stroke={chartConfig.colors[index % chartConfig.colors.length]} 
                  fill={chartConfig.colors[index % chartConfig.colors.length]} 
                  fillOpacity={0.4}
                  name={col}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'stackedArea':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartConfig.xAxis}
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {chartConfig.yAxis.map((col, index) => (
                <Area 
                  key={col} 
                  type="monotone" 
                  dataKey={col} 
                  stackId="1" 
                  stroke={chartConfig.colors[index % chartConfig.colors.length]} 
                  fill={chartConfig.colors[index % chartConfig.colors.length]} 
                  name={col}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = chartData.map(item => ({
          name: String(item[chartConfig.xAxis] || 'Unknown'),
          value: chartConfig.yAxis.reduce((sum, col) => {
            const val = item[col];
            return sum + (typeof val === 'number' && isFinite(val) ? val : 0);
          }, 0)
        })).filter(item => item.value > 0);
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={chartConfig.colors[index % chartConfig.colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value.toLocaleString(), 'Value']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'doughnut':
        const doughnutData = chartData.map(item => ({
          name: String(item[chartConfig.xAxis] || 'Unknown'),
          value: chartConfig.yAxis.reduce((sum, col) => {
            const val = item[col];
            return sum + (typeof val === 'number' && isFinite(val) ? val : 0);
          }, 0)
        })).filter(item => item.value > 0);
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={doughnutData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {doughnutData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={chartConfig.colors[index % chartConfig.colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value.toLocaleString(), 'Value']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'radialBar':
        const radialData = chartData.map(item => ({
          name: String(item[chartConfig.xAxis] || 'Unknown'),
          value: chartConfig.yAxis.reduce((sum, col) => {
            const val = item[col];
            return sum + (typeof val === 'number' && isFinite(val) ? val : 0);
          }, 0)
        })).filter(item => item.value > 0);
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadialBarChart 
              innerRadius="10%" 
              outerRadius="80%" 
              data={radialData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar 
                minAngle={15} 
                label={{ position: 'insideStart', fill: '#fff' }} 
                background 
                dataKey="value"
              >
                {radialData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={chartConfig.colors[index % chartConfig.colors.length]}
                  />
                ))}
              </RadialBar>
              <Legend />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
      case 'bubble':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartConfig.xAxis} 
                tick={{ fontSize: 12 }}
                name={chartConfig.xAxis}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              {chartConfig.yAxis.map((col, index) => (
                <Scatter 
                  key={col} 
                  name={col} 
                  dataKey={col} 
                  fill={chartConfig.colors[index % chartConfig.colors.length]} 
                  shape={chartType === 'bubble' ? 'circle' : 'circle'}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'radar':
        const radarData = chartData.map(item => ({
          subject: String(item[chartConfig.xAxis] || 'Unknown'),
          ...chartConfig.yAxis.reduce((acc, col) => {
            const val = item[col];
            acc[col] = typeof val === 'number' && isFinite(val) ? val : 0;
            return acc;
          }, {})
        }));
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis />
              {chartConfig.yAxis.map((col, index) => (
                <Radar 
                  key={col} 
                  name={col} 
                  dataKey={col} 
                  stroke={chartConfig.colors[index % chartConfig.colors.length]} 
                  fill={chartConfig.colors[index % chartConfig.colors.length]} 
                  fillOpacity={0.6} 
                />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'treemap':
        const treemapData = chartData.map(item => ({
          name: String(item[chartConfig.xAxis] || 'Unknown'),
          size: chartConfig.yAxis.reduce((sum, col) => {
            const val = item[col];
            return sum + (typeof val === 'number' && isFinite(val) ? val : 0);
          }, 0)
        })).filter(item => item.size > 0);
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <Treemap
              data={treemapData}
              dataKey="size"
              ratio={4/3}
              stroke="#fff"
              fill="#8884d8"
            >
              <Tooltip formatter={(value, name) => [value.toLocaleString(), 'Size']} />
            </Treemap>
          </ResponsiveContainer>
        );

      case 'sunburst':
        const nivoData = {
          name: "Total",
          children: chartData.map(item => ({
            name: String(item[chartConfig.xAxis] || 'Unknown'),
            loc: chartConfig.yAxis.reduce((sum, col) => {
              const val = item[col];
              return sum + (typeof val === 'number' && isFinite(val) ? val : 0);
            }, 0)
          })).filter(item => item.loc > 0)
        };

        return (
          <div style={{ height: 400 }}>
            <ResponsiveSunburst
              data={nivoData}
              id="name"
              value="loc"
              cornerRadius={2}
              colors={{ scheme: 'nivo' }}
              childColor={{ from: 'color' }}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.1]] }}
              animate={true}
              motionConfig="gentle"
            />
          </div>
        );

      case 'funnel':
        const funnelData = chartData.map(item => ({
          name: String(item[chartConfig.xAxis] || 'Unknown'),
          value: chartConfig.yAxis.reduce((sum, col) => {
            const val = item[col];
            return sum + (typeof val === 'number' && isFinite(val) ? val : 0);
          }, 0)
        })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <FunnelChart>
              <Tooltip formatter={(value, name) => [value.toLocaleString(), name]} />
              <Funnel
                data={funnelData}
                dataKey="value"
              >
                {funnelData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={chartConfig.colors[index % chartConfig.colors.length]}
                  />
                ))}
                <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        );

      case 'gauge':
        const firstYCol = chartConfig.yAxis[0];
        if (!firstYCol || !summaryStats[firstYCol]) {
          return <div className="text-center text-gray-500 py-8">Select a numeric column for gauge display</div>;
        }

        const currentValue = summaryStats[firstYCol].avg;
        const minValue = summaryStats[firstYCol].min;
        const maxValue = summaryStats[firstYCol].max;
        const normalizedValue = maxValue > minValue ? (currentValue - minValue) / (maxValue - minValue) : 0;

        return (
          <div style={{ width: '100%', height: '300px', padding: '20px' }}>
            <GaugeChart
              id={`gauge-${firstYCol}`}
              nrOfLevels={20}
              percent={normalizedValue}
              colors={['#EA4228', '#F5CD19', '#5BE12C']}
              arcWidth={0.3}
              textColor="#000000"
              needleColor="#345243"
              needleBaseColor="#345243"
              formatTextValue={(value) => {
                const actualValue = minValue + (value * (maxValue - minValue));
                return `${actualValue.toFixed(1)}`;
              }}
            />
            <div className="text-center mt-2 text-sm text-gray-600">
              {firstYCol}: Range {minValue.toFixed(1)} to {maxValue.toFixed(1)}
            </div>
          </div>
        );

      default:
        return <div className="text-center text-gray-500 py-8">Select a chart type to display</div>;
    }
  };

  // Render data table view
  const renderDataTable = () => {
    if (!processedData.length) return <div className="text-center text-gray-500 py-8">No data to display</div>;

    return (
      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              {columns.map(col => (
                <th 
                  key={col} 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center justify-between">
                    {col}
                    {sortConfig.key === col && (
                      <span>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {processedData.slice(0, 100).map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map(col => (
                  <td key={`${index}-${col}`} className="px-4 py-2 text-sm text-gray-700">
                    {typeof row[col] === 'number' ? row[col].toLocaleString() : String(row[col] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {processedData.length > 100 && (
          <div className="text-center text-gray-500 py-2 text-sm">
            Showing first 100 rows of {processedData.length} total rows
          </div>
        )}
      </div>
    );
  };

  // Group chart types by category
  const groupedChartTypes = chartTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {});

  // Chart export functionality
  const chartRef = useRef(null);

  const handleDownloadChart = async () => {
    if (!chartRef.current) {
      alert("Chart not available for export");
      return;
    }

    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      const link = document.createElement('a');
      link.download = `chart-export-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Error exporting chart:", error);
      alert("Failed to export chart");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart2 className="mr-3 text-blue-600" size={28} />
              Strix Charts
            </h1>
            <p className="text-gray-600 mt-1">Transform your data into actionable insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleDownloadChart}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="mr-2" size={16} />
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Control Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Data Upload Card */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Upload className="mr-2 text-blue-500" size={20} />
              Data Source
            </h3>
            <label className="block w-full px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 text-center">
              <input
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
              />
              <div className="flex flex-col items-center">
                <Upload className="text-blue-500 mb-2" size={24} />
                <span className="text-blue-700 font-medium">Choose File</span>
                {fileName && (
                  <p className="text-xs text-gray-500 mt-1 truncate max-w-full">
                    {fileName}
                  </p>
                )}
              </div>
            </label>
            <p className="text-xs text-gray-500 text-center mt-2">
              Supports CSV, Excel files. Max 10MB.
            </p>
            {loading && (
              <div className="flex justify-center items-center mt-2">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {/* Data Configuration */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Sliders className="mr-2 text-blue-500" size={20} />
              Data Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">X-Axis (Category)</h4>
                <div className="flex flex-wrap gap-2">
                  {columns.map(col => (
                    <button
                      key={`x-${col}`}
                      onClick={() => handleColumnSelect(col, 'x')}
                      className={`px-3 py-1 text-xs rounded-full ${
                        chartConfig.xAxis === col
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {col}
                      {chartConfig.xAxis === col && <CheckCircle className="ml-1" size={14} />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Y-Axis (Values)</h4>
                <div className="flex flex-wrap gap-2">
                  {columns.map(col => (
                    <button
                      key={`y-${col}`}
                      onClick={() => handleColumnSelect(col, 'y')}
                      className={`px-3 py-1 text-xs rounded-full ${
                        chartConfig.yAxis.includes(col)
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {col}
                      {chartConfig.yAxis.includes(col) && <CheckCircle className="ml-1" size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Sidebar - Chart Types */}
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <BarChart2 className="mr-2 text-blue-500" size={20} />
                Chart Type
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(groupedChartTypes).map(([category, types]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {types.map(type => (
                        <button
                          key={type.id}
                          onClick={() => setChartType(type.id)}
                          className={`flex flex-col items-center p-2 rounded-lg border ${
                            chartType === type.id
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <type.icon size={18} className="mb-1" />
                          <span className="text-xs text-center">{type.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-4 space-y-4">
            {/* View Toggle and Filters */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setDataView("chart")}
                    className={`px-3 py-1 rounded-md flex items-center ${
                      dataView === "chart"
                        ? "bg-blue-100 text-blue-800"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Eye className="mr-1" size={16} />
                    Chart View
                  </button>
                  <button
                    onClick={() => setDataView("table")}
                    className={`px-3 py-1 rounded-md flex items-center ${
                      dataView === "table"
                        ? "bg-blue-100 text-blue-800"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Table className="mr-1" size={16} />
                    Data Table
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {processedData.length} rows, {columns.length} columns
                  </span>
                </div>
              </div>

              {/* Filters */}
              {columns.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {columns.slice(0, 3).map(col => (
                    <div key={`filter-${col}`} className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">{col}</label>
                      <input
                        type="text"
                        value={filters[col] || ''}
                        onChange={(e) => handleFilterChange(col, e.target.value)}
                        placeholder={`Filter ${col}...`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chart/Table Display */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 min-h-96">
              {loading ? (
                <div className="flex flex-col justify-center items-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-600">Processing your data...</p>
                </div>
              ) : dataView === "chart" ? (
                <div ref={chartRef} className="chart-container">
                  {renderChart()}
                </div>
              ) : (
                renderDataTable()
              )}
            </div>

            {/* Data Summary */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="mr-2 text-blue-500" size={20} />
                Data Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">Total Records</p>
                  <p className="text-xl font-bold text-blue-900">{processedData.length}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">Columns</p>
                  <p className="text-xl font-bold text-green-900">{columns.length}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-purple-800">File</p>
                  <p className="text-sm font-medium text-purple-900 truncate">{fileName}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">Chart Type</p>
                  <p className="text-sm font-medium text-yellow-900">
                    {chartTypes.find(t => t.id === chartType)?.name || 'Not Selected'}
                  </p>
                </div>
              </div>
              
              {/* Column Information */}
              {columns.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Column Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">X-Axis: </span>
                      <span className="text-blue-600">{chartConfig.xAxis || 'Not selected'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Y-Axis: </span>
                      <span className="text-green-600">
                        {chartConfig.yAxis.length > 0 ? chartConfig.yAxis.join(', ') : 'Not selected'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistical Summary for numeric columns */}
              {Object.keys(summaryStats).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Statistical Summary</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-2 py-1 text-left">Column</th>
                          <th className="px-2 py-1 text-left">Sum</th>
                          <th className="px-2 py-1 text-left">Average</th>
                          <th className="px-2 py-1 text-left">Min</th>
                          <th className="px-2 py-1 text-left">Max</th>
                          <th className="px-2 py-1 text-left">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(summaryStats).map(([col, stats]) => (
                          <tr key={col} className="border-t">
                            <td className="px-2 py-1 font-medium">{col}</td>
                            <td className="px-2 py-1">{stats.sum.toLocaleString()}</td>
                            <td className="px-2 py-1">{stats.avg.toFixed(2)}</td>
                            <td className="px-2 py-1">{stats.min.toLocaleString()}</td>
                            <td className="px-2 py-1">{stats.max.toLocaleString()}</td>
                            <td className="px-2 py-1">{stats.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChartLibrary;