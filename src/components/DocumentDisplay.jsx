// components/DocumentDisplay.jsx
import { useState, useEffect } from 'react';
import DocumentRenderer from './DocumentRenderer';

export default function DocumentDisplay({ document: docData, title }) {
  const [format, setFormat] = useState('html');
  const [documentContent, setDocumentContent] = useState('');
  
  useEffect(() => {
    if (docData) {
      setDocumentContent(docData.content);
    }
  }, [docData]);
  
  const handleDownload = () => {
    if (!documentContent) return;
    
    // Create a blob object with the appropriate MIME type
    let mimeType = 'text/html';
    let extension = 'html';
    
    if (format === 'markdown') {
      mimeType = 'text/markdown';
      extension = 'md';
    }
    
    const blob = new Blob([documentContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${title || 'document'}.${extension}`;
    window.document.body.appendChild(a);
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    window.document.body.removeChild(a);
  };
  
  return (
    <div className="document-display">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">{title || 'Generated Document'}</h1>
        
        <div className="flex items-center">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="mr-2 p-2 border border-gray-300 rounded"
          >
            <option value="html">HTML</option>
            <option value="markdown">Markdown</option>
          </select>
          
          <button
            onClick={handleDownload}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Download
          </button>
        </div>
      </div>
      
      <DocumentRenderer 
        documentContent={documentContent} 
        format={format} 
      />
    </div>
  );
}