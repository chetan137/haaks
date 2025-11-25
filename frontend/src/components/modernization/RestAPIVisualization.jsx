import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RestAPIVisualization = ({ apiData }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [viewMode, setViewMode] = useState('endpoints'); // 'endpoints', 'models', 'security', 'openapi'
  const [filterMethod, setFilterMethod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract API data
  const endpoints = apiData?.endpoints || [];
  const models = apiData?.models || [];
  const security = apiData?.security || {};
  const architecture = apiData?.architecture || {};

  // Filter endpoints based on method and search
  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesMethod = filterMethod === 'all' || endpoint.method === filterMethod;
    const matchesSearch = searchTerm === '' ||
      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  const getMethodColor = (method) => {
    const colors = {
      GET: 'bg-green-500',
      POST: 'bg-blue-500',
      PUT: 'bg-yellow-500',
      DELETE: 'bg-red-500',
      PATCH: 'bg-purple-500'
    };
    return colors[method] || 'bg-gray-500';
  };

  const getMethodTextColor = (method) => {
    const colors = {
      GET: 'text-green-700',
      POST: 'text-blue-700',
      PUT: 'text-yellow-700',
      DELETE: 'text-red-700',
      PATCH: 'text-purple-700'
    };
    return colors[method] || 'text-gray-700';
  };

  const ViewModeToggle = () => (
    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 space-x-1">
      {['endpoints', 'models', 'security', 'openapi'].map((mode) => (
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

  const FilterControls = () => (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Method:</label>
        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <option value="all">All</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search:</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter endpoints..."
          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        />
      </div>
    </div>
  );

  const EndpointCard = ({ endpoint, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onClick(endpoint)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-md text-white text-sm font-medium ${getMethodColor(endpoint.method)}`}>
            {endpoint.method}
          </span>
          <code className="text-lg font-mono text-gray-800 dark:text-gray-200">
            {endpoint.path}
          </code>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {endpoint.parameters?.length || 0} params
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
        {endpoint.description || 'No description available'}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          {endpoint.parameters && (
            <span>Parameters: {endpoint.parameters.length}</span>
          )}
          {endpoint.body && (
            <span>Request Body: ✓</span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>Active</span>
        </div>
      </div>
    </motion.div>
  );

  const ModelCard = ({ model }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
          {model.name}
        </h3>
        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs">
          {model.fields?.length || 0} fields
        </span>
      </div>

      <div className="space-y-2">
        {model.fields?.map((field, index) => (
          <div key={index} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <div className="flex items-center space-x-3">
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {field.name}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {field.type}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {field.required && (
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs">
                  Required
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const SecurityView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-6"
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
          Authentication & Authorization
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Authentication:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {security.authentication || 'Not specified'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Authorization:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {security.authorization || 'Not specified'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Rate Limiting:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {security.rateLimiting || 'Not configured'}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-6"
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
          Security Measures
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Input Validation:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {security.inputValidation || 'Not specified'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">SQL Injection Prevention:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {security.sqlInjectionPrevention || 'Not specified'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">CORS:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {security.cors || 'Configure as needed'}
            </span>
          </div>
        </div>
      </motion.div>

      {architecture && Object.keys(architecture).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-6 md:col-span-2"
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
            Architecture Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(architecture).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </div>
                <div className="font-medium text-gray-800 dark:text-gray-200">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );

  const OpenAPIView = () => {
    const openAPISpec = {
      openapi: "3.0.0",
      info: {
        title: "Modernized API",
        version: "1.0.0",
        description: "API generated from legacy COBOL system modernization"
      },
      servers: [
        {
          url: "https://api.modernized-system.com/v1",
          description: "Production server"
        }
      ],
      paths: endpoints.reduce((paths, endpoint) => {
        paths[endpoint.path] = {
          [endpoint.method.toLowerCase()]: {
            summary: endpoint.description,
            parameters: endpoint.parameters?.map(param => ({
              name: param,
              in: "query",
              required: false,
              schema: { type: "string" }
            })) || [],
            responses: {
              "200": {
                description: "Successful response",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        data: { type: "object" },
                        status: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        };
        return paths;
      }, {}),
      components: {
        schemas: models.reduce((schemas, model) => {
          schemas[model.name] = {
            type: "object",
            properties: model.fields?.reduce((props, field) => {
              props[field.name] = {
                type: field.type === 'integer' ? 'integer' : 'string'
              };
              return props;
            }, {}) || {}
          };
          return schemas;
        }, {})
      }
    };

    return (
      <div className="bg-gray-900 text-cyan-400 p-6 rounded-lg font-mono text-sm overflow-auto max-h-96">
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(openAPISpec, null, 2)}
        </pre>
      </div>
    );
  };

  const EndpointDetails = () => {
    if (!selectedEndpoint) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-4 top-20 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 max-h-[80vh] overflow-y-auto"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-1 rounded-md text-white text-sm font-medium ${getMethodColor(selectedEndpoint.method)}`}>
                  {selectedEndpoint.method}
                </span>
                <code className="text-lg font-mono text-gray-800 dark:text-gray-200">
                  {selectedEndpoint.path}
                </code>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedEndpoint.description}
              </p>
            </div>
            <button
              onClick={() => setSelectedEndpoint(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Parameters */}
          {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Parameters</h4>
              <div className="space-y-2">
                {selectedEndpoint.parameters.map((param, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <code className="text-sm text-blue-600 dark:text-blue-400">{param}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request Body */}
          {selectedEndpoint.body && (
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Request Body</h4>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <code className="text-sm text-green-600 dark:text-green-400">
                  {selectedEndpoint.body}
                </code>
              </div>
            </div>
          )}

          {/* Response */}
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Response</h4>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <code className="text-sm text-purple-600 dark:text-purple-400">
                {selectedEndpoint.response || 'JSON response object'}
              </code>
            </div>
          </div>

          {/* Example */}
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Example Request</h4>
            <div className="bg-gray-900 text-green-400 p-3 rounded-md font-mono text-xs">
              <div>curl -X {selectedEndpoint.method} \</div>
              <div>  "https://api.example.com{selectedEndpoint.path}" \</div>
              <div>  -H "Authorization: Bearer &lt;token&gt;" \</div>
              <div>  -H "Content-Type: application/json"</div>
              {selectedEndpoint.body && (
                <div>  -d '{selectedEndpoint.body}'</div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              REST API Documentation
            </h2>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
            </span>
          </div>
          <ViewModeToggle />
        </div>

        {viewMode === 'endpoints' && <FilterControls />}
      </div>

      {/* Content */}
      <div className="p-6 overflow-auto" style={{ height: 'calc(100% - 140px)' }}>
        <AnimatePresence mode="wait">
          {viewMode === 'endpoints' && (
            <motion.div
              key="endpoints"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {filteredEndpoints.map((endpoint, index) => (
                <EndpointCard
                  key={index}
                  endpoint={endpoint}
                  onClick={setSelectedEndpoint}
                />
              ))}
              {filteredEndpoints.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">No endpoints match your filters</div>
                  <button
                    onClick={() => {
                      setFilterMethod('all');
                      setSearchTerm('');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {viewMode === 'models' && (
            <motion.div
              key="models"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {models.map((model, index) => (
                <ModelCard key={index} model={model} />
              ))}
              {models.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-400">
                  No data models available
                </div>
              )}
            </motion.div>
          )}

          {viewMode === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SecurityView />
            </motion.div>
          )}

          {viewMode === 'openapi' && (
            <motion.div
              key="openapi"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                  OpenAPI 3.0 Specification
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Auto-generated OpenAPI specification for the modernized API
                </p>
              </div>
              <OpenAPIView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Endpoint Details Panel */}
      <AnimatePresence>
        {selectedEndpoint && <EndpointDetails />}
      </AnimatePresence>

      {/* Empty State */}
      {endpoints.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">No API Data</h3>
            <p className="text-gray-400">Upload and process a file to see the REST API design</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestAPIVisualization;