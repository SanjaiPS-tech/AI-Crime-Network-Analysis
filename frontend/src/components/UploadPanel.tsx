import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import './UploadPanel.css';

interface UploadPanelProps {
  onUpload: (file: File) => void;
}

const UploadPanel: React.FC<UploadPanelProps> = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleFile = async (file: File) => {
    const allowedExtensions = ['.txt', '.pdf', '.json', '.csv'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      showMessage(`File type ${ext} not allowed. Allowed: ${allowedExtensions.join(', ')}`, 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showMessage('File too large. Maximum size is 10MB.', 'error');
      return;
    }

    setUploading(true);
    setMessage(null);
    
    try {
      await onUpload(file);
      showMessage('Upload successful!', 'success');
    } catch (err) {
      showMessage('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 3000);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-panel">
      <div 
        className={`drop-zone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.json,.csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        
        <div className="drop-content">
          {!uploading ? (
            <>
              <Upload size={32} className="upload-icon" />
              <p className="drop-text">
                {dragActive ? 'Drop file here' : 'Click or drag to upload'}
              </p>
              <p className="drop-hint">FIR, reports, .txt, .pdf, .json, .csv (max 10MB)</p>
            </>
          ) : (
            <>
              <Loader2 size={32} className="spinner" />
              <p className="drop-text">Processing...</p>
            </>
          )}
        </div>
      </div>

      {message && (
        <div className={`upload-message ${messageType}`}>
          {messageType === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};

export default UploadPanel;