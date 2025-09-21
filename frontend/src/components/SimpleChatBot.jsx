import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Minimize2,
  Maximize2,
  X,
  Bot,
  User,
  Loader,
  Heart,
  Activity
} from 'lucide-react';
import axios from 'axios';

const SimpleChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000/api/chatbot';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: Date.now(),
        role: 'assistant',
        content: 'Hello! I\'m Aarogya Sahayak, your AI health assistant. How can I help you with your health queries today?',
        timestamp: new Date(),
        type: 'text'
      }]);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (content) => {
    if (!content.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending message to API:', content.trim());

      // Use test endpoint directly
      const response = await axios.post(`${API_BASE_URL}/test`, {
        message: content.trim(),
        language: 'en'
      }, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.data.aiResponse,
          timestamp: new Date(),
          type: 'text'
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      let errorContent = 'Sorry, I encountered an error. Please try again.';

      if (error.response?.status === 404) {
        errorContent = 'API endpoint not found. Please check if the server is running.';
      } else if (error.response?.status === 500) {
        errorContent = 'Server error. Please try again in a moment.';
      } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
        errorContent = 'Cannot connect to server. Please check if the backend is running on http://localhost:5000';
      } else if (error.message.includes('timeout')) {
        errorContent = 'Request timed out. Please try again.';
      }

      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(errorContent);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleChat = () => {
    console.log('Chat button clicked, current isOpen:', isOpen);
    setIsOpen(!isOpen);
    setError(null);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message) => {
    const isUser = message.role === 'user';
    const isError = message.type === 'error';

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[80%]`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-blue-500 text-white ml-2'
              : isError
                ? 'bg-red-500 text-white mr-2'
                : 'bg-green-500 text-white mr-2'
          }`}>
            {isUser ? <User size={16} /> : isError ? <X size={16} /> : <Bot size={16} />}
          </div>

          {/* Message Content */}
          <div className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white'
              : isError
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-gray-100 text-gray-800'
          }`}>
            <div className="whitespace-pre-wrap">{message.content}</div>
            <div className={`text-xs mt-1 ${
              isUser ? 'text-blue-100' : isError ? 'text-red-600' : 'text-gray-500'
            }`}>
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Chat button (when closed)
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative group">
          <button
            onClick={toggleChat}
            onMouseDown={(e) => e.preventDefault()}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-300"
            aria-label="Open AI Health Assistant"
            type="button"
            style={{
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
              touchAction: 'manipulation'
            }}
          >
            <Heart size={24} />
          </button>

          {/* Pulse animation */}
          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75 pointer-events-none"></div>

          {/* Status indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Click to open AI Health Assistant
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart size={20} />
            <span className="font-semibold">Aarogya Sahayak</span>
            <Activity size={16} className="animate-pulse" />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMinimize}
              className="hover:bg-white hover:bg-opacity-20 p-1 rounded"
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white hover:bg-opacity-20 p-1 rounded"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border-b border-red-200 p-3">
                <div className="text-red-800 text-sm flex items-center">
                  <X size={16} className="mr-2" />
                  {error}
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-red-600 hover:text-red-800"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 && !isLoading && (
                <div className="text-center text-gray-500 py-8">
                  <Heart size={48} className="mx-auto mb-4 text-green-400" />
                  <p>Welcome to your AI Health Assistant!</p>
                  <p className="text-sm mt-2">Ask me anything about health, diet, exercise, or wellness.</p>
                </div>
              )}

              {messages.map(renderMessage)}

              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center space-x-2">
                    <Loader size={16} className="animate-spin" />
                    <span className="text-gray-600 text-sm">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your health question..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 transition-colors duration-200 flex items-center"
                >
                  {isLoading ? (
                    <Loader size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>

              <div className="text-xs text-gray-500 mt-2 text-center">
                This is for informational purposes only. Consult healthcare professionals for medical advice.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SimpleChatBot;