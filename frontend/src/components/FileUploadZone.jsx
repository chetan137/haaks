import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import EnhancedGlassCard from './EnhancedGlassCard';

const FileUploadZone = ({ onFilesAdded, disabled = false }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      id: Math.random().toString(36).substr(2, 9)
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    onFilesAdded && onFilesAdded(newFiles);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    accept: {
      'text/*': ['.txt', '.md', '.json'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    }
  });

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ width: '100%' }}>
      <EnhancedGlassCard
        variant="subtle"
        style={{
          minHeight: '120px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: isDragActive ? '2px solid #FFD700' : '1px dashed rgba(255, 215, 0, 0.3)',
          background: isDragActive ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 215, 0, 0.05)'
        }}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <div style={{
          textAlign: 'center',
          color: 'var(--text-primary)',
          padding: '20px'
        }}>
          {isDragActive ? (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📁</div>
              <p style={{ margin: 0, fontSize: '1.1rem', color: '#FFD700' }}>
                Drop files here to upload...
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📎</div>
              <p style={{ margin: 0, fontSize: '1rem' }}>
                Drag & drop files here, or click to select
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Supports: PDF, DOC, TXT, Images
              </p>
            </>
          )}
        </div>
      </EnhancedGlassCard>

      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{
            color: '#FFD700',
            margin: '0 0 10px 0',
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            Uploaded Files ({uploadedFiles.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uploadedFiles.map((fileObj) => (
              <EnhancedGlassCard
                key={fileObj.id}
                variant="subtle"
                style={{
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>
                    {fileObj.type.includes('image') ? '🖼️' :
                     fileObj.type.includes('pdf') ? '📄' :
                     fileObj.type.includes('text') ? '📝' : '📄'}
                  </span>
                  <div>
                    <p style={{
                      margin: 0,
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      {fileObj.name}
                    </p>
                    <p style={{
                      margin: 0,
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem'
                    }}>
                      {formatFileSize(fileObj.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(fileObj.id);
                  }}
                  style={{
                    background: 'rgba(255, 48, 48, 0.8)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </EnhancedGlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;