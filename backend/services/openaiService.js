// backend/services/openaiService.js

import OpenAI from 'openai';
import config from '../config/env.js';
import retryWithBackoff from '../utils/retry.js';
import axios from 'axios';

/**
 * Initialize OpenAI instance
 */
const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Generates chat title based on user query and chatbot type.
 * @param {string} userQuery
 * @param {string} chatbot
 * @returns {string} Generated title.
 */
const generateChatTitle = async (userQuery, chatbot) => {
  console.log('Generating chat title for:', userQuery);
  try {
    let prompt = '';
    switch (chatbot) {
      case 'ai-customer-support':
        prompt = `
          Based on the following user query, generate a brief and meaningful title for the customer support conversation:
          "${userQuery}".
          Please make sure the title is engaging and relevant to the user query.
          Please make sure the title is not more than 40 characters long.
        `;
        break;
      case 'financial-planning':
        prompt = `
          Based on the following user query, generate a brief and meaningful title for the financial planning conversation:
          "${userQuery}".
          Please make sure the title is engaging and relevant to the user query.
          Please make sure the title is not more than 40 characters long.
        `;
        break;
      case 'stock-market':
        prompt = `
          Based on the following user query, generate a brief and meaningful title for the stock market assistance conversation:
          "${userQuery}".
          Please make sure the title is engaging and relevant to the user query.
          Please make sure the title is not more than 40 characters long.
        `;
        break;
      default:
        prompt = `
          Based on the following user query, generate a brief and meaningful title for the conversation:
          "${userQuery}".
          Please make sure the title is engaging and relevant to the user query.
          Please make sure the title is not more than 40 characters long.
        `;
    }

    const completion = await retryWithBackoff(() =>
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates conversation titles.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 50, // Limit tokens to prevent over-length titles
      })
    );

    console.log('Generated chat title:', completion.choices[0].message.content.trim());
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating chat title:', error.message);
    return 'New Chat'; // Default fallback title
  }
};

/**
 * Generates AI response based on user query and other parameters.
 * Falls back to Gemini if OpenAI fails.
 * @param {string} userQuery
 * @param {string} context
 * @param {string} intentions
 * @param {boolean} generateTitle
 * @param {string} chatbot
 * @param {number|null} interestRate
 * @param {string} chatbotRole
 * @param {object} geminiModel
 * @returns {object} Contains response and optional title.
 */
const generateResponseWithAI = async (
  userQuery,
  context,
  intentions,
  generateTitle,
  chatbot,
  interestRate,
  chatbotRole,
  geminiModel
) => {
  let prompt = '';
  switch (chatbot) {
    case 'ai-customer-support':
      prompt = `
        You are a helpful banking customer support assistant.
        User asked: "${userQuery}"
        Historical context: "${context}"
        Predicted intentions: "${intentions}"
        Based on this, provide a helpful response.
      `;
      break;
    case 'financial-planning':
      prompt = `
        You are a financial planning assistant.
        User asked: "${userQuery}"
        Historical context: "${context}"
        Based on this, provide a comprehensive financial advice response.
      `;
      break;
    case 'stock-market':
      prompt = `
        You are a stock market assistant.
        User asked: "${userQuery}"
        Historical context: "${context}"
        Based on this, provide an insightful stock market analysis or advice.
      `;
      break;
    default:
      prompt = `
        You are a helpful assistant.
        User asked: "${userQuery}"
        Historical context: "${context}"
        Predicted intentions: "${intentions}"
        Based on this, provide a helpful response.
      `;
  }

  // Incorporate interest rate into the prompt if available
  let userPrompt = prompt;
  if (chatbot === 'financial-planning' && interestRate !== null) {
    userPrompt += `\n\nCalculated Required Interest Rate: ${interestRate.toFixed(2)}%`;
  }

  try {
    const completion = await retryWithBackoff(() =>
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: `You are a ${chatbotRole}.` },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
      })
    );

    const response = completion.choices[0].message.content.trim();

    let title = null;
    if (generateTitle) {
      title = await generateChatTitle(userQuery, chatbot); // Make sure to await the title generation
    }

    return { response, title };
  } catch (error) {
    console.error('Error connecting to OpenAI, falling back to Gemini:', error.message);

    try {
      const geminiResponse = await geminiModel.generateContent(prompt);
      return { response: geminiResponse.response.text(), title: null }; // Only return response, no title generation in Gemini
    } catch (geminiError) {
      console.error('Error connecting to Gemini API:', geminiError.message);
      throw new Error('Both OpenAI and Gemini APIs failed.');
    }
  }
};

/**
 * Generates suggested prompts based on conversation context and chatbot type.
 * @param {string} context
 * @param {string} chatbot
 * @returns {Array<string>} Suggested prompts.
 */
const generateSuggestedPrompts = async (context, chatbot) => {
  try {
    let prompt = '';
    switch (chatbot) {
      case 'ai-customer-support':
        prompt = `
          Based on the following conversation context, suggest up to 5 helpful questions or topics that the user might be interested in regarding customer support. The prompts should be concise, relevant, and formatted as standalone sentences without numbering or quotes.

          Conversation Context:
          "${context}"

          Suggested Prompts:
        `;
        break;
      case 'financial-planning':
        prompt = `
          Based on the following conversation context, suggest up to 5 helpful financial planning questions or topics that the user might be interested in. The prompts should be concise, relevant, and formatted as standalone sentences without numbering or quotes.

          Conversation Context:
          "${context}"

          Suggested Prompts:
        `;
        break;
      case 'stock-market':
        prompt = `
          Based on the following conversation context, suggest up to 5 insightful stock market questions or topics that the user might be interested in. The prompts should be concise, relevant, and formatted as standalone sentences without numbering or quotes.

          Conversation Context:
          "${context}"

          Suggested Prompts:
        `;
        break;
      default:
        prompt = `
          Based on the following conversation context, suggest up to 5 helpful questions or topics that the user might be interested in. The prompts should be concise, relevant, and formatted as standalone sentences without numbering or quotes.

          Conversation Context:
          "${context}"

          Suggested Prompts:
        `;
    }

    const completion = await retryWithBackoff(() =>
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an assistant that suggests helpful prompts to users in a chat.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 150, // Increased token limit for better responses
        temperature: 0.7,
      })
    );

    const responseText = completion.choices[0].message.content.trim();

    // Split the response into individual prompts based on line breaks
    const prompts = responseText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line); // Remove empty lines

    console.log('Suggested Prompts:', prompts);

    return prompts;
  } catch (error) {
    console.error('Error generating suggested prompts:', error.message);
    return [];
  }
};

/**
 * Generates embeddings for the user query using Hugging Face API
 * @param {string} userQuery - The user's query
 * @returns {Array<number>} - 768-dimensional embedding array
 */
const generateQueryEmbedding = async (userQuery) => {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-mpnet-base-v2',
      {
        inputs: userQuery,
      },
      {
        headers: {
          Authorization: `Bearer ${config.huggingFaceApiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Ensure the embedding has the expected length
    if (Array.isArray(response.data) && response.data.length === 768) {
      return response.data;
    } else {
      throw new Error(`Unexpected embedding size: ${response.data.length}. Expected 768.`);
    }
  } catch (error) {
    console.error('Error generating query embedding:', error);
    throw error;
  }
};

export {
  generateChatTitle,
  generateResponseWithAI,
  generateSuggestedPrompts,
  generateQueryEmbedding,
  openai, // Exporting the OpenAI instance for potential use elsewhere
};
