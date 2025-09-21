import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';

const ProfessionalInput = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Describe your AS/400 modernization challenge...",
  disabled = false
}) => {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map(file => ({
        file,
        name: file.name,
        size: file.size,
        id: Math.random().toString(36).substr(2, 9)
      }));
      setFiles(prev => [...prev, ...newFiles]);
    },
    noClick: true,
    accept: {
      'text/*': ['.txt', '.md'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async () => {
    if (!value.trim() && files.length === 0) return;

    setIsProcessing(true);
    try {
      await onSubmit({ text: value, files });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px' }}>
      {/* Main Input Container */}
      <div
        {...getRootProps()}
        style={{
          background: 'var(--bg-secondary)',
          border: `2px solid ${isDragActive ? '#FFD700' : 'var(--neutral-border)'}`,
          borderRadius: '12px',
          padding: '0',
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
      >
        <input {...getInputProps()} />

        {/* Drag Overlay */}
        {isDragActive && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 215, 0, 0.1)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            border: '2px dashed #FFD700'
          }}>
            <div style={{
              color: '#FFD700',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              📁 Drop files here to attach
            </div>
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '16px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontSize: '15px',
            fontFamily: 'inherit',
            resize: 'vertical',
            lineHeight: '1.5'
          }}
        />

        {/* Bottom Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderTop: '1px solid var(--neutral-border)',
          background: 'var(--bg-primary)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* File Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 140, 0, 0.1)';
                e.target.style.color = 'var(--accent-start)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              📎 Attach Files
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              accept=".txt,.md,.pdf,.doc,.docx"
              onChange={(e) => {
                const newFiles = Array.from(e.target.files).map(file => ({
                  file,
                  name: file.name,
                  size: file.size,
                  id: Math.random().toString(36).substr(2, 9)
                }));
                setFiles(prev => [...prev, ...newFiles]);
                e.target.value = '';
              }}
            />

            {/* File Count */}
            {files.length > 0 && (
              <span style={{
                color: 'var(--accent-start)',
                fontSize: '13px',
                background: 'rgba(255, 140, 0, 0.1)',
                padding: '2px 8px',
                borderRadius: '10px'
              }}>
                {files.length} file{files.length !== 1 ? 's' : ''}
              </span>
            )}

            {/* Character Count */}
            <span style={{
              color: 'var(--text-secondary)',
              fontSize: '12px'
            }}>
              {value.length} characters
            </span>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={disabled || isProcessing || (!value.trim() && files.length === 0)}
            className="btn-primary"
            style={{
              opacity: (disabled || isProcessing || (!value.trim() && files.length === 0)) ? 0.5 : 1,
              cursor: (disabled || isProcessing || (!value.trim() && files.length === 0)) ? 'not-allowed' : 'pointer'
            }}
          >
            {isProcessing ? 'Processing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Attached Files */}
      {files.length > 0 && (
        <div style={{
          marginTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {files.map((fileObj) => (
            <div
              key={fileObj.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--neutral-border)',
                borderRadius: '6px',
                fontSize: '13px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>
                  {fileObj.name.endsWith('.pdf') ? '📄' :
                   fileObj.name.endsWith('.doc') || fileObj.name.endsWith('.docx') ? '📝' :
                   '📄'}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {fileObj.name}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  ({formatFileSize(fileObj.size)})
                </span>
              </div>
              <button
                onClick={() => removeFile(fileObj.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  fontSize: '16px',
                  lineHeight: 1
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--error)';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = 'var(--text-secondary)';
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessionalInput;