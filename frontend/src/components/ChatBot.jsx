import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Loader,
  Code,
  Database,
  Settings
} from 'lucide-react';
import axios from 'axios';

const ChatBot = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AS/400 modernization assistant. I can help you with:\n\n• Legacy code migration strategies\n• Modern technology integration\n• Performance optimization\n• Database modernization\n• API development\n\nWhat would you like to know about AS/400 modernization?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000/api/chatbot';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickQuestions = [
    {
      icon: <Code size={16} />,
      text: t('chatbot.quickQuestions.migration', 'How to migrate RPG code to modern languages?'),
      question: 'How can I migrate my RPG code to modern programming languages like Java or Python?'
    },
    {
      icon: <Database size={16} />,
      text: t('chatbot.quickQuestions.database', 'Database modernization strategies'),
      question: 'What are the best strategies for modernizing AS/400 databases?'
    },
    {
      icon: <Settings size={16} />,
      text: t('chatbot.quickQuestions.integration', 'API integration approaches'),
      question: 'How can I integrate modern APIs with my AS/400 system?'
    }
  ];

  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: messageText,
        userId: user?.id,
        sessionId: `as400_session_${Date.now()}`
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data.response || 'I apologize, but I\'m having trouble responding right now. Please try asking about AS/400 modernization topics like code migration, database updates, or API integration.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'I\'m currently experiencing technical difficulties. However, I can still help with AS/400 modernization questions about:\n\n• Legacy system migration\n• Database modernization\n• API development\n• Performance optimization\n\nPlease try your question again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    handleSendMessage(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{
      border: '1px solid var(--neutral-border)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-primary)',
      height: '500px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--neutral-border)',
        backgroundColor: 'var(--primary)',
        borderRadius: '8px 8px 0 0',
        color: 'var(--text-light)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Bot size={20} />
        <span style={{ fontWeight: '500' }}>
          {t('chatbot.title', 'AS/400 Modernization Assistant')}
        </span>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: message.type === 'bot' ? 'var(--primary)' : 'var(--secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {message.type === 'bot' ?
                <Bot size={16} color="white" /> :
                <User size={16} color="white" />
              }
            </div>
            <div style={{
              backgroundColor: message.type === 'bot' ? 'var(--neutral-light)' : 'var(--primary-light)',
              padding: '0.75rem',
              borderRadius: '8px',
              maxWidth: '80%',
              whiteSpace: 'pre-wrap',
              color: 'var(--text-primary)'
            }}>
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={16} color="white" />
            </div>
            <div style={{
              backgroundColor: 'var(--neutral-light)',
              padding: '0.75rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Loader size={16} className="animate-spin" />
              <span style={{ color: 'var(--text-secondary)' }}>
                {t('chatbot.typing', 'Thinking...')}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '0.5rem',
        borderTop: '1px solid var(--neutral-border)',
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {quickQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => handleQuickQuestion(question.question)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--neutral-border)',
              borderRadius: '16px',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'var(--primary-light)';
              e.target.style.color = 'var(--primary)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'var(--bg-secondary)';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            {question.icon}
            {question.text}
          </button>
        ))}
      </div>

      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--neutral-border)',
        display: 'flex',
        gap: '0.5rem'
      }}>
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('chatbot.placeholder', 'Ask about AS/400 modernization...')}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid var(--neutral-border)',
            borderRadius: '4px',
            resize: 'none',
            minHeight: '20px',
            maxHeight: '100px',
            fontSize: '0.875rem',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--primary)';
            e.target.style.boxShadow = '0 0 0 2px var(--primary-light)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--neutral-border)';
            e.target.style.boxShadow = 'none';
          }}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isLoading}
          style={{
            padding: '0.75rem',
            backgroundColor: (!inputMessage.trim() || isLoading) ? 'var(--neutral-medium)' : 'var(--primary)',
            color: 'var(--text-light)',
            border: 'none',
            borderRadius: '4px',
            cursor: (!inputMessage.trim() || isLoading) ? 'not-allowed' : 'pointer'
          }}
          onMouseOver={(e) => {
            if (inputMessage.trim() && !isLoading) {
              e.target.style.backgroundColor = 'var(--primary-hover)';
            }
          }}
          onMouseOut={(e) => {
            if (inputMessage.trim() && !isLoading) {
              e.target.style.backgroundColor = 'var(--primary)';
            }
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;