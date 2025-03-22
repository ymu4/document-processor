// utils/config.js

/**
 * Environment configuration for API keys and other settings
 */
const config = {
    // OpenAI API key - make sure this is set in .env.local
    openaiApiKey: process.env.OPENAI_API_KEY,

    // Default model to use for document generation
    defaultModel: process.env.DEFAULT_MODEL || 'gpt-3.5-turbo', // Fallback to gpt-3.5-turbo if gpt-4 not available

    // Model for workflow generation
    workflowModel: process.env.WORKFLOW_MODEL || 'gpt-3.5-turbo',

    // Temperature settings
    documentTemperature: parseFloat(process.env.DOCUMENT_TEMPERATURE) || 0.2,
    workflowTemperature: parseFloat(process.env.WORKFLOW_TEMPERATURE) || 0.3,
};

// Validate the configuration
export function validateConfig() {
    if (!config.openaiApiKey) {
        console.warn('OPENAI_API_KEY is not set in your environment variables. Set this in .env.local');
        return false;
    }

    return true;
}

export default config;