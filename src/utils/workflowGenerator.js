// utils/workflowGenerator.js
import OpenAI from 'openai';
import anthropic from './anthropic';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a workflow diagram based on extracted data
 */
export async function generateWorkflow(extractedData) {
    try {
        console.log('Creating prompt for workflow generation...');
        const prompt = createPromptForWorkflowGeneration(extractedData);

        console.log('Calling OpenAI API for workflow generation...');
        // Make the API call to OpenAI using the correct SDK format
        // const response = await openai.chat.completions.create({
        //     model: "gpt-4o-2024-11-20",
        //     messages: [
        //         {
        //             role: "system",
        //             content: "You are a workflow diagram assistant that creates clear Mermaid.js flowcharts based on process descriptions. Your diagrams are professional and follow standard flowchart conventions. Include time estimates for each step when the information is available or can be reasonably inferred."
        //         },
        //         {
        //             role: "user",
        //             content: prompt
        //         }
        //     ],
        //     max_tokens: 100,
        //     temperature: 0.3,
        // });
        // //gpt
        // const generatedContent = response.choices[0].message.content.trim();


        const response = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 3000,
            temperature: 0.3,
            system: "You are a workflow diagram assistant that creates clear Mermaid.js flowcharts based on process descriptions. Your diagrams are professional and follow standard flowchart conventions.",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });
        const generatedContent = response.content[0].text;


        console.log('Workflow generation successful, content length:', generatedContent.length);

        // Extract just the Mermaid code from the response (in case it includes extra text)
        let diagramCode = generatedContent;

        // Try to extract just the code block if it's wrapped in markdown backticks
        const mermaidMatch = generatedContent.match(/```mermaid\s*([\s\S]*?)\s*```/);
        if (mermaidMatch && mermaidMatch[1]) {
            diagramCode = mermaidMatch[1].trim();
            console.log('Extracted Mermaid code from markdown block');
        }

        // Extract process metrics from the diagram code
        const metrics = extractWorkflowMetrics(diagramCode);

        return {
            diagram: diagramCode,
            type: 'mermaid',
            metrics: metrics
        };
    } catch (error) {
        console.error('Error in generateWorkflow:', error);
        if (error.response) {
            console.error('OpenAI API Error Status:', error.status);
            console.error('OpenAI API Error Data:', error.data);
        }
        throw error;
    }
}

/**
 * Extract workflow metrics (step count, time estimates) from the diagram code
 */
function extractWorkflowMetrics(diagramCode) {
    try {
        // Count steps by looking for process boxes
        const stepMatches = diagramCode.match(/\[\s*Step\s+\d+|"Step\s+\d+|Step\s+\d+/gi) || [];
        const totalSteps = stepMatches.length;

        // Look for time estimates in the diagram
        const timeMatches = diagramCode.match(/(\d+)\s*(min|minute|minutes?|hour|hours?|day|days?|hr|hrs)/gi) || [];
        const timeEstimates = timeMatches.map(time => time.trim());

        // Try to calculate total time if possible (simplistic approach)
        let totalTimeMinutes = 0;
        let hasValidTotalTime = false;

        timeEstimates.forEach(time => {
            const valueMatch = time.match(/(\d+)/);
            if (!valueMatch) return;

            const value = parseInt(valueMatch[1]);

            if (time.includes('hour') || time.includes('hr')) {
                totalTimeMinutes += value * 60;
                hasValidTotalTime = true;
            } else if (time.includes('min')) {
                totalTimeMinutes += value;
                hasValidTotalTime = true;
            } else if (time.includes('day')) {
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

        return {
            totalSteps,
            timeEstimates,
            totalTime: hasValidTotalTime ? totalTimeFormatted : "Unknown"
        };
    } catch (error) {
        console.error('Error extracting workflow metrics:', error);
        return {
            totalSteps: 0,
            timeEstimates: [],
            totalTime: "Unknown"
        };
    }
}

function createPromptForWorkflowGeneration(extractedData) {
    let prompt = "Based on the following data, generate a detailed workflow diagram using Mermaid.js syntax for the process described:\n\n";

    // Add general instructions for workflow generation
    prompt += "## Instructions\n";
    prompt += "Analyze the input data to identify the specific process being described, even if the input data is already a workflow or process document. Then create a detailed and more organized workflow diagram that clearly represents this process. ";
    prompt += "The diagram should visually represent the step-by-step workflow, ";
    prompt += "including all approval stages, decision points, participant roles, and TIME ESTIMATES for each step.\n\n";
    prompt += "IMPORTANT: Even if the input is already a workflow diagram or structured document, your task is to create a NEW, CLEARER, and MORE ORGANIZED diagram that improves upon the original.\n\n";

    prompt += "## Process Analysis and Diagram Creation Steps\n";
    prompt += "1. First, identify the name and type of process from the input data\n";
    prompt += "2. Extract all sequential steps involved in the process\n";
    prompt += "3. Identify key decision points where the process flow may branch\n";
    prompt += "4. Determine the different roles/departments/units involved in the process\n";
    prompt += "5. For each step, identify or estimate a reasonable time duration\n";
    prompt += "6. Map out the complete workflow from initiation to completion\n";
    prompt += "7. Include appropriate labels, descriptions, and time estimates for each step\n\n";

    prompt += "## Diagram Structure Guidelines\n";
    prompt += "1. Start with a clear title showing the process name\n";
    prompt += "2. Begin the workflow with a 'Start' node and end with an 'End' node\n";
    prompt += "3. Use rectangular nodes for process steps\n";
    prompt += "4. Use diamond shapes for decision points with labeled branches\n";
    prompt += "5. Show the proper sequence with directional arrows using '-->' syntax (NOT '->')\n";
    prompt += "6. Group related activities by department/role when appropriate\n";
    prompt += "7. Include TIME ESTIMATES for each step (e.g., '30 min', '2 hours', '1 day')\n";
    prompt += "8. Ensure all possible paths through the process are represented\n";
    prompt += "9. Use subgraphs to organize the workflow by phases or departments if applicable\n\n";

    // Add the data context similar to document generation
    if (extractedData.type === 'csv' || extractedData.type === 'excel') {
        prompt += `Headers: ${extractedData.headers.join(', ')}\n\n`;
        prompt += "Sample data:\n";

        const sampleSize = Math.min(5, extractedData.content.length);
        for (let i = 0; i < sampleSize; i++) {
            prompt += JSON.stringify(extractedData.content[i]) + "\n";
        }
    } else {
        const contentPreview = typeof extractedData.content === 'string'
            ? extractedData.content.substring(0, 5000)
            : JSON.stringify(extractedData.content).substring(0, 5000);

        prompt += contentPreview;
    }

    prompt += "\n\nGenerate a detailed flowchart that accurately represents the process workflow described in this data.";
    prompt += "\n\nRequirements for the workflow diagram:";
    prompt += "\n1. Use clear, descriptive labels for each step";
    prompt += "\n2. Include appropriate decision points with labeled branches (Yes/No, Approved/Rejected, etc.)";
    prompt += "\n3. Show the flow between different departments or organizational units";
    prompt += "\n4. Use appropriate Mermaid.js symbols for different types of activities:";
    prompt += "\n   - ([text]) for start/end points";
    prompt += "\n   - [text] for process steps";
    prompt += "\n   - {text} for decision points";
    prompt += "\n   - -->|label| for labeled arrows (DO NOT use -> arrows)";
    prompt += "\n5. Title the diagram with the specific process name identified from the input data";
    prompt += "\n6. For each process step, include an estimated time for completion (e.g., 'Step 1: Review Document (30 min)')";
    prompt += "\n7. If the input already has time estimates, use those; otherwise, provide reasonable estimates";
    prompt += "\n8. Ensure the diagram is complete and represents the entire process from beginning to end";
    prompt += "\n9. Make the diagram visually clear and easy to follow";
    prompt += "\n10. If the input is already a workflow or diagram, your version should be clearer and more organized";

    prompt += "\n\nIMPORTANT: For time estimates, use the format '(30 min)' directly in the node label without <br> tags or special formatting. For example: 'Review Document (30 min)' instead of 'Review Document<br>(Estimated Time: 30 min)'";
    // Improved guidelines for Mermaid syntax
    prompt += "\n\nMERMAID.JS SYNTAX REQUIREMENTS:";
    prompt += "\n1. Start with 'graph TD' on its own line";
    prompt += "\n2. Use simple label text without HTML tags or special characters";
    prompt += "\n3. For time estimates, add them directly at the end of labels in parentheses, e.g., 'Review Document (30 min)'";
    prompt += "\n4. DO NOT use <br> tags or HTML formatting in node labels";
    prompt += "\n5. Use double quotes for labels with spaces: A[\"Process step\"]";
    prompt += "\n6. For decision nodes, use proper syntax: A{\"Decision?\"}";
    prompt += "\n7. For arrows with labels, use the proper syntax: A-->|\"Yes\"|B";
    prompt += "\n8. Avoid special characters: ^ < > ` $ ! & *";
    prompt += "\n9. Keep node IDs simple and avoid reserved words like 'end', 'style', etc.";
    prompt += "\n10. Change the end node name from end to endNode to avoid conflicts with Mermaid's reserved keywords";
    prompt += "\n11. Format time estimates consistently as (Xh Ym) or (Z min)";
    prompt += "\n12. For subgraphs, use the correct syntax: 'subgraph Title' and 'end'";

    return prompt;
}



