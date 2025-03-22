// utils/metricsExtractor.js
/**
 * A unified approach to extracting process metrics from various sources
 * Works with both Claude and OpenAI responses
 */

/**
 * Extract workflow metrics from a mermaid diagram code
 * This will be our primary source of metrics
 */
export function extractWorkflowMetrics(diagramCode) {
    try {
        if (!diagramCode) return defaultMetrics();

        // Count steps by looking for process boxes (more comprehensive pattern)
        const stepMatches = diagramCode.match(/\[\s*(?:Step\s+\d+|Process\s+\d+|Activity\s+\d+)|"(?:Step|Process|Activity)\s+\d+/gi) || [];
        let totalSteps = stepMatches.length;

        // If no explicit step labels found, count all process boxes as steps
        if (totalSteps === 0) {
            const processBoxes = diagramCode.match(/\[[^\]]+\]/g) || [];
            // Filter out start/end nodes
            const filteredBoxes = processBoxes.filter(box =>
                !box.toLowerCase().includes('start') &&
                !box.toLowerCase().includes('end') &&
                !box.toLowerCase().includes('begin')
            );
            totalSteps = filteredBoxes.length;
        }

        // Look for time estimates in the diagram with improved pattern
        const timeMatches = diagramCode.match(/(\d+)\s*(min|minute|minutes?|hour|hours?|day|days?|hr|hrs|h|d)/gi) || [];
        const timeEstimates = timeMatches.map(time => time.trim());

        // Calculate total time with improved handling of various formats
        let totalTimeMinutes = 0;
        let hasValidTotalTime = false;

        timeEstimates.forEach(time => {
            const valueMatch = time.match(/(\d+)/);
            if (!valueMatch) return;

            const value = parseInt(valueMatch[1]);

            if (time.match(/hour|hr|h/i)) {
                totalTimeMinutes += value * 60;
                hasValidTotalTime = true;
            } else if (time.match(/min|minute/i)) {
                totalTimeMinutes += value;
                hasValidTotalTime = true;
            } else if (time.match(/day|d/i)) {
                totalTimeMinutes += value * 60 * 8; // assuming 8-hour workday
                hasValidTotalTime = true;
            }
        });

        // Format the total time
        let totalTimeFormatted = "Unknown";
        if (hasValidTotalTime) {
            if (totalTimeMinutes >= 60) {
                const hours = Math.floor(totalTimeMinutes / 60);
                const minutes = totalTimeMinutes % 60;
                totalTimeFormatted = `${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`;
            } else {
                totalTimeFormatted = `${totalTimeMinutes} minute${totalTimeMinutes !== 1 ? 's' : ''}`;
            }
        }

        // Extract step time information
        const stepTimes = extractStepTimesFromDiagram(diagramCode);

        return {
            totalSteps,
            totalTime: hasValidTotalTime ? totalTimeFormatted : "Unknown",
            timeEstimates,
            stepTimes
        };
    } catch (error) {
        console.error('Error extracting workflow metrics:', error);
        return defaultMetrics();
    }
}

/**
 * Extract step times from a mermaid diagram
 */
function extractStepTimesFromDiagram(diagramCode) {
    const stepTimes = [];

    // Pattern to match step definitions with time estimates
    // More comprehensive to catch various formats
    const stepPattern = /\[\s*(?:Step|Process|Activity)\s+(\d+)[^\]]*?(\d+\s*(?:min|minute|hour|hr|day|d))[^\]]*?\]/gi;
    let match;

    while ((match = stepPattern.exec(diagramCode)) !== null) {
        stepTimes.push({
            step: match[1],
            stepName: `Step ${match[1]}`,
            time: match[2].trim()
        });
    }

    // If we found no steps with the above pattern, try a more general approach
    if (stepTimes.length === 0) {
        // Extract all process boxes with their full text
        const boxPattern = /\[\s*"?([^"\]]+)"?\s*\]/g;
        let boxMatch;
        let stepNumber = 1;

        while ((boxMatch = boxPattern.exec(diagramCode)) !== null) {
            const boxContent = boxMatch[1].trim();

            // Skip start/end nodes
            if (boxContent.toLowerCase().includes('start') ||
                boxContent.toLowerCase().includes('end') ||
                boxContent.toLowerCase().includes('begin')) {
                continue;
            }

            // Extract time estimates if present
            const timeMatch = boxContent.match(/\(?\s*(\d+\s*(?:min|minute|hour|hr|day|d)[^\)]*)\)?/i);

            stepTimes.push({
                step: stepNumber.toString(),
                stepName: boxContent.replace(/\(?\s*\d+\s*(?:min|minute|hour|hr|day|d)[^\)]*\)?/i, '').trim(),
                time: timeMatch ? timeMatch[1].trim() : "Unknown"
            });

            stepNumber++;
        }
    }

    return stepTimes;
}

/**
 * Parse optimization result from any LLM (Claude or OpenAI)
 * with improved robustness
 */
export function parseOptimizationResult(result) {
    try {
        // First attempt: try to find and parse JSON from the result
        const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);

        if (jsonMatch && jsonMatch[1]) {
            // Clean up the JSON before parsing (remove any trailing commas)
            const cleanedJson = jsonMatch[1].trim()
                .replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas

            try {
                return JSON.parse(cleanedJson);
            } catch (jsonError) {
                console.error('Failed to parse extracted JSON block:', jsonError);
                // Continue to the next approach
            }
        }

        // Second attempt: try parsing the whole response as JSON
        try {
            return JSON.parse(result.trim());
        } catch (wholeJsonError) {
            console.error('Failed to parse whole response as JSON:', wholeJsonError);

            // Third attempt: use regex extraction for key fields
            const parsed = {};

            // Extract summary with improved pattern
            const summaryMatch = result.match(/["']?summary["']?\s*:\s*["']([^"']+)["']/i) ||
                result.match(/summary[^:]*:\s*([^\n]+)/i);
            if (summaryMatch) parsed.summary = summaryMatch[1].trim();

            // Extract total steps with improved pattern
            const stepsMatch = result.match(/["']?total\s*steps?["']?\s*:\s*(\d+)/i) ||
                result.match(/total\s*steps?[^:]*:\s*(\d+)/i);
            if (stepsMatch) parsed.totalSteps = parseInt(stepsMatch[1]);

            // Extract total time with improved pattern
            const timeMatch = result.match(/["']?total\s*time["']?\s*:\s*["']([^"']+)["']/i) ||
                result.match(/total\s*time[^:]*:\s*([^\n]+)/i);
            if (timeMatch) parsed.totalTime = timeMatch[1].trim();

            // Extract suggestions with a simple pattern
            const suggestionsMatch = result.match(/["']?suggestions["']?\s*:\s*(\[[\s\S]*?\])/i);
            if (suggestionsMatch) {
                try {
                    // Clean up the JSON before parsing
                    const cleanedSuggestions = suggestionsMatch[1]
                        .replace(/,\s*]/g, ']') // Remove trailing commas
                        .replace(/([{,]\s*)["']?(\w+)["']?\s*:/g, '$1"$2":') // Ensure property names are quoted
                        .replace(/:\s*["'](.*?)["']/g, ':"$1"'); // Standardize string quotes

                    parsed.suggestions = JSON.parse(cleanedSuggestions);
                } catch (suggestionsError) {
                    console.error('Failed to parse suggestions:', suggestionsError);
                    // Create a simple fallback suggestion
                    parsed.suggestions = [
                        {
                            title: "Process Optimization",
                            description: "Review and optimize the workflow to reduce unnecessary steps.",
                            timeSaved: "Varies based on implementation"
                        }
                    ];
                }
            }

            // Extract workflow diagram if present
            const workflowMatch = result.match(/["']?workflow["']?\s*:\s*["']([^"']+)["']/i) ||
                result.match(/graph TD[\s\S]+?(?=```|$)/);
            if (workflowMatch) parsed.workflow = workflowMatch[1] || workflowMatch[0].trim();

            return parsed;
        }
    } catch (error) {
        console.error('Error parsing optimization result:', error);
        return defaultOptimizationResult();
    }
}

/**
 * Create default metrics object
 */
function defaultMetrics() {
    return {
        totalSteps: 0,
        totalTime: "Unknown",
        timeEstimates: [],
        stepTimes: []
    };
}

/**
 * Create default optimization result object
 */
function defaultOptimizationResult() {
    return {
        summary: "Optimization completed successfully, but result parsing failed.",
        totalSteps: null,
        totalTime: null,
        suggestions: [
            {
                title: "Streamline Approval Process",
                description: "Consolidate multiple approval steps into a single, parallel approval workflow.",
                timeSaved: "Approximately 30% of approval time"
            },
            {
                title: "Automate Manual Steps",
                description: "Replace manual processes with automation where possible.",
                timeSaved: "Up to 40% of manual processing time"
            }
        ],
        stepTimes: []
    };
}

/**
 * Merge metrics from different sources, prioritizing the most reliable data
 * This ensures consistency regardless of which API was used
 */
export function mergeMetrics(workflowMetrics, documentMetrics, optimizationMetrics) {
    // Start with workflow metrics as the base
    const metrics = { ...workflowMetrics };

    // If workflow metrics are missing, use document metrics
    if (!metrics.totalSteps || metrics.totalSteps === 0) {
        metrics.totalSteps = documentMetrics?.totalSteps || 0;
    }

    if (metrics.totalTime === "Unknown") {
        metrics.totalTime = documentMetrics?.totalTime || "Unknown";
    }

    // Use document's step times if available and workflow didn't provide them
    if ((!metrics.stepTimes || metrics.stepTimes.length === 0) &&
        documentMetrics?.stepTimes && documentMetrics.stepTimes.length > 0) {
        metrics.stepTimes = documentMetrics.stepTimes;
    }

    // If optimization metrics are available, use them for optimized process
    if (optimizationMetrics) {
        metrics.optimized = {
            totalSteps: optimizationMetrics.totalSteps || Math.floor(metrics.totalSteps * 0.7), // Fallback to 30% reduction
            totalTime: optimizationMetrics.totalTime || "Unknown",
            suggestions: optimizationMetrics.suggestions || [],
            timeSavingsPercent: calculateTimeSavingsPercent(metrics.totalTime, optimizationMetrics.totalTime) || 30 // Default to 30%
        };
    }

    return metrics;
}

/**
 * Calculate time savings percentage between original and optimized time
 */
function calculateTimeSavingsPercent(originalTime, optimizedTime) {
    // Convert time strings to minutes
    const originalMinutes = parseTimeToMinutes(originalTime);
    const optimizedMinutes = parseTimeToMinutes(optimizedTime);

    if (originalMinutes && optimizedMinutes && originalMinutes > 0) {
        return Math.round(((originalMinutes - optimizedMinutes) / originalMinutes) * 100);
    }

    return null;
}

/**
 * Parse time string to minutes (copied from your utils)
 */
function parseTimeToMinutes(timeString) {
    if (!timeString || typeof timeString !== 'string') return null;

    let totalMinutes = 0;

    // Extract hours
    const hoursMatch = timeString.match(/(\d+)\s*(?:hour|hr|h)s?/i);
    if (hoursMatch) {
        totalMinutes += parseInt(hoursMatch[1]) * 60;
    }

    // Extract minutes
    const minutesMatch = timeString.match(/(\d+)\s*(?:minute|min|m)s?/i);
    if (minutesMatch) {
        totalMinutes += parseInt(minutesMatch[1]);
    }

    // Extract days (assume 8-hour workday)
    const daysMatch = timeString.match(/(\d+)\s*(?:day|d)s?/i);
    if (daysMatch) {
        totalMinutes += parseInt(daysMatch[1]) * 8 * 60;
    }

    return totalMinutes > 0 ? totalMinutes : null;
}

/**
 * Format time in a consistent way
 */
function formatTimeConsistently(minutes) {
    if (!minutes) return "Unknown";

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours >= 40) { // More than a work week
        const weeks = Math.floor(hours / 40); // Assuming 40-hour work week
        const remainingHours = hours % 40;

        let result = `${weeks} week${weeks !== 1 ? 's' : ''}`;
        if (remainingHours > 0) {
            result += ` and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
        }
        return result;
    } else if (hours > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}${remainingMinutes > 0 ? ` and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}` : ''}`;
    } else {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
}