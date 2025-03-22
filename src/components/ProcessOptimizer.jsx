// components/ProcessOptimizer.jsx
import { useState, useEffect } from 'react';
import { calculateTimeSavings } from '../utils/optimizationUtils';
import OptimizedWorkflowDisplay from './OptimizedWorkflowDisplay';

export default function ProcessOptimizer({ originalMetrics, workflowDiagram }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [optimizedProcess, setOptimizedProcess] = useState(null);
  const [error, setError] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  const generateOptimization = async () => {
    if (!originalMetrics || !workflowDiagram) {
      setError("Cannot optimize: Missing original process data");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/optimize-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalMetrics,
          workflowDiagram
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error optimizing process');
      }

      const data = await response.json();
      setOptimizedProcess(data);
      setShowComparison(true);
    } catch (err) {
      console.error('Error generating optimization:', err);
      setError(err.message || 'Failed to optimize process');
    } finally {
      setIsGenerating(false);
    }
  };

  // Format time for display (e.g. "2 hours 30 minutes")
  const formatTime = (timeString) => {
    if (!timeString || timeString === "Unknown") return "Unknown";
    return timeString;
  };

  // Calculate percentage reduction
  const calculatePercentage = (original, optimized) => {
    if (!original || !optimized || original === 0) return "N/A";
    const reduction = ((original - optimized) / original) * 100;
    return reduction.toFixed(1) + "%";
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Process Optimization</h3>
      
      {!optimizedProcess && (
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Our AI can analyze your process workflow and suggest optimizations to reduce bureaucracy,
            eliminate unnecessary steps, and minimize process time.
          </p>
          
          <button
            onClick={generateOptimization}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-md ${
              isGenerating 
                ? "bg-gray-300 cursor-not-allowed" 
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Process...
              </span>
            ) : (
              "Generate Optimization Suggestions"
            )}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      )}
      
      {optimizedProcess && (
        <div>
          <div className="bg-green-50 p-4 rounded-md mb-6">
            <h4 className="text-md font-medium text-green-800 mb-2">Optimization Summary</h4>
            <p className="text-sm text-green-700 mb-3">
              {optimizedProcess.summary}
            </p>
            
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="text-green-700 hover:text-green-900 text-sm flex items-center"
            >
              <span>{showComparison ? "Hide" : "Show"} detailed comparison</span>
              <svg 
                className={`ml-1 h-4 w-4 transition-transform ${showComparison ? "transform rotate-180" : ""}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {showComparison && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Steps Reduced</h5>
                  <div className="flex items-end">
                    <span className="text-2xl font-bold text-green-600 mr-2">
                      {originalMetrics.totalSteps - optimizedProcess.metrics.totalSteps}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({calculatePercentage(originalMetrics.totalSteps, optimizedProcess.metrics.totalSteps)} reduction)
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Original Process</h5>
                  <div className="text-xl font-bold text-gray-800">
                    {originalMetrics.totalSteps} steps
                  </div>
                  <div className="text-sm text-gray-600">
                    Est. time: {formatTime(originalMetrics.totalTime)}
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-md">
                  <h5 className="text-sm font-medium text-green-700 mb-1">Optimized Process</h5>
                  <div className="text-xl font-bold text-green-800">
                    {optimizedProcess.metrics.totalSteps} steps
                  </div>
                  <div className="text-sm text-green-700">
                    Est. time: {formatTime(optimizedProcess.metrics.totalTime)}
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-md">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h4 className="text-md font-medium text-gray-800">Key Optimizations</h4>
                </div>
                
                <ul className="divide-y divide-gray-200">
                  {optimizedProcess.suggestions.map((suggestion, index) => (
                    <li key={index} className="px-4 py-3">
                      <div className="flex">
                        <div className="flex-shrink-0 mr-3 mt-1">
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-800 mb-1">{suggestion.title}</h5>
                          <p className="text-sm text-gray-600">{suggestion.description}</p>
                          {suggestion.timeSaved && (
                            <p className="text-xs text-green-600 mt-1">
                              Potential time saved: {suggestion.timeSaved}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">Process Workflow Comparison</h4>
            {optimizedProcess.workflowDiagram && (
              <OptimizedWorkflowDisplay 
                originalWorkflow={workflowDiagram} 
                optimizedWorkflow={optimizedProcess.workflowDiagram} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}