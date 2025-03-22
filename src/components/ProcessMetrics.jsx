
// components/ProcessMetrics.jsx
import { useState } from 'react';

export default function ProcessMetrics({ metrics, optimizedMetrics }) {
  const [showDetailedTimes, setShowDetailedTimes] = useState(false);
  
  if (!metrics) return null;
  
  const { totalSteps, totalTime, stepTimes } = metrics;
  const hasStepTimes = Array.isArray(stepTimes) && stepTimes.length > 0;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Process Metrics Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="text-sm text-blue-700 mb-1">Total Steps</div>
          <div className="text-3xl font-bold text-blue-900">
            {totalSteps || 'Unknown'}
            {optimizedMetrics && (
              <span className="text-sm font-normal ml-2 text-green-600">
                → {optimizedMetrics.totalSteps || 'Unknown'} 
                {optimizedMetrics.totalSteps && totalSteps ? 
                  ` (${Math.round(((totalSteps - optimizedMetrics.totalSteps) / totalSteps) * 100)}% less)` : ''}
              </span>
            )}
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-md">
          <div className="text-sm text-green-700 mb-1">Estimated Total Time</div>
          <div className="text-3xl font-bold text-green-900">
            {totalTime || 'Unknown'}
            {optimizedMetrics && (
              <span className="text-sm font-normal ml-2 text-green-600">
                → {optimizedMetrics.totalTime || 'Unknown'}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {hasStepTimes && (
        <div>
          <div className="flex items-center mb-2">
            <button 
              onClick={() => setShowDetailedTimes(!showDetailedTimes)}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center focus:outline-none"
            >
              <span className="mr-1">{showDetailedTimes ? 'Hide' : 'Show'} step details</span>
              <svg className={`w-4 h-4 transform ${showDetailedTimes ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {showDetailedTimes && (
            <div className="border rounded-md overflow-hidden mt-2">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Step
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estimated Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stepTimes.map((item, index) => {
                    // Handle both formats: {step, stepName, time} objects or string time estimates
                    const stepNumber = item.step || `${index + 1}`;
                    const stepName = item.stepName || item.name || item.description || '';
                    const timeEstimate = item.time || item.duration || item.estimate || item;
                    
                    // Get corresponding optimized step if available
                    const optimizedStep = optimizedMetrics?.stepTimes?.find(s => s.step === stepNumber);
                    
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Step {stepNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {stepName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {typeof timeEstimate === 'string' ? timeEstimate : 'Unknown'}
                          {optimizedStep && (
                            <span className="text-green-600 ml-2">
                              → {optimizedStep.time || 'Unknown'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Add source information when debugging is needed */}
      {process.env.NODE_ENV === 'development' && metrics.source && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <p>Metrics source: {metrics.source}</p>
        </div>
      )}
    </div>
  );
}