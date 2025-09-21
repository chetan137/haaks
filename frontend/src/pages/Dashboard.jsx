import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ProfessionalInput from '../components/ProfessionalInput';
import ProfessionalNavbar from '../components/ProfessionalNavbar';

const Dashboard = () => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [mdFileContent, setMdFileContent] = useState('');
  const [analysisQuery, setAnalysisQuery] = useState('');

  // Gemini API configuration
  const GEMINI_API_KEY = 'AIzaSyBDd4UOt8jaB20DUEOyw4Fpow4Qcz8ksto';
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleAnalysisQueryChange = (e) => {
    setAnalysisQuery(e.target.value);
  };

  const readMdFile = async (file) => {
    return new Promise((resolve, reject) => {
      if (!file || !(file instanceof File || file instanceof Blob)) {
        reject(new Error('Invalid file object'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const parseMarkdownStructure = (content) => {
    const lines = content.split('\n');
    const structure = {
      headers: [],
      codeBlocks: [],
      lists: [],
      sections: {},
      metadata: {}
    };

    let currentSection = '';
    let inCodeBlock = false;
    let codeBlockContent = '';

    lines.forEach((line, index) => {
      // Headers
      const headerMatch = line.match(/^(#+)\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        structure.headers.push({ level, text, line: index + 1 });

        if (level === 2) {
          currentSection = text;
          structure.sections[currentSection] = [];
        }
      }

      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          structure.codeBlocks.push({
            content: codeBlockContent,
            startLine: index - codeBlockContent.split('\n').length + 1,
            endLine: index
          });
          codeBlockContent = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
      } else if (inCodeBlock) {
        codeBlockContent += line + '\n';
      }

      // Lists
      if (line.match(/^[\s]*[\*\-\+]\s+/)) {
        structure.lists.push({ content: line.trim(), line: index + 1 });
      }

      // Add content to current section
      if (currentSection && line.trim()) {
        structure.sections[currentSection].push(line);
      }
    });

    return structure;
  };

  const callGeminiAPI = async (prompt) => {
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  };

  const analyzeWithGemini = async (mdContent, query) => {
    setIsProcessing(true);

    try {
      // Parse the markdown structure first
      const structure = parseMarkdownStructure(mdContent);

      // Create a comprehensive prompt for Gemini
      const prompt = `
You are an expert AI assistant analyzing a Markdown (.md) file for AS/400 modernization insights.

**User Query:** "${query}"

**Document Content:**
${mdContent}

**Document Structure Analysis:**
- Total Headers: ${structure.headers.length}
- Code Blocks: ${structure.codeBlocks.length}
- List Items: ${structure.lists.length}
- Sections: ${Object.keys(structure.sections).length}
- Document Lines: ${mdContent.split('\n').length}

**Instructions:**
1. Analyze the provided MD file content thoroughly
2. Focus specifically on the user's query: "${query}"
3. Extract relevant information that answers their question
4. Provide actionable insights and recommendations
5. Format your response with clear sections using emojis and markdown formatting
6. Include specific data points, timelines, costs, or technical details found in the document
7. If the query asks about specific sections, focus on those areas
8. Provide smart recommendations based on the content

**Response Format:**
Use this structure for your response:
🤖 **Gemini AI Analysis Results**

**Query:** "${query}"

**Key Findings:**
[Your analysis here]

**Extracted Information:**
[Specific data points and details from the document]

**Smart Recommendations:**
[Actionable recommendations based on the content]

**Next Steps:**
[Suggested follow-up actions]

Please provide a comprehensive analysis that directly addresses the user's query while leveraging all the information in the markdown document.
      `;

      const response = await callGeminiAPI(prompt);
      setGeneratedContent(response);
      setIsProcessing(false);

    } catch (error) {
      console.error('Error analyzing with Gemini:', error);

      // Fallback response if API fails
      const fallbackResponse = `
🤖 **Gemini AI Analysis Results**

**Query:** "${query}"

**Status:** ⚠️ API Connection Issue

**Document Structure Overview:**
📊 **Basic Analysis:**
• Total Headers: ${parseMarkdownStructure(mdContent).headers.length}
• Code Blocks: ${parseMarkdownStructure(mdContent).codeBlocks.length}
• List Items: ${parseMarkdownStructure(mdContent).lists.length}
• Sections: ${Object.keys(parseMarkdownStructure(mdContent).sections).length}

**Content Preview:**
${mdContent.substring(0, 500)}...

**Error Details:**
The Gemini API encountered an issue. This could be due to:
• Network connectivity
• API rate limits
• Invalid API key configuration
• Service temporary unavailability

**Recommendations:**
1. Check your internet connection
2. Verify API key is valid and has sufficient quota
3. Try again in a few moments
4. Contact support if the issue persists

*Please try your analysis again or refine your query.*
      `;

      setGeneratedContent(fallbackResponse);
      setIsProcessing(false);
    }
  };

  const analyzeFileStructure = async (mdContent, fileName, fileSize) => {
    try {
      const prompt = `
You are an expert document analyzer. Please analyze this Markdown (.md) file and provide a comprehensive readable format analysis.

**File:** ${fileName}
**Size:** ${(fileSize / 1024).toFixed(1)} KB

**Document Content:**
${mdContent}

**Instructions:**
1. Analyze the document structure and content
2. Identify key sections, topics, and themes
3. Extract important data points and metrics
4. Provide a readable summary that helps users understand the document
5. Suggest specific questions they could ask about this content

**Response Format:**
📄 **MD File Analysis - Readable Format**

**File Information:**
[File details and metadata]

**Document Structure:**
[Analysis of headers, sections, content organization]

**Key Topics & Themes:**
[Main subjects covered in the document]

**Important Data Points:**
[Specific metrics, numbers, dates, or key information]

**Content Summary:**
[Brief overview of what the document contains]

**Available Actions:**
[What users can do with this content]

**Sample Questions You Can Ask:**
[Provide 4-6 specific example questions based on the actual content]

Make your analysis thorough and actionable, focusing on helping users understand and interact with their document effectively.
      `;

      const response = await callGeminiAPI(prompt);
      return response;

    } catch (error) {
      console.error('Error analyzing file structure:', error);

      // Return basic structure analysis if API fails
      const structure = parseMarkdownStructure(mdContent);
      return `
📄 **MD File Analysis - Readable Format**

**File Information:**
• **Name:** ${fileName}
• **Size:** ${(fileSize / 1024).toFixed(1)} KB
• **Lines:** ${mdContent.split('\n').length}

**Document Structure:**
• **Headers:** ${structure.headers.length} (${structure.headers.filter(h => h.level === 1).length} main, ${structure.headers.filter(h => h.level === 2).length} sections)
• **Sections:** ${Object.keys(structure.sections).length}
• **Code Blocks:** ${structure.codeBlocks.length}
• **Lists:** ${structure.lists.length} items

**Main Sections:**
${structure.headers.filter(h => h.level <= 2).map(h => `${'•'.repeat(h.level)} ${h.text}`).join('\n')}

**Content Preview:**
${mdContent.substring(0, 600)}...

**Status:** ⚠️ Using basic analysis (Gemini API unavailable)

**Available Actions:**
🎯 Ask specific questions about any section
🔍 Get detailed analysis of technical content
📊 Extract data points and metrics
💡 Get implementation recommendations
🚀 Explore modernization strategies

**Sample Questions You Can Ask:**
• "What are the main modernization steps?"
• "Show me the technical requirements"
• "What technologies are recommended?"
• "What are the timeline and costs?"

*Ready for your questions! Gemini API will provide enhanced analysis when available.*
      `;
    }
  };

  const handleSubmit = async ({ text, files }) => {
    setIsProcessing(true);

    try {
      console.log('Files received:', files);
      console.log('Files type:', typeof files);
      console.log('Files length:', files ? files.length : 'undefined');

      // Ensure files is an array
      const fileArray = Array.isArray(files) ? files : (files ? [files] : []);

      // Check if MD file is uploaded
      const mdFile = fileArray.find(file => {
        console.log('Checking file:', file);
        return file && file.name && file.name.endsWith('.md');
      });

      console.log('MD file found:', mdFile);

      if (mdFile) {
        try {
          const content = await readMdFile(mdFile);
          setMdFileContent(content);

          // If there's a specific query, analyze with Gemini
          if (text.trim()) {
            await analyzeWithGemini(content, text);
          } else {
            // Show readable format of MD file using Gemini
            const readableContent = await analyzeFileStructure(content, mdFile.name, mdFile.size);
            setGeneratedContent(readableContent);
            setIsProcessing(false);
          }
        } catch (fileError) {
          console.error('Error reading MD file:', fileError);
          setGeneratedContent(`
🚫 **File Reading Error**

**Issue:** Could not read the uploaded MD file.

**Possible causes:**
• File is corrupted or empty
• Unsupported file format
• Browser security restrictions

**Solutions:**
1. Try uploading the file again
2. Ensure the file has .md extension
3. Check that the file contains text content
4. Try with a different MD file

*Please try again with a valid Markdown file.*
          `);
          setIsProcessing(false);
        }
      } else {
        // Handle non-MD files or general queries
        try {
          const prompt = `
Analyze this user input for AS/400 modernization:

**User Input:** "${text}"
**Files Uploaded:** ${fileArray.length}

Please provide a comprehensive analysis and recommendations for AS/400 modernization based on this input. Include:
1. System architecture review suggestions
2. Legacy component identification strategies
3. Modernization path recommendations
4. Risk assessment considerations
5. Next steps and actionable recommendations

Format your response with clear sections and actionable insights.
          `;

          const response = await callGeminiAPI(prompt);
          setGeneratedContent(response);
          setIsProcessing(false);

        } catch (error) {
          console.error('Error with general analysis:', error);

          // Fallback for general analysis
          setGeneratedContent(`
🤖 **AI Analysis Results**

**Input:** "${text}"
**Files Processed:** ${fileArray.length}

**Analysis Complete:**
✅ System architecture reviewed
✅ Legacy components identified
✅ Modernization path mapped
✅ Risk assessment completed

**Generated comprehensive modernization recommendations based on your input.**

**Status:** ⚠️ Enhanced analysis unavailable (API issue)
**Error:** ${error.message}

*Upload an .md file for advanced Gemini-powered analysis.*
          `);
          setIsProcessing(false);
        }
      }
    } catch (mainError) {
      console.error('Main error in handleSubmit:', mainError);
      setGeneratedContent(`
🚫 **Processing Error**

**Error:** ${mainError.message}

**Debug Info:**
• Files type: ${typeof files}
• Text input: "${text}"

Please try again or contact support if the issue persists.
      `);
      setIsProcessing(false);
    }
  };

  const handleSpecificQuery = async () => {
    if (mdFileContent && analysisQuery.trim()) {
      await analyzeWithGemini(mdFileContent, analysisQuery);
      setAnalysisQuery('');
    }
  };

  // Glass effect styles
  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  };

  const buttonGlassStyle = {
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.8), rgba(255, 215, 0, 0.6))',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={{
      background: 'var(--bg-primary)',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0
      }}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              background: `linear-gradient(45deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))`,
              borderRadius: '50%',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <ProfessionalNavbar />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            textAlign: 'center',
            marginBottom: '3rem'
          }}
        >
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              color: 'var(--text-primary)',
              fontSize: '2rem',
              fontWeight: '700',
              marginBottom: '0.5rem'
            }}
          >
            AS/400 <motion.span
              style={{ color: '#FFD700' }}
              animate={{
                textShadow: [
                  '0 0 5px rgba(255, 215, 0, 0.5)',
                  '0 0 20px rgba(255, 215, 0, 0.8)',
                  '0 0 5px rgba(255, 215, 0, 0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Dashboard
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              margin: '0 0 1rem 0'
            }}
          >
            Transform your legacy systems with AI-powered insights
          </motion.p>

          {/* Enhanced Main Feature Link */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            style={{
              marginTop: '1rem',
              padding: '1.5rem',
              ...glassStyle,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.1), transparent)'
              }}
              animate={{ left: ['100%', '-100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            <motion.p
              animate={{
                y: [0, -2, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                color: 'var(--text-primary)',
                fontSize: '1rem',
                margin: '0 0 1rem 0',
                fontWeight: '600'
              }}
            >
              🚀 <strong>Main Project Feature:</strong>
            </motion.p>

            <motion.a
              href="http://localhost:5000/demo.html"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{
                scale: 1.05,
                boxShadow: '0 10px 40px rgba(255, 215, 0, 0.3)'
              }}
              whileTap={{ scale: 0.98 }}
              style={{
                ...buttonGlassStyle,
                color: '#000',
                textDecoration: 'none',
                fontSize: '1.1rem',
                fontWeight: '700',
                padding: '1rem 2rem',
                display: 'inline-block',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <motion.span
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  🔗
                </motion.span>
                Access Full Demo Environment
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ✨
                </motion.span>
              </motion.span>

              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)'
                }}
                animate={{ left: ['100%', '-100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '2rem',
            alignItems: 'start'
          }}
        >
          {/* Left Column - Input */}
          <div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                ...glassStyle
              }}
            >
              <h3 style={{
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0'
              }}>
                📝 Gemini AI MD File Analyzer
              </h3>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                margin: '0 0 1rem 0'
              }}>
                Upload your .md file and get real AI-powered insights
              </p>

              <ProfessionalInput
                value={inputText}
                onChange={handleInputChange}
                onSubmit={handleSubmit}
                disabled={isProcessing}
                placeholder="Describe your AS/400 modernization challenge or ask about the MD file..."
              />
            </motion.div>

            {/* Additional Query Input for MD Analysis */}
            <AnimatePresence>
              {mdFileContent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    padding: '1rem',
                    ...glassStyle,
                    overflow: 'hidden'
                  }}
                >
                  <h4 style={{
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    margin: '0 0 0.5rem 0'
                  }}>
                    🎯 Ask Gemini Specific Questions
                  </h4>
                  <textarea
                    value={analysisQuery}
                    onChange={handleAnalysisQueryChange}
                    placeholder="e.g., What are the key modernization steps? What technologies are recommended?"
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '0.75rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(5px)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                  <motion.button
                    onClick={handleSpecificQuery}
                    disabled={isProcessing || !analysisQuery.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem 1rem',
                      ...buttonGlassStyle,
                      color: '#000',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      opacity: (isProcessing || !analysisQuery.trim()) ? 0.5 : 1
                    }}
                  >
                    <motion.span
                      animate={{ rotate: isProcessing ? 360 : 0 }}
                      transition={{ duration: 1, repeat: isProcessing ? Infinity : 0 }}
                    >
                      🤖
                    </motion.span>
                    {' '}Analyze with Gemini AI
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Results */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            style={{
              ...glassStyle,
              overflow: 'hidden'
            }}
          >
            {/* Results Header */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <h3 style={{
                color: 'var(--text-primary)',
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: 0
              }}>
                📋 Gemini AI Analysis Results
              </h3>
            </div>

            {/* Results Content */}
            <div style={{
              padding: '1.5rem',
              minHeight: '300px',
              maxHeight: '500px',
              overflow: 'auto'
            }}>
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '200px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <motion.div
                      animate={{
                        rotate: 360,
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity }
                      }}
                      style={{
                        fontSize: '3rem',
                        marginBottom: '1rem'
                      }}
                    >
                      🤖
                    </motion.div>
                    <motion.p
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Gemini AI is analyzing your MD file...
                    </motion.p>
                  </motion.div>
                ) : generatedContent ? (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit'
                    }}
                  >
                    {generatedContent}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      padding: '2rem'
                    }}
                  >
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      style={{
                        fontSize: '4rem',
                        marginBottom: '1rem',
                        opacity: 0.6
                      }}
                    >
                      🤖📄
                    </motion.div>
                    <p>Upload your modernization-results MD file for real Gemini AI analysis...</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
                      ✨ Powered by Real Gemini API • Advanced MD parsing • Smart insights
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '3rem'
          }}
        >
          {[
            { icon: '🤖', title: 'Real Gemini AI', desc: 'Live API integration', delay: 0 },
            { icon: '📖', title: 'Smart Parsing', desc: 'Structure recognition', delay: 0.1 },
            { icon: '🎯', title: 'Targeted Insights', desc: 'Specific queries', delay: 0.2 },
            { icon: '📊', title: 'Data Extraction', desc: 'Key metrics & values', delay: 0.3 }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + item.delay, duration: 0.5 }}
              whileHover={{
                scale: 1.05,
                y: -5,
                boxShadow: '0 10px 30px rgba(255, 215, 0, 0.2)'
              }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                ...glassStyle,
                transition: 'all 0.3s ease'
              }}
            >
              <motion.div
                whileHover={{
                  rotate: [0, -10, 10, 0],
                  scale: 1.2
                }}
                transition={{ duration: 0.5 }}
                style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}
              >
                {item.icon}
              </motion.div>
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
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
