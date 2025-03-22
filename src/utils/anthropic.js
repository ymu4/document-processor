// utils/anthropic.js
import Anthropic from '@anthropic-ai/sdk';
import config from './config';

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY, // Use environment variable directly
});

// Check if API key is configured
console.log('Anthropic API Key configured:',
    process.env.ANTHROPIC_API_KEY ? 'Yes (key exists)' : 'No (missing key)');

export default anthropic;