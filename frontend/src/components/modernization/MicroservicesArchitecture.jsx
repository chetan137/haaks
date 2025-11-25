import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MicroservicesArchitecture = ({ architectureData, apiData }) => {
  const [selectedService, setSelectedService] = useState(null);
  const [viewMode, setViewMode] = useState('diagram'); // 'diagram', 'details', 'dependencies'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Generate microservices from API data and architecture info
  const generateMicroservices = () => {
    const endpoints = apiData?.endpoints || [];
    const architecture = architectureData || {};

    // Group endpoints by domain/service
    const serviceGroups = {};

    endpoints.forEach(endpoint => {
      // Extract service name from path (e.g., /api/customers -> customers)
      const pathParts = endpoint.path.split('/').filter(p => p);
      const serviceName = pathParts[1] || 'general';

      if (!serviceGroups[serviceName]) {
        serviceGroups[serviceName] = {
          name: serviceName,
          endpoints: [],
          dependencies: new Set(),
          type: 'business'
        };
      }

      serviceGroups[serviceName].endpoints.push(endpoint);
    });

    // Add infrastructure services
    const infrastructureServices = [
      { name: 'api-gateway', type: 'infrastructure', description: 'API Gateway for routing and authentication' },
      { name: 'auth-service', type: 'infrastructure', description: 'Authentication and authorization service' },
      { name: 'config-service', type: 'infrastructure', description: 'Configuration management' },
      { name: 'logging-service', type: 'infrastructure', description: 'Centralized logging' },
      { name: 'monitoring-service', type: 'infrastructure', description: 'Application monitoring and metrics' }
    ];

    // Add data services
    const dataServices = [
      { name: 'database', type: 'data', description: `${architecture.database || 'Database'} instance` },
      { name: 'cache', type: 'data', description: `${architecture.caching || 'Cache'} instance` },
      { name: 'message-queue', type: 'data', description: `${architecture.messaging || 'Message Queue'} instance` }
    ];

    return {
      business: Object.values(serviceGroups),
      infrastructure: infrastructureServices,
      data: dataServices
    };
  };

  const services = generateMicroservices();

  // Mouse event handlers for canvas dragging
  const handleMouseDown = (e) => {
    if (e.target === canvasRef.current) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - canvasPosition.x,
        y: e.clientY - canvasPosition.y
      });
    }
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

  const getServiceColor = (type) => {
    const colors = {
      business: 'from-blue-500 to-blue-600',
      infrastructure: 'from-purple-500 to-purple-600',
      data: 'from-green-500 to-green-600'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const getServiceIcon = (service) => {
    const icons = {
      'api-gateway': '🚪',
      'auth-service': '🔐',
      'config-service': '⚙️',
      'logging-service': '📝',
      'monitoring-service': '📊',
      'database': '🗄️',
      'cache': '⚡',
      'message-queue': '📮',
      'customers': '👥',
      'orders': '🛒',
      'products': '📦',
      'inventory': '📋',
      'payments': '💳',
      'notifications': '🔔'
    };
    return icons[service.name] || '🔧';
  };

  const ServiceCard = ({ service, position, onClick }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className={`absolute bg-gradient-to-r ${getServiceColor(service.type)} text-white rounded-lg shadow-lg cursor-pointer min-w-48 max-w-64`}
      style={{
        left: position.x,
        top: position.y,
        transform: `scale(${zoomLevel})`
      }}
      onClick={() => onClick(service)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getServiceIcon(service)}</span>
            <h3 className="font-bold text-lg capitalize">
              {service.name.replace('-', ' ')}
            </h3>
          </div>
          <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
            {service.type}
          </span>
        </div>

        {service.description && (
          <p className="text-sm opacity-90 mb-3">
            {service.description}
          </p>
        )}

        {service.endpoints && (
          <div className="text-xs opacity-75">
            {service.endpoints.length} endpoint{service.endpoints.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Health indicator */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span className="text-xs">Healthy</span>
          </div>
          <div className="text-xs">v1.0.0</div>
        </div>
      </div>
    </motion.div>
  );

  const generateServicePositions = () => {
    const positions = {};
    const layers = {
      infrastructure: { y: 50, services: [], spacing: 280 },
      business: { y: 200, services: [], spacing: 280 },
      data: { y: 350, services: [], spacing: 280 }
    };

    // Organize services by layer
    Object.entries(services).forEach(([type, serviceList]) => {
      layers[type].services = serviceList;
    });

    // Calculate positions for each layer
    Object.entries(layers).forEach(([type, layer]) => {
      const totalWidth = layer.services.length * layer.spacing;
      const startX = Math.max(50, (800 - totalWidth) / 2);

      layer.services.forEach((service, index) => {
        positions[service.name] = {
          x: startX + (index * layer.spacing),
          y: layer.y
        };
      });
    });

    return positions;
  };

  const servicePositions = generateServicePositions();

  const generateConnections = () => {
    const connections = [];

    // API Gateway connects to all business services
    services.business.forEach(service => {
      connections.push({
        from: 'api-gateway',
        to: service.name,
        type: 'http'
      });
    });

    // Business services connect to data services
    services.business.forEach(service => {
      connections.push({
        from: service.name,
        to: 'database',
        type: 'sql'
      });

      if (service.endpoints.some(e => e.method === 'GET')) {
        connections.push({
          from: service.name,
          to: 'cache',
          type: 'cache'
        });
      }
    });

    // Auth service connections
    services.business.forEach(service => {
      connections.push({
        from: service.name,
        to: 'auth-service',
        type: 'auth'
      });
    });

    return connections;
  };

  const connections = generateConnections();

  const ConnectionLine = ({ connection }) => {
    const fromPos = servicePositions[connection.from];
    const toPos = servicePositions[connection.to];

    if (!fromPos || !toPos) return null;

    const getConnectionColor = (type) => {
      const colors = {
        http: '#3b82f6',
        sql: '#10b981',
        cache: '#f59e0b',
        auth: '#8b5cf6'
      };
      return colors[type] || '#6b7280';
    };

    return (
      <line
        x1={fromPos.x + 96}
        y1={fromPos.y + 40}
        x2={toPos.x + 96}
        y2={toPos.y + 40}
        stroke={getConnectionColor(connection.type)}
        strokeWidth="2"
        strokeDasharray={connection.type === 'auth' ? '5,5' : ''}
        markerEnd="url(#arrowhead)"
      />
    );
  };

  const ViewModeToggle = () => (
    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 space-x-1">
      {['diagram', 'details', 'dependencies'].map((mode) => (
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

  const ServiceDetails = ({ service }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-3xl">{getServiceIcon(service)}</span>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 capitalize">
            {service.name.replace('-', ' ')}
          </h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getServiceColor(service.type).replace('from-', 'bg-').replace(' to-', '').replace('-600', '-100').replace('-500', '-800')} text-white`}>
            {service.type} service
          </span>
        </div>
      </div>

      {service.description && (
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {service.description}
        </p>
      )}

      {service.endpoints && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Endpoints</h4>
          <div className="space-y-2">
            {service.endpoints.map((endpoint, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                    endpoint.method === 'GET' ? 'bg-green-500' :
                    endpoint.method === 'POST' ? 'bg-blue-500' :
                    endpoint.method === 'PUT' ? 'bg-yellow-500' :
                    endpoint.method === 'DELETE' ? 'bg-red-500' : 'bg-gray-500'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm">{endpoint.path}</code>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {endpoint.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical specs */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Technology</h5>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div>Framework: {architectureData?.framework || 'Spring Boot'}</div>
            <div>Language: Java</div>
            <div>Runtime: JVM 17+</div>
          </div>
        </div>
        <div>
          <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Configuration</h5>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div>Port: 8080</div>
            <div>Health: /actuator/health</div>
            <div>Metrics: /actuator/metrics</div>
          </div>
        </div>
      </div>
    </div>
  );

  const DetailsView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Object.values(services).flat().map((service, index) => (
        <motion.div
          key={service.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <ServiceDetails service={service} />
        </motion.div>
      ))}
    </div>
  );

  const DependenciesView = () => (
    <div className="space-y-6">
      {/* Connection Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-4">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Connection Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span className="text-sm">HTTP API</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-green-500"></div>
            <span className="text-sm">Database</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-yellow-500"></div>
            <span className="text-sm">Cache</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-purple-500 border-dashed"></div>
            <span className="text-sm">Authentication</span>
          </div>
        </div>
      </div>

      {/* Dependencies Matrix */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-6">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Service Dependencies</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left p-2">Service</th>
                <th className="text-left p-2">Depends On</th>
                <th className="text-left p-2">Connection Type</th>
                <th className="text-left p-2">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((conn, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="p-2 font-medium">{conn.from}</td>
                  <td className="p-2">{conn.to}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      conn.type === 'http' ? 'bg-blue-100 text-blue-800' :
                      conn.type === 'sql' ? 'bg-green-100 text-green-800' :
                      conn.type === 'cache' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {conn.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">
                    {conn.type === 'http' ? 'API Communication' :
                     conn.type === 'sql' ? 'Data Persistence' :
                     conn.type === 'cache' ? 'Performance Optimization' :
                     'Security & Authorization'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const SelectedServiceDetails = () => {
    if (!selectedService) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-4 top-20 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 max-h-[80vh] overflow-y-auto"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getServiceIcon(selectedService)}</span>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 capitalize">
                {selectedService.name.replace('-', ' ')}
              </h3>
            </div>
            <button
              onClick={() => setSelectedService(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4">
          <ServiceDetails service={selectedService} />
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
            Microservices Architecture
          </h2>
          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
            {Object.values(services).flat().length} services
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <ViewModeToggle />
          {viewMode === 'diagram' && <ZoomControls />}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 h-full">
        <AnimatePresence mode="wait">
          {viewMode === 'diagram' && (
            <motion.div
              key="diagram"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full relative"
            >
              {/* Canvas */}
              <div
                ref={canvasRef}
                className="h-full cursor-grab active:cursor-grabbing overflow-hidden"
                onMouseDown={handleMouseDown}
                style={{
                  transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px)`
                }}
              >
                {/* Render Services */}
                {Object.values(services).flat().map((service) => (
                  <ServiceCard
                    key={service.name}
                    service={service}
                    position={servicePositions[service.name]}
                    onClick={setSelectedService}
                  />
                ))}

                {/* Render Connections */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
                  {connections.map((connection, index) => (
                    <ConnectionLine key={index} connection={connection} />
                  ))}

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
                        fill="#6b7280"
                      />
                    </marker>
                  </defs>
                </svg>

                {/* Layer Labels */}
                <div className="absolute left-4 top-16 space-y-36 pointer-events-none">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
                    Infrastructure Layer
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
                    Business Layer
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
                    Data Layer
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 overflow-auto h-full"
            >
              <DetailsView />
            </motion.div>
          )}

          {viewMode === 'dependencies' && (
            <motion.div
              key="dependencies"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 overflow-auto h-full"
            >
              <DependenciesView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Service Details */}
      <AnimatePresence>
        {selectedService && viewMode === 'diagram' && <SelectedServiceDetails />}
      </AnimatePresence>

      {/* Empty State */}
      {(!apiData || !apiData.endpoints || apiData.endpoints.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">No Architecture Data</h3>
            <p className="text-gray-400">Upload and process a file to see the microservices architecture</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MicroservicesArchitecture;