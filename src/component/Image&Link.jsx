import React, { useState, useRef } from 'react';
import { 
  Upload, Link, X, Eye, Image, Plus, Undo, Redo, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Palette, Grid3x3, MoreHorizontal, FileText, Share,
  Star,Printer, ExternalLink,
} from 'lucide-react';

const StrixSpreadsheet = () => {
  const [cells, setCells] = useState(() => {
    const initialCells = {};
    for (let row = 0; row < 100; row++) {
      for (let col = 0; col < 26; col++) {
        initialCells[`${row}-${col}`] = { value: '', type: 'text' };
      }
    }
    return initialCells;
  });
  
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [activeTab, setActiveTab] = useState('url');
  const [currentInput, setCurrentInput] = useState('');
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef(null);

  const getColumnName = (index) => {
    let result = '';
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  };

  const getCellKey = (row, col) => `${row}-${col}`;

  const handleCellClick = (row, col) => {
    setSelectedCell({ row, col });
    const cellKey = getCellKey(row, col);
    const cell = cells[cellKey];
    setCurrentInput(cell?.value || '');
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const fetchPageTitle = async (url) => {
    try {
      // In a real application, you would use a CORS proxy or backend service
      // For demo purposes, we'll simulate the title fetching
      const domain = new URL(url).hostname;
      const titles = {
        'docs.google.com': 'Google Docs Document',
        'sheets.google.com': 'Google Sheets Spreadsheet', 
        'drive.google.com': 'Google Drive File',
        'youtube.com': 'YouTube Video',
        'www.youtube.com': 'YouTube Video',
        'github.com': 'GitHub Repository',
        'stackoverflow.com': 'Stack Overflow Question',
        'medium.com': 'Medium Article',
        'twitter.com': 'Twitter Post',
        'linkedin.com': 'LinkedIn Post'
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return titles[domain] || `${domain.charAt(0).toUpperCase() + domain.slice(1)} Page`;
    } catch (error) {
      return url;
    }
  };

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

  const handleImageInsert = () => {
    setShowImageDialog(true);
    setImageUrl('');
    setPreviewImage(null);
    setActiveTab('url');
  };

  const handleLinkInsert = () => {
    const cellKey = getCellKey(selectedCell.row, selectedCell.col);
    const currentCell = cells[cellKey];
    
    setLinkText(currentCell?.type === 'link' ? currentCell.displayText : currentCell?.value || '');
    setLinkUrl(currentCell?.type === 'link' ? currentCell.url : '');
    setShowLinkDialog(true);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
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
      const cellKey = getCellKey(selectedCell.row, selectedCell.col);
      setCells(prev => ({
        ...prev,
        [cellKey]: {
          type: 'image',
          src: previewImage,
          value: activeTab === 'url' ? imageUrl : 'Uploaded Image'
        }
      }));
      setShowImageDialog(false);
      setPreviewImage(null);
      setImageUrl('');
      setCurrentInput('');
    }
  };

  const insertLink = () => {
    if (selectedCell && linkText && linkUrl) {
      const cellKey = getCellKey(selectedCell.row, selectedCell.col);
      setCells(prev => ({
        ...prev,
        [cellKey]: {
          type: 'link',
          value: linkText,
          displayText: linkText,
          url: linkUrl
        }
      }));
      setCurrentInput(linkText);
      setShowLinkDialog(false);
      setLinkText('');
      setLinkUrl('');
    }
  };

  const removeImage = (row, col) => {
    const cellKey = getCellKey(row, col);
    setCells(prev => ({
      ...prev,
      [cellKey]: { value: '', type: 'text' }
    }));
  };

  const removeLink = (row, col) => {
    const cellKey = getCellKey(row, col);
    const currentCell = cells[cellKey];
    setCells(prev => ({
      ...prev,
      [cellKey]: { value: currentCell.displayText || currentCell.value, type: 'text' }
    }));
  };

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-medium text-gray-800">Strix Sheets</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <FileText size={16} />
              <span className="text-sm">Untitled spreadsheet</span>
              <Star size={16} className="ml-2 hover:text-yellow-500 cursor-pointer" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
              <Share size={16} className="inline mr-2" />
              Share
            </button>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">U</span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-1 flex">
        <div className="flex items-center gap-6 text-sm text-gray-700">
          <span className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">File</span>
          <span className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">Edit</span>
          <span className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">View</span>
          <div className="relative group">
            <span className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">Insert</span>
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <button
                onClick={handleImageInsert}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Image size={16} />
                Image
              </button>
              <button
                onClick={handleLinkInsert}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Link size={16} />
                Link
              </button>
            </div>
          </div>
          <span className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">Format</span>
          <span className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">Data</span>
          <span className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">Tools</span>
          <span className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">Extensions</span>
          <span className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">Help</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-gray-100 rounded">
            <Undo size={16} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Redo size={16} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Printer size={16} className="text-gray-600" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          
          <select className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
            <option>Arial</option>
            <option>Roboto</option>
            <option>Times New Roman</option>
          </select>
          
          <select className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 ml-1">
            <option>10</option>
            <option>11</option>
            <option>12</option>
            <option>14</option>
          </select>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <button className="p-2 hover:bg-gray-100 rounded">
            <Bold size={16} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Italic size={16} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Underline size={16} className="text-gray-600" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <button 
            onClick={handleImageInsert}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
          >
            <Image size={16} />
            Image
          </button>

          <button 
            onClick={handleLinkInsert}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 ml-1"
          >
            <Link size={16} />
            Link
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <button className="p-2 hover:bg-gray-100 rounded">
            <AlignLeft size={16} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <AlignCenter size={16} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <AlignRight size={16} className="text-gray-600" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <button className="p-2 hover:bg-gray-100 rounded">
            <Palette size={16} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Grid3x3 size={16} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <MoreHorizontal size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-16 h-8 border border-gray-300 rounded flex items-center justify-center text-sm font-medium bg-gray-50">
            {getColumnName(selectedCell.col)}{selectedCell.row + 1}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">fx</span>
            <input
              type="text"
              value={currentInput}
              onChange={(e) => handleInputChange(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              placeholder="Enter value or formula"
            />
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="relative">
          <table className="border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th className="w-12 h-8 bg-gray-50 border-r border-b border-gray-300 text-xs text-gray-600"></th>
                {Array.from({ length: 26 }, (_, i) => (
                  <th key={i} className="min-w-24 h-8 bg-gray-50 border-r border-b border-gray-300 text-xs font-normal text-gray-600 px-2">
                    {getColumnName(i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 100 }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="w-12 h-6 bg-gray-50 border-r border-b border-gray-300 text-xs text-gray-600 text-center font-normal sticky left-0 z-10">
                    {rowIndex + 1}
                  </td>
                  {Array.from({ length: 26 }, (_, colIndex) => {
                    const cellKey = getCellKey(rowIndex, colIndex);
                    const cell = cells[cellKey] || { value: '', type: 'text' };
                    const isSelected = selectedCell.row === rowIndex && selectedCell.col === colIndex;
                    
                    return (
                      <td
                        key={colIndex}
                        className={`min-w-24 h-6 border-r border-b border-gray-300 text-xs cursor-cell relative ${
                          isSelected 
                            ? 'bg-blue-100 border-blue-500 border-2' 
                            : 'hover:bg-blue-50'
                        }`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      >
                        {cell.type === 'image' ? (
                          <div className="relative w-full h-full p-0.5">
                            <img
                              src={cell.src}
                              alt="Cell image"
                              className="w-full h-full object-contain"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(rowIndex, colIndex);
                              }}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 opacity-0 hover:opacity-100 transition-opacity"
                            >
                              <X size={8} />
                            </button>
                          </div>
                        ) : cell.type === 'link' ? (
                          <div className="px-2 py-1 w-full h-full overflow-hidden flex items-center group">
                            <a
                              href={cell.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1 truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="truncate">{cell.displayText || cell.value}</span>
                              <ExternalLink size={10} className="flex-shrink-0" />
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeLink(rowIndex, colIndex);
                              }}
                              className="ml-1 w-3 h-3 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              <X size={6} />
                            </button>
                          </div>
                        ) : (
                          <div className="px-2 py-1 w-full h-full overflow-hidden">
                            <span className="text-gray-900">{cell.value}</span>
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

      {/* Link Insert Dialog */}
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

              {linkUrl && !linkUrl.startsWith('http') && (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p>Links should start with http:// or https://</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowLinkDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                disabled={!linkText.trim() || !linkUrl.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Insert Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">Insert image</h2>
              <button
                onClick={() => setShowImageDialog(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('url')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'url'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Link size={16} className="inline mr-2" />
                  Insert by URL
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'upload'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Upload size={16} className="inline mr-2" />
                  Upload
                </button>
              </div>

              {/* URL Tab */}
              {activeTab === 'url' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Paste the image URL
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={handleUrlChange}
                      placeholder="Paste image URL here"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Upload an image file
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-base text-gray-700 mb-1">Drag an image here</p>
                      <p className="text-sm text-gray-500">or click to upload</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* Preview */}
              {previewImage && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Preview</span>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="max-w-full max-h-64 mx-auto object-contain rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dialog Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowImageDialog(false)}
                className="px-6 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={insertImage}
                disabled={!previewImage}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Insert image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrixSpreadsheet;