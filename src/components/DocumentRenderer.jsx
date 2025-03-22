// components/DocumentRenderer.jsx
import { useEffect, useRef } from 'react';
import { marked } from 'marked';

export default function DocumentRenderer({ documentContent, format }) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (containerRef.current && documentContent) {
      if (format === 'html') {
        // Set HTML content directly
        containerRef.current.innerHTML = documentContent;
      } else if (format === 'markdown') {
        // Convert markdown to HTML
        try {
          containerRef.current.innerHTML = marked.parse(documentContent);
        } catch (error) {
          console.error('Error parsing markdown:', error);
          containerRef.current.innerHTML = `<p class="text-red-500">Error rendering markdown</p><pre>${documentContent}</pre>`;
        }
      } else {
        // Default: display as plain text
        containerRef.current.innerText = documentContent;
      }
    }
  }, [documentContent, format]);
  
  return (
    <div className="document-renderer">
      <div 
        ref={containerRef} 
        className="border rounded-md p-4 bg-white overflow-auto text-gray-800"
      />
    </div>
  );
}