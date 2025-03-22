
// pages/index.js (updated)
import { useState } from 'react';
import Head from 'next/head';
import FileUploader from '../components/FileUploader';
import DocumentDisplay from '../components/DocumentDisplay';
import WorkflowDisplay from '../components/WorkflowDisplay';
import ProcessMetrics from '../components/ProcessMetrics';
import ProcessOptimizer from '../components/ProcessOptimizer';
import ProcessedFiles from '../components/ProcessedFiles';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [optimizationResults, setOptimizationResults] = useState(null);

  const handleProcessingResults = (data) => {
    setResults(data);
    setIsProcessing(false);
    setError(null);
    // Reset optimization results when a new document is processed
    setOptimizationResults(null);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setIsProcessing(false);
  };

  const handleOptimizationResults = (data) => {
    setOptimizationResults(data);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Process Analysis & Optimization</title>
        <meta name="description" content="Process documents, generate workflows, and optimize for zero bureaucracy" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Process Analysis & Optimization</h1>
        <p className="text-center text-gray-600 mb-8">Analyze and optimize your business processes for maximum efficiency</p>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload Process Documents</h2>
            <p className="text-gray-600 mb-6">
              Upload up to 5 business process documents (PDF, Word, Excel, CSV) to analyze the workflow,
              generate metrics, and receive AI-powered optimization suggestions to reduce bureaucracy
              and streamline operations.
            </p>

            <FileUploader
              onFileUpload={handleProcessingResults}
              onError={handleError}
            />
          </div>

          {isProcessing && (
            <div className="mt-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Processing documents and analyzing workflow...</p>
            </div>
          )}

          {error && !isProcessing && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-lg font-medium text-red-800">Processing Error</h3>
              <p className="mt-2 text-sm text-red-600">{error}</p>
            </div>
          )}

          {results && !isProcessing && (
            <div className="mt-8 space-y-6">
              {/* Processed Files Section (New) */}
              {results.processedFiles && (
                <ProcessedFiles processedFiles={results.processedFiles} />
              )}

              {/* Process Metrics Section */}
              {results.processMetrics && (
                <ProcessMetrics
                  metrics={results.processMetrics}
                  optimizedMetrics={optimizationResults?.metrics}
                />
              )}

              {/* Process Optimizer Section */}
              {results.processMetrics && results.workflowDiagram && (
                <ProcessOptimizer
                  originalMetrics={results.processMetrics}
                  workflowDiagram={results.workflowDiagram}
                  onOptimizationComplete={handleOptimizationResults}
                />
              )}

              {/* Tabbed Document & Workflow Section */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex border-b">
                  <button
                    className="flex-1 px-4 py-3 text-center bg-white hover:bg-gray-50 font-medium text-gray-800 border-b-2 border-blue-600"
                  >
                    {results.documentCount > 1 ? 'Integrated Process Details' : 'Process Details'}
                  </button>
                </div>

                <div className="p-6">
                  {/* Process Document Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                      {results.documentCount > 1
                        ? `Integrated Process Document (${results.documentCount} files)`
                        : 'Process Document'}
                    </h3>
                    <DocumentDisplay document={results.formattedDocument} title="Process Document" />
                  </div>

                  {/* Workflow Diagram Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                      {results.documentCount > 1
                        ? 'Integrated Process Workflow'
                        : 'Process Workflow'}
                    </h3>
                    <WorkflowDisplay workflow={results.workflowDiagram} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-12 py-6 border-t bg-white">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Process Analysis & Optimization - Zero Bureaucracy Initiative</p>
        </div>
      </footer>
    </div>
  );
}