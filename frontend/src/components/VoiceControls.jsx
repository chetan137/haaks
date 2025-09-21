import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Loader,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';

const VoiceControls = () => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  useEffect(() => {
    checkMicrophonePermission();
    initializeSpeechRecognition();
    initializeSpeechSynthesis();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      startTimer();
    } else {
      stopTimer();
    }
  }, [isRecording]);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setError('Microphone access is required for voice features');
      setPermissionGranted(false);
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscription(transcript);
        processVoiceCommand(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError('Speech recognition failed. Please try again.');
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const initializeSpeechSynthesis = () => {
    speechSynthesisRef.current = window.speechSynthesis;
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingTime(0);
  };

  const startVoiceRecognition = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    setError(null);
    setTranscription('');
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setError('Failed to start voice recognition');
      setIsListening(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceCommand = async (transcript) => {
    setIsProcessing(true);

    try {
      // Simulate AS/400 modernization assistant response
      const response = generateAS400Response(transcript);
      setLastResponse(response);

      // Speak the response
      speakResponse(response);

      // Clear transcription after delay
      setTimeout(() => setTranscription(''), 3000);
    } catch (error) {
      console.error('Error processing voice command:', error);
      setError('Failed to process voice command');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAS400Response = (transcript) => {
    const lowerTranscript = transcript.toLowerCase();

    if (lowerTranscript.includes('migrate') || lowerTranscript.includes('migration')) {
      return 'For AS/400 migration, I recommend starting with code analysis tools to identify dependencies, then gradually migrating modules to modern platforms like Java or cloud services.';
    } else if (lowerTranscript.includes('database') || lowerTranscript.includes('db2')) {
      return 'To modernize AS/400 databases, consider migrating from DB2 to cloud databases, implementing APIs for data access, and using modern data integration tools.';
    } else if (lowerTranscript.includes('api') || lowerTranscript.includes('integration')) {
      return 'You can integrate AS/400 systems using REST APIs, web services, or message queues. Start with identifying critical business processes that need external integration.';
    } else if (lowerTranscript.includes('performance') || lowerTranscript.includes('optimize')) {
      return 'AS/400 performance can be improved through code optimization, database tuning, and implementing modern caching strategies during the modernization process.';
    } else {
      return 'I can help with AS/400 modernization including code migration, database updates, API integration, and performance optimization. What specific area would you like to explore?';
    }
  };

  const speakResponse = (text) => {
    if (!speechSynthesisRef.current) return;

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setError('Failed to speak response');
    };

    speechSynthesisRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanup = () => {
    if (isListening) {
      stopVoiceRecognition();
    }
    if (isSpeaking) {
      stopSpeaking();
    }
    stopTimer();
  };

  if (!permissionGranted) {
    return (
      <div style={{
        backgroundColor: 'var(--highlight-light)',
        border: '1px solid var(--highlight)',
        borderRadius: '8px',
        padding: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-primary)',
          fontWeight: '500',
          marginBottom: '0.5rem'
        }}>
          <MicOff size={20} />
          <span>{t('voice.permissionRequired', 'Microphone Permission Required')}</span>
        </div>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          marginBottom: '1rem'
        }}>
          {t('voice.permissionMessage', 'Please allow microphone access to use voice features.')}
        </p>
        <button
          onClick={checkMicrophonePermission}
          style={{
            backgroundColor: 'var(--highlight)',
            color: 'var(--text-primary)',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = 'var(--highlight-hover)'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'var(--highlight)'}
        >
          {t('voice.grantPermission', 'Grant Permission')}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid var(--neutral-border)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-primary)',
      padding: '1rem'
    }}>
      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: 'var(--error)',
          color: 'var(--text-light)',
          borderRadius: '4px',
          padding: '0.75rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.875rem' }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-light)',
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Transcription Display */}
      {transcription && (
        <div style={{
          backgroundColor: 'var(--primary-light)',
          border: '1px solid var(--primary)',
          borderRadius: '4px',
          padding: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            <strong>{t('voice.transcription', 'You said:')} </strong>
            {transcription}
          </div>
        </div>
      )}

      {/* Response Display */}
      {lastResponse && (
        <div style={{
          backgroundColor: 'var(--secondary-light)',
          border: '1px solid var(--secondary)',
          borderRadius: '4px',
          padding: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            <strong>{t('voice.response', 'Assistant:')} </strong>
            {lastResponse}
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        {/* Voice Recognition Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
            disabled={isProcessing || isSpeaking}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: isListening ? 'var(--error)' : 'var(--primary)',
              color: 'var(--text-light)',
              border: 'none',
              borderRadius: '4px',
              cursor: isProcessing || isSpeaking ? 'not-allowed' : 'pointer',
              opacity: isProcessing || isSpeaking ? 0.6 : 1
            }}
            onMouseOver={(e) => {
              if (!isProcessing && !isSpeaking) {
                e.target.style.backgroundColor = isListening ? 'var(--error)' : 'var(--primary-hover)';
              }
            }}
            onMouseOut={(e) => {
              if (!isProcessing && !isSpeaking) {
                e.target.style.backgroundColor = isListening ? 'var(--error)' : 'var(--primary)';
              }
            }}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            <span>
              {isListening
                ? t('voice.listening', 'Listening...')
                : t('voice.startListening', 'Ask Question')
              }
            </span>
          </button>

          {isProcessing && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-secondary)'
            }}>
              <Loader size={16} className="animate-spin" />
              <span style={{ fontSize: '0.875rem' }}>
                {t('voice.processing', 'Processing...')}
              </span>
            </div>
          )}
        </div>

        {/* Speech Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isSpeaking ? (
            <button
              onClick={stopSpeaking}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--error)',
                color: 'var(--text-light)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              <VolumeX size={16} />
              <span>{t('voice.stopSpeaking', 'Stop')}</span>
            </button>
          ) : (
            lastResponse && (
              <button
                onClick={() => speakResponse(lastResponse)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--text-light)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'var(--secondary-hover)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'var(--secondary)'}
              >
                <Volume2 size={16} />
                <span>{t('voice.repeat', 'Repeat')}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Status */}
      <div style={{
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        textAlign: 'center'
      }}>
        {isListening
          ? t('voice.listeningStatus', 'Say your AS/400 modernization question...')
          : isProcessing
          ? t('voice.processingStatus', 'Analyzing your question...')
          : isSpeaking
          ? t('voice.speakingStatus', 'Speaking response...')
          : t('voice.readyStatus', 'Click "Ask Question" to start voice interaction')
        }
      </div>

      {/* Voice Hints */}
      <div style={{
        marginTop: '0.75rem',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        {t('voice.hints', 'Try asking: "How do I migrate RPG code?" or "What are API integration strategies?"')}
      </div>
    </div>
  );
};

export default VoiceControls;