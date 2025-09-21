import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Action types
const CHAT_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SESSIONS: 'SET_SESSIONS',
  SET_CURRENT_SESSION: 'SET_CURRENT_SESSION',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_MESSAGES: 'SET_MESSAGES',
  SET_HEALTH_TIPS: 'SET_HEALTH_TIPS',
  SET_VOICE_STATUS: 'SET_VOICE_STATUS',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_CHAT: 'RESET_CHAT',
  UPDATE_SESSION: 'UPDATE_SESSION'
};

// Initial state
const initialState = {
  sessions: [],
  currentSession: null,
  messages: [],
  healthTips: [],
  isLoading: false,
  error: null,
  voiceStatus: {
    isRecording: false,
    isInCall: false,
    callId: null,
    isConnecting: false
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  }
};

// Reducer function
const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case CHAT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case CHAT_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case CHAT_ACTIONS.SET_SESSIONS:
      return {
        ...state,
        sessions: action.payload.sessions,
        pagination: action.payload.pagination,
        isLoading: false
      };

    case CHAT_ACTIONS.SET_CURRENT_SESSION:
      return {
        ...state,
        currentSession: action.payload,
        messages: action.payload?.messages || []
      };

    case CHAT_ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };

    case CHAT_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload
      };

    case CHAT_ACTIONS.SET_HEALTH_TIPS:
      return {
        ...state,
        healthTips: action.payload
      };

    case CHAT_ACTIONS.SET_VOICE_STATUS:
      return {
        ...state,
        voiceStatus: {
          ...state.voiceStatus,
          ...action.payload
        }
      };

    case CHAT_ACTIONS.UPDATE_SESSION:
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.sessionId === action.payload.sessionId
            ? { ...session, ...action.payload.updates }
            : session
        ),
        currentSession: state.currentSession?.sessionId === action.payload.sessionId
          ? { ...state.currentSession, ...action.payload.updates }
          : state.currentSession
      };

    case CHAT_ACTIONS.RESET_CHAT:
      return {
        ...initialState,
        sessions: state.sessions // Keep sessions list
      };

    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, token } = useAuth();

  const API_BASE_URL = 'http://localhost:5000/api/chatbot';

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  // Load user's chat sessions on mount
  useEffect(() => {
    if (user && token) {
      loadChatSessions();
      loadHealthTips();
    }
  }, [user, token]);

  // Chat session management
  const startNewSession = async (initialMessage = '', language = 'en') => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR });

      const response = await axios.post(`${API_BASE_URL}/session/start`, {
        language,
        initialMessage
      });

      if (response.data.success) {
        const sessionData = response.data.data;
        const newSession = {
          sessionId: sessionData.sessionId,
          title: 'New Health Consultation',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          messages: [{
            id: Date.now(),
            role: 'assistant',
            content: sessionData.greeting,
            timestamp: new Date(),
            type: 'text'
          }]
        };

        dispatch({ type: CHAT_ACTIONS.SET_CURRENT_SESSION, payload: newSession });
        dispatch({ type: CHAT_ACTIONS.SET_SESSIONS, payload: {
          sessions: [newSession, ...state.sessions],
          pagination: state.pagination
        }});

        return newSession;
      }
    } catch (error) {
      console.error('Failed to start new session:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Failed to start new chat session' });
      throw error;
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const loadChatSessions = async (page = 1, limit = 10) => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });

      const response = await axios.get(`${API_BASE_URL}/sessions`, {
        params: { page, limit }
      });

      if (response.data.success) {
        dispatch({ type: CHAT_ACTIONS.SET_SESSIONS, payload: response.data.data });
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Failed to load chat sessions' });
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const loadSession = async (sessionId) => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });

      const response = await axios.get(`${API_BASE_URL}/session/${sessionId}`);

      if (response.data.success) {
        const sessionData = response.data.data;
        dispatch({ type: CHAT_ACTIONS.SET_CURRENT_SESSION, payload: sessionData });
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Failed to load conversation' });
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Message handling
  const sendMessage = async (content, messageType = 'text', voiceData = null) => {
    if (!state.currentSession) {
      throw new Error('No active session');
    }

    try {
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
        type: messageType,
        voiceData
      };

      dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: userMessage });
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });

      const response = await axios.post(`${API_BASE_URL}/message`, {
        sessionId: state.currentSession.sessionId,
        message: content.trim(),
        messageType,
        voiceData
      });

      if (response.data.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.data.message.content,
          timestamp: new Date(response.data.data.message.timestamp),
          type: 'text'
        };

        dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: assistantMessage });

        // Update session in list
        dispatch({ type: CHAT_ACTIONS.UPDATE_SESSION, payload: {
          sessionId: state.currentSession.sessionId,
          updates: {
            updatedAt: new Date(),
            lastMessage: assistantMessage,
            messageCount: state.messages.length + 2
          }
        }});

        return assistantMessage;
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        type: 'error'
      };
      dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: errorMessage });
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Failed to send message' });
      throw error;
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Health features
  const loadHealthTips = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health/tips`, {
        params: { language: user?.language || 'en' }
      });

      if (response.data.success) {
        dispatch({ type: CHAT_ACTIONS.SET_HEALTH_TIPS, payload: response.data.data.tips });
      }
    } catch (error) {
      console.error('Failed to load health tips:', error);
    }
  };

  const analyzeSymptoms = async (symptoms, language = 'en') => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });

      const response = await axios.post(`${API_BASE_URL}/health/symptoms`, {
        symptoms,
        language
      });

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to analyze symptoms:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Failed to analyze symptoms' });
      throw error;
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Voice features
  const startVoiceCall = async (phoneNumber = null) => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_VOICE_STATUS, payload: { isConnecting: true } });

      const endpoint = phoneNumber ? '/voice/call' : '/voice/webrtc';
      const payload = phoneNumber
        ? { phoneNumber, sessionId: state.currentSession?.sessionId }
        : { sessionId: state.currentSession?.sessionId };

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload);

      if (response.data.success) {
        dispatch({ type: CHAT_ACTIONS.SET_VOICE_STATUS, payload: {
          isInCall: true,
          callId: response.data.data.callId,
          isConnecting: false,
          webRTCUrl: response.data.data.webRTCUrl
        }});

        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to start voice call:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Failed to start voice call' });
      dispatch({ type: CHAT_ACTIONS.SET_VOICE_STATUS, payload: { isConnecting: false } });
      throw error;
    }
  };

  const endVoiceCall = async () => {
    try {
      if (state.voiceStatus.callId) {
        await axios.delete(`${API_BASE_URL}/voice/call/${state.voiceStatus.callId}`);
      }

      dispatch({ type: CHAT_ACTIONS.SET_VOICE_STATUS, payload: {
        isInCall: false,
        callId: null,
        isConnecting: false,
        webRTCUrl: null
      }});
    } catch (error) {
      console.error('Failed to end voice call:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Failed to end voice call' });
    }
  };

  const setRecordingStatus = (isRecording) => {
    dispatch({ type: CHAT_ACTIONS.SET_VOICE_STATUS, payload: { isRecording } });
  };

  // Utility functions
  const clearError = () => {
    dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR });
  };

  const resetChat = () => {
    dispatch({ type: CHAT_ACTIONS.RESET_CHAT });
  };

  const value = {
    // State
    ...state,

    // Session management
    startNewSession,
    loadChatSessions,
    loadSession,

    // Message handling
    sendMessage,

    // Health features
    loadHealthTips,
    analyzeSymptoms,

    // Voice features
    startVoiceCall,
    endVoiceCall,
    setRecordingStatus,

    // Utility
    clearError,
    resetChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;