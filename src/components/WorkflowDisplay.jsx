import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
// import FallbackWorkflow from './FallbackWorkflow';

export default function WorkflowDisplay({ workflow }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [diagramCode, setDiagramCode] = useState('');
  const [sanitizedCode, setSanitizedCode] = useState('');
  const [showRawCode, setShowRawCode] = useState(false);

  useEffect(() => {
    if (workflow && containerRef.current) {
      // Initialize Mermaid with more specific configuration
      mermaid.initialize({ 
        startOnLoad: true, 
        theme: 'default',
        logLevel: 'error',
        securityLevel: 'loose', // Helps with some rendering issues
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        }
      });
      
      // Store the original diagram code
      setDiagramCode(workflow.diagram);
      
      try {
        // Clear previous content
        containerRef.current.innerHTML = '';
        
        // Create a div for the diagram
        const diagramDiv = document.createElement('div');
        diagramDiv.className = 'mermaid';
        
        // Apply the diagram sanitization
        let cleanedDiagram = sanitizeMermaidCode(workflow.diagram);
        setSanitizedCode(cleanedDiagram);
        
        diagramDiv.textContent = cleanedDiagram;
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
    }
  }, [workflow]);

  // Simplified sanitization function focusing on critical issues
  function sanitizeMermaidCode(code) {
    if (!code) return '';

    // Ensure the code starts with graph TD
    let sanitized = code.trim();
    
    // Make sure graph TD is on its own line at the beginning
    if (!sanitized.match(/^graph\s+(TD|LR|RL|BT)/i)) {
      sanitized = 'graph TD\n' + sanitized;
    } else {
      // Make sure graph declaration is properly formatted
      sanitized = sanitized.replace(/^graph\s+(TD|LR|RL|BT)/i, 'graph TD');
    }

    // Fix critical syntax issues
    sanitized = sanitized
      // Fix the arrow syntax (ensure exactly two dashes)
      .replace(/-+>/g, '-->') // First normalize all arrow variations to -->
      // Remove <br> tags that can cause problems
      .replace(/<br\s*\/?>/gi, ' ')
      // Fix quotes consistency - use double quotes for everything
      .replace(/'/g, '"');
    
    // Fix subgraph syntax directly (don't use regex replacement)
    sanitized = sanitized
      .replace(/subgraph_node/g, 'subgraph')
      .replace(/end_node/g, 'end');

    // Check for reserved words only if they're standalone node IDs
    const reservedWordsList = ['style', 'linkStyle', 'classDef', 'class', 'click'];
    reservedWordsList.forEach(word => {
      // Only replace when it's a standalone node ID
      const nodePattern = new RegExp(`\\b(${word})\\b(?!\\s*[\\[\\{\\(])`, 'g');
      sanitized = sanitized.replace(nodePattern, `${word}_node`);
    });

    return sanitized;
  }

  if (!workflow) {
    return null;
  }

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Generated Workflow</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs mt-2 text-gray-700">Raw diagram code available below for debugging</p>
          {/* <FallbackWorkflow diagramCode={diagramCode} /> */}
          <button 
            onClick={() => setShowRawCode(!showRawCode)}
            className="text-xs mt-2 text-blue-600 hover:underline"
          >
            {showRawCode ? 'Hide Code' : 'Show Raw Code'}
          </button>
        </div>
      )}
      
      {showRawCode && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="text-sm font-semibold mb-2 text-gray-800">Original Code:</h3>
          <pre className="text-xs overflow-auto p-2 bg-gray-100 max-h-60 text-gray-800">
            {diagramCode}
          </pre>
          <h3 className="text-sm font-semibold mb-2 mt-4 text-gray-800">Sanitized Code:</h3>
          <pre className="text-xs overflow-auto p-2 bg-gray-100 max-h-60 text-gray-800">
            {sanitizedCode}
          </pre>
        </div>
      )}
      
      <div ref={containerRef} className="overflow-auto"></div>
      
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
              a.download = 'workflow-diagram.svg';
              document.body.appendChild(a);
              a.click();
              
              URL.revokeObjectURL(url);
              document.body.removeChild(a);
            } else {
              alert('SVG not available. Try downloading the raw diagram code instead.');
            }
          }}
          className="text-sm bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700"
        >
          Download as SVG
        </button>
        
        <button
          onClick={() => {
            // Download raw Mermaid code
            const blob = new Blob([diagramCode], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'workflow-diagram.mmd';
            document.body.appendChild(a);
            a.click();
            
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }}
          className="text-sm bg-gray-600 text-white py-1 px-3 rounded hover:bg-gray-700"
        >
          Download Raw Diagram Code
        </button>
        
        <button
          onClick={() => {
            // Download sanitized Mermaid code
            const blob = new Blob([sanitizedCode], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'workflow-diagram-sanitized.mmd';
            document.body.appendChild(a);
            a.click();
            
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }}
          className="text-sm bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700"
        >
          Download Sanitized Code
        </button>
      </div>
    </div>
  );
}