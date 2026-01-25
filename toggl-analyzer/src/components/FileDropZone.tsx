import { useState, useCallback, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';

interface FileDropZoneProps {
  onFileLoaded: (data: ArrayBuffer, fileName: string) => void;
  onError: (error: string) => void;
  isLoading: boolean;
}

export function FileDropZone({ onFileLoaded, onError, isLoading }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFile = useCallback((file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      onError('Please upload a valid Excel file (.xlsx, .xls) or CSV file.');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result instanceof ArrayBuffer) {
        onFileLoaded(result, file.name);
      }
    };

    reader.onerror = () => {
      onError('Failed to read file. Please try again.');
    };

    reader.readAsArrayBuffer(file);
  }, [onFileLoaded, onError]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      className={`file-drop-zone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
      
      <div className="drop-zone-content">
        {isLoading ? (
          <>
            <div className="spinner"></div>
            <p>Processing file...</p>
          </>
        ) : (
          <>
            <svg 
              className="upload-icon" 
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="primary-text">
              Drop your Toggl Track export file here
            </p>
            <p className="secondary-text">
              or click to browse
            </p>
            <p className="file-types">
              Supports .xlsx, .xls, and .csv files
            </p>
          </>
        )}
      </div>

      <style>{`
        .file-drop-zone {
          border: 2px dashed #4a5568;
          border-radius: 12px;
          padding: 48px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #1a1a2e;
        }

        .file-drop-zone:hover {
          border-color: #667eea;
          background: #1e1e36;
        }

        .file-drop-zone.dragging {
          border-color: #667eea;
          background: #252545;
          transform: scale(1.02);
        }

        .file-drop-zone.loading {
          cursor: wait;
          pointer-events: none;
        }

        .drop-zone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .upload-icon {
          color: #667eea;
          margin-bottom: 8px;
        }

        .primary-text {
          font-size: 1.25rem;
          font-weight: 600;
          color: #e2e8f0;
          margin: 0;
        }

        .secondary-text {
          font-size: 1rem;
          color: #a0aec0;
          margin: 0;
        }

        .file-types {
          font-size: 0.875rem;
          color: #718096;
          margin: 8px 0 0;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #2d3748;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
