import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProfessionalInput from '../components/ProfessionalInput';
import ProfessionalNavbar from '../components/ProfessionalNavbar';

const Dashboard = () => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async ({ text, files }) => {
    setIsProcessing(true);
    // Simulate AI processing
    setTimeout(() => {
      setGeneratedContent(`AI Analysis for: "${text}"\n\nFiles processed: ${files.length}\n\nGenerated comprehensive modernization recommendations based on your input.`);
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <div style={{
      background: 'var(--bg-primary)',
      minHeight: '100vh'
    }}>
      <ProfessionalNavbar />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h1 style={{
            color: 'var(--text-primary)',
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '0.5rem'
          }}>
            AS/400 <span style={{ color: '#FFD700' }}>Dashboard</span>
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            margin: 0
          }}>
            Transform your legacy systems with AI-powered insights
          </p>
        </div>

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Left Column - Input */}
          <div>
            <ProfessionalInput
              value={inputText}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              disabled={isProcessing}
            />
          </div>

          {/* Right Column - Results */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--neutral-border)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {/* Results Header */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid var(--neutral-border)',
              background: 'var(--bg-primary)'
            }}>
              <h3 style={{
                color: 'var(--text-primary)',
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: 0
              }}>
                📋 Analysis Results
              </h3>
            </div>

            {/* Results Content */}
            <div style={{
              padding: '1.5rem',
              minHeight: '300px',
              maxHeight: '500px',
              overflow: 'auto'
            }}>
              {isProcessing ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    marginBottom: '1rem',
                    animation: 'spin 1s linear infinite'
                  }}>
                    ⚡
                  </div>
                  <p>Processing your request...</p>
                </div>
              ) : generatedContent ? (
                <pre style={{
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit'
                }}>
                  {generatedContent}
                </pre>
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  padding: '2rem'
                }}>
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    opacity: 0.5
                  }}>
                    🤖
                  </div>
                  <p>AI-generated insights will appear here after processing your input...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginTop: '3rem'
        }}>
          {[
            { icon: '🔥', title: 'AI Assistant', desc: 'Intelligent guidance' },
            { icon: '⚡', title: 'Voice Control', desc: 'Hands-free interaction' },
            { icon: '📊', title: 'Analytics', desc: 'System insights' },
            { icon: '📄', title: 'Export', desc: 'Download results' }
          ].map((item, index) => (
            <div
              key={index}
              className="card"
              style={{
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{
                fontSize: '2rem',
                marginBottom: '0.5rem'
              }}>
                {item.icon}
              </div>
              <h4 style={{
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: '600',
                margin: '0 0 0.25rem 0'
              }}>
                {item.title}
              </h4>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                margin: 0
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;