import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const JSONDataViewer = ({ data, title = "JSON Data Viewer" }) => {
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted', 'raw', 'tree'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [highlightPaths, setHighlightPaths] = useState(new Set());
  const [selectedPath, setSelectedPath] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState('');

  // Parse and process JSON data
  const jsonData = typeof data === 'string' ? JSON.parse(data) : data || {};

  // Search functionality
  const searchInObject = (obj, term, currentPath = '') => {
    const results = new Set();

    const search = (value, path) => {
      if (typeof value === 'string' && value.toLowerCase().includes(term.toLowerCase())) {
        results.add(path);
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => {
          const newPath = path ? `${path}.${key}` : key;
          if (key.toLowerCase().includes(term.toLowerCase())) {
            results.add(newPath);
          }
          search(val, newPath);
        });
      }
    };

    search(obj, currentPath);
    return results;
  };

  useEffect(() => {
    if (searchTerm) {
      const results = searchInObject(jsonData, searchTerm);
      setHighlightPaths(results);
      // Auto-expand paths that contain search results
      const pathsToExpand = new Set();
      results.forEach(path => {
        const parts = path.split('.');
        for (let i = 1; i < parts.length; i++) {
          pathsToExpand.add(parts.slice(0, i).join('.'));
        }
      });
      setExpandedPaths(prev => new Set([...prev, ...pathsToExpand]));
    } else {
      setHighlightPaths(new Set());
    }
  }, [searchTerm, jsonData]);

  const toggleExpand = (path) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const expandAll = () => {
    const allPaths = new Set();

    const findAllPaths = (obj, currentPath = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const path = currentPath ? `${currentPath}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          allPaths.add(path);
          findAllPaths(value, path);
        }
      });
    };

    findAllPaths(jsonData);
    setExpandedPaths(allPaths);
  };

  const collapseAll = () => {
    setExpandedPaths(new Set());
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${label} copied!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const getValueAtPath = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const getValueType = (value) => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getTypeColor = (type) => {
    const colors = {
      string: 'text-green-600',
      number: 'text-blue-600',
      boolean: 'text-purple-600',
      null: 'text-gray-500',
      array: 'text-orange-600',
      object: 'text-red-600'
    };
    return colors[type] || 'text-gray-600';
  };

  const ViewModeToggle = () => (
    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 space-x-1">
      {['formatted', 'raw', 'tree'].map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === mode
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
          }`}
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      ))}
    </div>
  );

  const TreeNode = ({ value, path = '', level = 0 }) => {
    const isExpanded = expandedPaths.has(path);
    const isHighlighted = highlightPaths.has(path);
    const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
    const isArray = Array.isArray(value);
    const hasChildren = isObject || isArray;

    const renderValue = () => {
      if (isObject) {
        return (
          <span className="text-gray-600 dark:text-gray-400">
            {`{${Object.keys(value).length} ${Object.keys(value).length === 1 ? 'property' : 'properties'}}`}
          </span>
        );
      }
      if (isArray) {
        return (
          <span className="text-gray-600 dark:text-gray-400">
            {`[${value.length} ${value.length === 1 ? 'item' : 'items'}]`}
          </span>
        );
      }

      const type = getValueType(value);
      return (
        <span className={getTypeColor(type)}>
          {type === 'string' ? `"${value}"` : String(value)}
        </span>
      );
    };

    return (
      <div className={`${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
        <div
          className={`flex items-center py-1 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
            selectedPath === path ? 'bg-blue-50 dark:bg-blue-900/30' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(path);
            }
            setSelectedPath(path);
          }}
        >
          {hasChildren && (
            <span className="mr-2 text-gray-500">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!hasChildren && <span className="mr-4"></span>}

          <span className="font-medium text-gray-700 dark:text-gray-300 mr-2">
            {path.split('.').pop()}:
          </span>

          {renderValue()}

          <button
            onClick={(e) => {
              e.stopPropagation();
              const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
              copyToClipboard(valueStr, 'Value');
            }}
            className="ml-auto mr-2 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
            title="Copy value"
          >
            📋
          </button>
        </div>

        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isObject && Object.entries(value).map(([key, val]) => (
                <TreeNode
                  key={key}
                  value={val}
                  path={path ? `${path}.${key}` : key}
                  level={level + 1}
                />
              ))}
              {isArray && value.map((val, index) => (
                <TreeNode
                  key={index}
                  value={val}
                  path={path ? `${path}.${index}` : String(index)}
                  level={level + 1}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const FormattedView = () => (
    <div className="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono text-sm overflow-auto max-h-96">
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(jsonData, null, 2)}
      </pre>
    </div>
  );

  const RawView = () => (
    <div className="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono text-sm overflow-auto max-h-96">
      <pre className="whitespace-pre-wrap break-all">
        {JSON.stringify(jsonData)}
      </pre>
    </div>
  );

  const TreeView = () => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={expandAll}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-500"
            >
              Collapse All
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {Object.keys(jsonData).length} root properties
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-auto group">
        {Object.entries(jsonData).map(([key, value]) => (
          <TreeNode key={key} value={value} path={key} />
        ))}
      </div>
    </div>
  );

  const SelectedValueDetails = () => {
    if (!selectedPath) return null;

    const value = getValueAtPath(jsonData, selectedPath);
    const type = getValueType(value);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200">Selected: {selectedPath}</h4>
            <span className={`text-sm ${getTypeColor(type)}`}>Type: {type}</span>
          </div>
          <button
            onClick={() => {
              const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
              copyToClipboard(valueStr, 'Selected value');
            }}
            className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            Copy Value
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded p-3 font-mono text-sm">
          <pre className="whitespace-pre-wrap break-all">
            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          </pre>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {title}
            </h2>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
              {Object.keys(jsonData).length} properties
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ViewModeToggle />
            <button
              onClick={() => copyToClipboard(JSON.stringify(jsonData, null, 2), 'Full JSON')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Copy All
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in JSON..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {searchTerm && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {highlightPaths.size} result{highlightPaths.size !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-auto" style={{ height: 'calc(100% - 160px)' }}>
        <AnimatePresence mode="wait">
          {viewMode === 'formatted' && (
            <motion.div
              key="formatted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FormattedView />
            </motion.div>
          )}

          {viewMode === 'raw' && (
            <motion.div
              key="raw"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RawView />
            </motion.div>
          )}

          {viewMode === 'tree' && (
            <motion.div
              key="tree"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TreeView />
              <SelectedValueDetails />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Copy Feedback */}
      <AnimatePresence>
        {copyFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            {copyFeedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!jsonData || Object.keys(jsonData).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">No JSON Data</h3>
            <p className="text-gray-400">Upload and process a file to view JSON data</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JSONDataViewer;