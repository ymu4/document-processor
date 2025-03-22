
// components/OptimizedWorkflowDisplay.jsx
import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

export default function OptimizedWorkflowDisplay({ originalWorkflow, optimizedWorkflow }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('optimized'); // 'optimized', 'original', or 'comparison'
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initialize Mermaid with specific configuration
    mermaid.initialize({ 
      startOnLoad: true, 
      theme: 'default',
      logLevel: 'error',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });
    
    renderSelectedView();
  }, [optimizedWorkflow, viewMode]);
  
  // Render the currently selected view
  const renderSelectedView = () => {
    if (!containerRef.current) return;
    
    try {
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Create a div for the diagram
      const diagramDiv = document.createElement('div');
      diagramDiv.className = 'mermaid';
      
      let diagramToRender = '';
      
      if (viewMode === 'optimized' && optimizedWorkflow) {
        diagramToRender = sanitizeMermaidCode(optimizedWorkflow.diagram);
      } else if (viewMode === 'original' && originalWorkflow) {
        diagramToRender = sanitizeMermaidCode(originalWorkflow.diagram);
      } else if (viewMode === 'comparison' && originalWorkflow && optimizedWorkflow) {
        // Create a side-by-side comparison (this is simplified)
        diagramToRender = `
graph TD
    subgraph "Original Process"
    ${sanitizeMermaidCode(originalWorkflow.diagram).replace(/^graph TD\s*/i, '')}
    end
    
    subgraph "Optimized Process"
    ${sanitizeMermaidCode(optimizedWorkflow.diagram).replace(/^graph TD\s*/i, '')}
    end
        `;
      }
      
      diagramDiv.textContent = diagramToRender;
      containerRef.current.appendChild(diagramDiv);
      
      // Render the diagram
      mermaid.init(undefined, '.mermaid')
        .catch(err => {
          console.error('Mermaid render error:', err);
          setError(`Error rendering diagram: ${err.message}`);
        });
    } catch (err) {
      console.error('Error setting up Mermaid diagram:', err);
      setError(`Error setting up diagram: ${err.message}`);
    }
  };
  
  // Helper function to sanitize Mermaid code
  function sanitizeMermaidCode(code) {
    if (!code) return 'graph TD\nA[No diagram available]';
    
    // Ensure the code starts with graph TD
    let sanitized = code.trim();
    
    // Make sure graph TD is on its own line at the beginning
    if (!sanitized.match(/^graph\s+(TD|LR|RL|BT)/i)) {
      sanitized = 'graph TD\n' + sanitized;
    }
    
    // Fix critical syntax issues
    sanitized = sanitized
      // Fix the arrow syntax (ensure exactly two dashes)
      .replace(/-+>/g, '-->')
      // Remove <br> tags that can cause problems
      .replace(/<br\s*\/?>/gi, ' ')
      // Fix quotes consistency
      .replace(/'/g, '"');
    
    return sanitized;
  }
  
  if (!optimizedWorkflow && !originalWorkflow) {
    return <div className="p-4 text-gray-500">No workflow data available</div>;
  }
  
  return (
    <div className="optimized-workflow mt-4">
      <div className="mb-4 flex space-x-2">
        <button
          onClick={() => setViewMode('optimized')}
          className={`px-3 py-1 rounded text-sm ${
            viewMode === 'optimized' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Optimized Workflow
        </button>
        
        <button
          onClick={() => setViewMode('original')}
          className={`px-3 py-1 rounded text-sm ${
            viewMode === 'original' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Original Workflow
        </button>
        
        {/* <button
          onClick={() => setViewMode('comparison')}
          className={`px-3 py-1 rounded text-sm ${
            viewMode === 'comparison' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Side-by-Side Comparison
        </button> */}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div ref={containerRef} className="overflow-auto border rounded-md p-4 bg-white"></div>
      
      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => {
            // Export as SVG
            const svg = containerRef.current.querySelector('svg');
            if (svg) {
              const svgData = new XMLSerializer().serializeToString(svg);
              const blob = new Blob([svgData], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              
              const a = document.createElement('a');
              a.href = url;
              a.download = `${viewMode}-workflow-diagram.svg`;
              document.body.appendChild(a);
              a.click();
              
              URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }
          }}
          className="text-sm bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700"
        >
          Download as SVG
        </button>
      </div>
    </div>
  );
}