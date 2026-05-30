const { AzureOpenAI } = require('openai');
const { OpenAI } = require('openai');

let clientInstance = null;

/**
 * Gets or creates the OpenAI client.
 * Supports both Azure OpenAI and standard OpenAI based on environment variables.
 * 
 * Azure OpenAI: Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY, AZURE_OPENAI_DEPLOYMENT
 * Standard OpenAI: Set OPENAI_API_KEY
 */
function getClient() {
    if (clientInstance) return clientInstance;

    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureKey = process.env.AZURE_OPENAI_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (azureEndpoint && azureKey) {
        clientInstance = new AzureOpenAI({
            endpoint: azureEndpoint,
            apiKey: azureKey,
            apiVersion: '2024-08-01-preview'
        });
        console.log('[AI] Using Azure OpenAI');
    } else if (openaiKey) {
        clientInstance = new OpenAI({
            apiKey: openaiKey
        });
        console.log('[AI] Using standard OpenAI');
    } else {
        throw new Error('No AI credentials configured. Set AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_KEY, or OPENAI_API_KEY.');
    }

    return clientInstance;
}

/**
 * Get the model/deployment name to use.
 */
function getModel() {
    return process.env.AZURE_OPENAI_DEPLOYMENT || process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

/**
 * Call the AI with a system prompt and user message.
 * @param {string} systemPrompt - The system instruction
 * @param {string} userMessage - The user query
 * @param {object} [options] - Additional options
 * @param {number} [options.maxTokens=2000] - Max response tokens
 * @param {number} [options.temperature=0.7] - Temperature
 * @param {boolean} [options.jsonMode=false] - Force JSON output
 * @returns {Promise<string>} The AI response content
 */
async function callAI(systemPrompt, userMessage, options = {}) {
    const client = getClient();
    const model = getModel();

    const {
        maxTokens = 2000,
        temperature = 0.7,
        jsonMode = false
    } = options;

    const requestBody = {
        model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
        max_tokens: maxTokens,
        temperature
    };

    if (jsonMode) {
        requestBody.response_format = { type: 'json_object' };
    }

    const response = await client.chat.completions.create(requestBody);

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('Empty response from AI');
    }

    // Log usage for cost tracking
    if (response.usage) {
        console.log(`[AI] Tokens: ${response.usage.prompt_tokens} in / ${response.usage.completion_tokens} out / ${response.usage.total_tokens} total`);
    }

    return content;
}

/**
 * Call the AI with a full conversation (multi-turn).
 * @param {Array<{role: string, content: string}>} messages - Conversation messages
 * @param {object} [options] - Additional options
 * @returns {Promise<string>} The AI response content
 */
async function callAIChat(messages, options = {}) {
    const client = getClient();
    const model = getModel();

    const {
        maxTokens = 2000,
        temperature = 0.7
    } = options;

    const response = await client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('Empty response from AI');
    }

    if (response.usage) {
        console.log(`[AI] Tokens: ${response.usage.prompt_tokens} in / ${response.usage.completion_tokens} out / ${response.usage.total_tokens} total`);
    }

    return content;
}

module.exports = { callAI, callAIChat, getClient, getModel };
