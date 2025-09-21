import React, { useState, useEffect } from 'react';
import EnhancedGlassCard from './EnhancedGlassCard';

const AIPreviewBox = ({ inputText, files, isProcessing }) => {
  const [previewText, setPreviewText] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const catchyPhrases = [
    "🚀 AI-powered transformation in progress...",
    "✨ Modernizing your AS/400 legacy with intelligence...",
    "🔥 Converting legacy code to cutting-edge solutions...",
    "⚡ Generating optimized architecture recommendations...",
    "🎯 Analyzing and transforming your enterprise systems...",
    "💎 Crafting next-generation migration strategies...",
    "🌟 Unleashing AI magic on your legacy infrastructure...",
    "🔮 Predicting optimal modernization pathways...",
    "🏗️ Building the future of your enterprise systems...",
    "🎨 Designing intelligent transformation blueprints..."
  ];

  useEffect(() => {
    if (inputText.length > 0 || files.length > 0) {
      setIsVisible(true);
      const randomPhrase = catchyPhrases[Math.floor(Math.random() * catchyPhrases.length)];
      setPreviewText(randomPhrase);
    } else {
      setIsVisible(false);
    }
  }, [inputText, files]);

  const getDynamicContent = () => {
    if (isProcessing) {
      return "🧠 AI is analyzing your input and generating comprehensive insights...";
    }

    if (files.length > 0 && inputText.length > 0) {
      return `🔄 Ready to process ${files.length} file(s) with your modernization query...`;
    }

    if (files.length > 0) {
      return `📁 ${files.length} file(s) uploaded - Add your question to begin AI analysis...`;
    }

    if (inputText.length > 10) {
      return "💫 AI ready to transform your AS/400 modernization challenge...";
    }

    return previewText;
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'relative',
      marginTop: '15px',
      animation: 'float 3s ease-in-out infinite'
    }}>
      <EnhancedGlassCard
        variant="premium"
        style={{
          padding: '20px',
          background: 'rgba(255, 215, 0, 0.12)',
          border: '1px solid rgba(255, 215, 0, 0.4)',
          animation: isProcessing ? 'solar-flare 2s ease-in-out infinite' : 'none'
        }}
      >
        {/* Solar flare accent */}
        <div style={{
          position: 'absolute',
          top: '-2px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60px',
          height: '4px',
          background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
          borderRadius: '2px',
          animation: 'shimmer 2s ease-in-out infinite'
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px'
        }}>
          <div style={{
            fontSize: '1.5rem',
            animation: isProcessing ? 'pulse-glow 1s infinite' : 'none'
          }}>
            🤖
          </div>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{
              margin: 0,
              color: '#FFD700',
              fontSize: '1.1rem',
              fontWeight: '600',
              background: 'linear-gradient(45deg, #FFD700, #FF8C00)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {getDynamicContent()}
            </p>

            {(inputText.length > 0 || files.length > 0) && (
              <div style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: 'rgba(255, 140, 0, 0.2)',
                borderRadius: '20px',
                display: 'inline-block'
              }}>
                <span style={{
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}>
                  {inputText.length > 0 && `${inputText.length} characters`}
                  {inputText.length > 0 && files.length > 0 && ' • '}
                  {files.length > 0 && `${files.length} file(s)`}
                </span>
              </div>
            )}
          </div>

          <div style={{
            fontSize: '1.2rem',
            animation: 'float 2s ease-in-out infinite'
          }}>
            ✨
          </div>
        </div>
      </EnhancedGlassCard>
    </div>
  );
};

export default AIPreviewBox;