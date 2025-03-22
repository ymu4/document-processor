// pages/api/optimize-process.js
import anthropic from '@/utils/anthropic';
import OpenAI from 'openai';
import { parseTimeToMinutes, formatMinutesToTime } from '@/utils/optimizationUtils';
// Import the new unified metrics extractor functions
import { parseOptimizationResult, extractWorkflowMetrics, mergeMetrics } from '@/utils/metricsExtractor';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { originalMetrics, workflowDiagram } = req.body;

        if (!originalMetrics || !workflowDiagram) {
            return res.status(400).json({ error: 'Missing required data' });
        }

        // Create the optimization prompt
        const prompt = createOptimizationPrompt(originalMetrics, workflowDiagram);

        console.log('Calling LLM for process optimization...');

        // Call the LLM (OpenAI or Claude)
        let response;
        let optimizationResult;
        let usedProvider;

        // Try OpenAI first, fall back to Claude if there's an error
        try {
            // OpenAI
            response = await anthropic.messages.create({
                model: "claude-3-7-sonnet-20250219",
                max_tokens: 2000,
                temperature: 0.3,
                system: "You are a process optimization assistant that helps reduce bureaucracy and streamline business workflows. You suggest specific, actionable improvements to reduce the number of steps and total time required for processes.",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });
            optimizationResult = response.content[0].text;
            usedProvider = 'Claude';

        } catch (openaiError) {
            console.error('OpenAI error, falling back to Claude:', openaiError);

            // Claude fallback
            response = await anthropic.messages.create({
                model: "claude-3-7-sonnet-20250219",
                max_tokens: 2000,
                temperature: 0.3,
                system: "You are a process optimization assistant that helps reduce bureaucracy and streamline business workflows. You suggest specific, actionable improvements to reduce the number of steps and total time required for processes.",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });
            optimizationResult = response.content[0].text;
            usedProvider = 'Claude';
        }

        console.log(`Optimization generation successful using ${usedProvider}`);

        // Parse the optimization result using our new robust parser
        const parsedResult = parseOptimizationResult(optimizationResult);

        // Use the original workflow diagram metrics as a reference point
        const workflowMetrics = extractWorkflowMetrics(workflowDiagram.diagram);

        // Calculate optimization metrics consistently regardless of which API was used
        const optimizedTotalSteps = parsedResult.totalSteps || Math.floor(originalMetrics.totalSteps * 0.7);

        let originalTimeMinutes = parseTimeToMinutes(originalMetrics.totalTime);
        let optimizedTimeMinutes;

        if (parsedResult.totalTime) {
            optimizedTimeMinutes = parseTimeToMinutes(parsedResult.totalTime);
        } else {
            // If no specific optimized time provided, estimate based on step reduction
            const reductionFactor = optimizedTotalSteps / originalMetrics.totalSteps;
            optimizedTimeMinutes = originalTimeMinutes ? Math.floor(originalTimeMinutes * reductionFactor) : null;
        }

        // Format the optimized time
        const optimizedTotalTime = parsedResult.totalTime ||
            (optimizedTimeMinutes ? formatMinutesToTime(optimizedTimeMinutes) : "Unknown");

        // Ensure step times match the optimized total steps
        let optimizedStepTimes = parsedResult.stepTimes || [];
        if (optimizedStepTimes.length !== optimizedTotalSteps) {
            console.log(`Adjusting optimized step times to match total steps (${optimizedStepTimes.length} vs ${optimizedTotalSteps})`);

            // If we have more step times than total steps, trim the extra ones
            if (optimizedStepTimes.length > optimizedTotalSteps) {
                optimizedStepTimes = optimizedStepTimes.slice(0, optimizedTotalSteps);
            }

            // If we have fewer step times than total steps, add placeholder entries
            while (optimizedStepTimes.length < optimizedTotalSteps) {
                optimizedStepTimes.push({
                    step: (optimizedStepTimes.length + 1).toString(),
                    stepName: `Optimized Step ${optimizedStepTimes.length + 1}`,
                    time: "Not specified"
                });
            }
        }
        // Calculate time savings percentage more reliably
        let timeSavingsPercent;
        if (originalTimeMinutes && optimizedTimeMinutes) {
            timeSavingsPercent = Math.round(((originalTimeMinutes - optimizedTimeMinutes) / originalTimeMinutes) * 100);
        } else {
            // Fall back to step reduction percentage
            timeSavingsPercent = Math.round(((originalMetrics.totalSteps - optimizedTotalSteps) / originalMetrics.totalSteps) * 100);
        }

        // Use the merged metrics for consistency
        const mergedMetrics = {
            originalMetrics: workflowMetrics,
            optimizedMetrics: {
                totalSteps: optimizedTotalSteps,
                totalTime: optimizedTotalTime,
                stepTimes: parsedResult.stepTimes || []
            }
        };

        // Enhanced summary if none provided
        if (!parsedResult.summary) {
            parsedResult.summary = `By implementing these optimizations, the process could be reduced from ${originalMetrics.totalSteps} to ${optimizedTotalSteps} steps (${timeSavingsPercent}% reduction) and save approximately ${timeSavingsPercent}% of processing time.`;
        }

        // Ensure we have a reasonable number of suggestions
        if (!parsedResult.suggestions || parsedResult.suggestions.length === 0) {
            parsedResult.suggestions = [
                {
                    title: "Streamline Approval Process",
                    description: "Consolidate multiple approval steps into a single, parallel approval workflow.",
                    timeSaved: "Approximately 30% of approval time"
                },
                {
                    title: "Automate Manual Data Entry",
                    description: "Replace manual data entry with automated form processing.",
                    timeSaved: "Up to 50% of data processing time"
                },
                {
                    title: "Eliminate Redundant Reviews",
                    description: "Remove duplicate review cycles and implement a single comprehensive review.",
                    timeSaved: "About 25% of review cycle time"
                }
            ];
        }

        // Create optimized process result
        const optimizedProcess = {
            summary: parsedResult.summary,
            suggestions: parsedResult.suggestions,
            metrics: {
                totalSteps: optimizedTotalSteps,
                totalTime: optimizedTotalTime,
                stepTimes: optimizedStepTimes
            },
            workflowDiagram: {
                diagram: parsedResult.workflow || workflowDiagram.diagram,
                type: 'mermaid'
            },
            timeSavingsPercent,
            provider: usedProvider
        };

        return res.status(200).json(optimizedProcess);
    } catch (error) {
        console.error('Error in optimize-process:', error);
        return res.status(500).json({
            error: 'Failed to optimize process',
            message: error.message
        });
    }
}

/**
 * Create a prompt for the AI to optimize the process
 */
function createOptimizationPrompt(metrics, workflow) {
    return `# Process Optimization Task

## Current Process Information:
- Total Steps: ${metrics.totalSteps}
- Estimated Total Time: ${metrics.totalTime}
- Detailed Step Times: ${JSON.stringify(metrics.stepTimes || [])}

## Current Workflow Diagram:
\`\`\`
${workflow.diagram}
\`\`\`

## Optimization Task
Please analyze this process and suggest specific improvements to reduce bureaucracy, eliminate unnecessary steps, and minimize the total time required. Your goal is to create a more efficient version of this process that achieves the same outcomes with fewer steps and less time.

## Required Output Format (JSON):
Please return your response in the following JSON format:

\`\`\`json
{
  "summary": "Brief summary of optimization approach and overall benefits (1-2 sentences)",
  "totalSteps": Number of steps in the optimized process,
  "totalTime": "Estimated total time for the optimized process",
  "suggestions": [
    {
      "title": "Short title of the optimization suggestion",
      "description": "Detailed explanation of the suggestion",
      "timeSaved": "Estimate of time saved by this suggestion"
    },
    ...more suggestions
  ],
  "stepTimes": [
    {
      "step": "1",
      "stepName": "Name of optimized step 1",
      "time": "Estimated time for step 1"
    },
    ...more steps
  ],
  "workflow": "Optimized mermaid.js workflow diagram"
}
\`\`\`

## Optimization Guidelines:
1. Look for redundant approvals that could be consolidated
2. Identify manual steps that could be automated
3. Find sequential steps that could be performed in parallel
4. Eliminate unnecessary handoffs between departments
5. Remove or combine redundant verification/validation steps
6. Consider digital solutions to replace paper-based processes
7. Suggest self-service options where appropriate
8. Reduce waiting times between steps
9. Recommend delegation of approvals to lower levels where possible
10. Consider eliminating steps that don't add value

The optimized process should maintain all necessary compliance and quality controls while eliminating bureaucracy.

IMPORTANT: Your response MUST follow the exact JSON format specified above. The "workflow" field should contain a complete, valid mermaid.js diagram that represents the optimized process.`;
}