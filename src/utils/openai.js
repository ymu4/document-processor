// utils/openai.js
import OpenAI from 'openai';
import config from './config';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Use environment variable directly
});

// Check if API key is configured
console.log('OpenAI API Key configured:',
    process.env.OPENAI_API_KEY ? 'Yes (key exists)' : 'No (missing key)');

export default openai;