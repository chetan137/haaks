import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DatabaseSchemaVisualization = ({ schemaData, sqlData }) => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [viewMode, setViewMode] = useState('visual'); // 'visual', 'sql', 'json'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Extract tables from SQL or schema data
  const extractTables = () => {
    if (schemaData?.tables) {
      return schemaData.tables;
    }

    if (sqlData) {
      return parseSQLTables(sqlData);
    }

    return [];
  };

  const parseSQLTables = (sql) => {
    const tables = [];
    const createTableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi;
    let match;

    while ((match = createTableRegex.exec(sql)) !== null) {
      const tableName = match[1];
      const columnsSection = match[2];
      const columns = parseColumns(columnsSection);

      tables.push({
        name: tableName,
        columns: columns,
        relationships: findRelationships(columnsSection)
      });
    }

    return tables;
  };

  const parseColumns = (columnsSection) => {
    const columns = [];
    const lines = columnsSection.split(',');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.toUpperCase().includes('CONSTRAINT') && !trimmed.toUpperCase().includes('FOREIGN KEY')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const column = {
            name: parts[0],
            type: parts[1],
            isPrimary: trimmed.toUpperCase().includes('PRIMARY KEY'),
            isNotNull: trimmed.toUpperCase().includes('NOT NULL'),
            isUnique: trimmed.toUpperCase().includes('UNIQUE'),
            hasDefault: trimmed.toUpperCase().includes('DEFAULT')
          };
          columns.push(column);
        }
      }
    });

    return columns;
  };

  const findRelationships = (columnsSection) => {
    const relationships = [];
    const foreignKeyRegex = /FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(\w+)\s*\(([^)]+)\)/gi;
    let match;

    while ((match = foreignKeyRegex.exec(columnsSection)) !== null) {
      relationships.push({
        fromColumn: match[1].trim(),
        toTable: match[2],
        toColumn: match[3].trim()
      });
    }

    return relationships;
  };

  const tables = extractTables();

  // Mouse event handlers for canvas dragging
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - canvasPosition.x,
      y: e.clientY - canvasPosition.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setCanvasPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const TableCard = ({ table, position, isSelected, onClick }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 cursor-pointer min-w-64 ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 dark:border-gray-600'
      }`}
      style={{
        left: position.x,
        top: position.y,
        transform: `scale(${zoomLevel})`
      }}
      onClick={() => onClick(table)}
    >
      {/* Table Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-t-lg">
        <h3 className="font-bold text-lg">{table.name}</h3>
        <span className="text-sm opacity-75">{table.columns?.length || 0} columns</span>
      </div>

      {/* Table Columns */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {table.columns?.map((column, index) => (
          <div key={index} className="flex items-center py-1 text-sm">
            {/* Column indicators */}
            <div className="flex space-x-1 mr-2">
              {column.isPrimary && (
                <span className="w-3 h-3 bg-yellow-400 rounded-full" title="Primary Key"></span>
              )}
              {column.isUnique && (
                <span className="w-3 h-3 bg-green-400 rounded-full" title="Unique"></span>
              )}
              {column.isNotNull && (
                <span className="w-3 h-3 bg-red-400 rounded-full" title="Not Null"></span>
              )}
            </div>

            {/* Column details */}
            <div className="flex-1">
              <div className="font-medium text-gray-800 dark:text-gray-200">
                {column.name}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {column.type}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Relationships indicator */}
      {table.relationships?.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-b-lg border-t">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {table.relationships.length} relationship(s)
          </span>
        </div>
      )}
    </motion.div>
  );

  const generateTablePositions = () => {
    const positions = [];
    const cols = Math.ceil(Math.sqrt(tables.length));
    const spacing = { x: 320, y: 280 };

    tables.forEach((table, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      positions.push({
        x: col * spacing.x + 50,
        y: row * spacing.y + 50
      });
    });

    return positions;
  };

  const tablePositions = generateTablePositions();

  const ViewModeToggle = () => (
    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 space-x-1">
      {['visual', 'sql', 'json'].map((mode) => (
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

  const ZoomControls = () => (
    <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-2">
      <button
        onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
      >
        <span className="text-lg">−</span>
      </button>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-12 text-center">
        {Math.round(zoomLevel * 100)}%
      </span>
      <button
        onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
      >
        <span className="text-lg">+</span>
      </button>
    </div>
  );

  const SQLView = () => (
    <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm overflow-auto max-h-96">
      <pre className="whitespace-pre-wrap">{sqlData || 'No SQL data available'}</pre>
    </div>
  );

  const JSONView = () => (
    <div className="bg-gray-900 text-cyan-400 p-6 rounded-lg font-mono text-sm overflow-auto max-h-96">
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(schemaData || { tables }, null, 2)}
      </pre>
    </div>
  );

  const SelectedTableDetails = () => {
    if (!selectedTable) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-4 top-20 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {selectedTable.name}
            </h3>
            <button
              onClick={() => setSelectedTable(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Columns</h4>
              <div className="space-y-2">
                {selectedTable.columns?.map((column, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {column.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {column.type}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {column.isPrimary && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          Primary Key
                        </span>
                      )}
                      {column.isNotNull && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          Not Null
                        </span>
                      )}
                      {column.isUnique && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Unique
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedTable.relationships?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Relationships</h4>
                <div className="space-y-2">
                  {selectedTable.relationships.map((rel, index) => (
                    <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                      <div className="text-sm">
                        <span className="font-medium">{rel.fromColumn}</span>
                        <span className="text-gray-600 dark:text-gray-400 mx-2">→</span>
                        <span className="font-medium">{rel.toTable}.{rel.toColumn}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Database Schema
          </h2>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
            {tables.length} table{tables.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <ViewModeToggle />
          {viewMode === 'visual' && <ZoomControls />}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 h-full">
        <AnimatePresence mode="wait">
          {viewMode === 'visual' && (
            <motion.div
              key="visual"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full relative"
            >
              {/* Canvas */}
              <div
                ref={canvasRef}
                className="h-full cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                style={{
                  transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px)`
                }}
              >
                {/* Render Tables */}
                {tables.map((table, index) => (
                  <TableCard
                    key={table.name}
                    table={table}
                    position={tablePositions[index]}
                    isSelected={selectedTable?.name === table.name}
                    onClick={setSelectedTable}
                  />
                ))}

                {/* Render Relationships */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
                  {tables.map((table, tableIndex) =>
                    table.relationships?.map((rel, relIndex) => {
                      const fromPos = tablePositions[tableIndex];
                      const toTableIndex = tables.findIndex(t => t.name === rel.toTable);
                      if (toTableIndex === -1) return null;

                      const toPos = tablePositions[toTableIndex];

                      return (
                        <line
                          key={`${table.name}-${relIndex}`}
                          x1={fromPos.x + 128}
                          y1={fromPos.y + 40}
                          x2={toPos.x + 128}
                          y2={toPos.y + 40}
                          stroke="#6366f1"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          markerEnd="url(#arrowhead)"
                        />
                      );
                    })
                  )}

                  {/* Arrow marker definition */}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#6366f1"
                      />
                    </marker>
                  </defs>
                </svg>
              </div>
            </motion.div>
          )}

          {viewMode === 'sql' && (
            <motion.div
              key="sql"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <SQLView />
            </motion.div>
          )}

          {viewMode === 'json' && (
            <motion.div
              key="json"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <JSONView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Table Details */}
      <AnimatePresence>
        {selectedTable && <SelectedTableDetails />}
      </AnimatePresence>

      {/* Empty State */}
      {tables.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c0-2.21-1.79-4-4-4H8c-2.21 0-4-1.79-4-4zm8 0V3c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">No Schema Data</h3>
            <p className="text-gray-400">Upload and process a file to see the database schema</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseSchemaVisualization;