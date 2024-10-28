// backend/index.js

import express, { query } from 'express';      // Express framework
import cors from 'cors';            // CORS middleware
import axios from 'axios';          // Axios for HTTP requests
import OpenAI from 'openai';        // OpenAI SDK
import { GoogleGenerativeAI } from '@google/generative-ai'; // Google Generative AI SDK
import { MilvusClient, DataType, ConsistencyLevelEnum } from '@zilliz/milvus2-sdk-node'; // Milvus SDK
import 'dotenv/config';             // Load environment variables from .env

const app = express();
const port = process.env.PORT || 8080;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize OpenAI with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Google Generative AI (Gemini) SDK
const genAI = new GoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Initialize Milvus client
const address = process.env.MILVUS_ADDRESS;
const token = process.env.MILVUS_TOKEN;

if (!address || !token) {
  throw new Error('MILVUS_ADDRESS or MILVUS_TOKEN environment variables are missing.');
}

const client = new MilvusClient({ address, token });

/**
 * Function to generate the title for the chat based on chatbot type
 * @param {*} userQuery user query
 * @param {*} chatbot chatbot type
 * @returns generated chat title
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that generates conversation titles." },
        { role: "user", content: prompt },
      ],
      max_tokens: 50, // Limit tokens to prevent over-length titles
    });

    console.log('Generated chat title:', completion.choices[0].message.content.trim());
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating chat title:", error.message);
    return "New Chat"; // Default fallback title
  }
};

/**
 * Function to generate embeddings for the
 * @param {*} userQuery user query
 * @returns embedding for user query (768-dimensional array)
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
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
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

// Search Milvus for similar embeddings
/**
 * Search Milvus for similar embeddings
 * @param {*} queryEmbedding search query embedding (768-dimensional array)
 * @returns search results from Milvus (IDs of similar embeddings)
 */
const searchMilvus = async (queryEmbedding) => {
  try {
    // Ensure the embedding is valid
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      throw new Error('Query embedding is invalid or empty.');
    }

    const searchParams = {
      collection_name: 'banking77_embeddings',
      consistency_level: ConsistencyLevelEnum.Bounded,
      output_fields: ['intent'],
      search_params: {
        anns_field: 'vector',
        metric_type: 'IP',
        params: JSON.stringify({ nprobe: 16 }),
        topk: 5,
      },
      vectors: [queryEmbedding]
    };

    const results = await client.search(searchParams);

    console.log('Search Results:', results);
    return results.results.map((result) => result.id);
  } catch (error) {
    console.error('Error searching Milvus:', error);
    throw error;
  }
};

// Retry logic with exponential backoff
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    console.log(`Retrying in ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
  }
};

// Function to call OpenAI and fallback to Gemini if needed based on chatbot type
/**
 * Function to generate response using OpenAI's GPT-4 model and fallback to Gemini
 * @param {*} userQuery user query
 * @param {*} context conversation context
 * @param {*} intentions predicted intentions
 * @param {*} generateTitle whether to generate a chat title
 * @param {*} chatbot type of chatbot
 * @param {*} interestRate interest rate for financial planning chatbot
 * @returns
 */
const generateResponseWithAI = async (userQuery, context, intentions, generateTitle, chatbot, interestRate) => {
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
    const completion = await retryWithBackoff(() => openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: `You are a ${getChatbotRole(chatbot)}.` },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    }));

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
 * Function to get the role of the chatbot based on the chat
 * @param {*} chatbot type of chatbot
 * @returns generated chatbot role
 */
const getChatbotRole = (chatbot) => {
  switch (chatbot) {
    case 'ai-customer-support':
      return 'customer support assistant for a bank';
    case 'financial-planning':
      return 'financial planning assistant';
    case 'stock-market':
      return 'stock market assistant';
    default:
      return 'helpful assistant';
  }
};

// Function to generate suggested prompts based on chatbot type
/**
 * Function to generate suggested prompts based on the conversation context
 * @param {*} context conversation context
 * @param {*} chatbot chatbot type
 * @returns suggested prompts based on the context
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an assistant that suggests helpful prompts to users in a chat." },
        { role: "user", content: prompt },
      ],
      max_tokens: 150, // Increased token limit for better responses
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content.trim();

    // Split the response into individual prompts based on line breaks
    const prompts = responseText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line); // Remove empty lines

    console.log('Suggested Prompts:', prompts);

    return prompts;
  } catch (error) {
    console.error("Error generating suggested prompts:", error.message);
    return [];
  }
};

/**
 * Route to handle chat requests
 */
app.post('/api/chat', async (req, res) => {
  console.log('Received request:', req.body);
  const { prompt, context, generateTitle, chatbot, interestRate } = req.body; // Receive 'chatbot' parameter

  if (!chatbot) {
    return res.status(400).json({ error: 'Chatbot type is required.' });
  }

  try {
    var queryEmbedding = [];
    var results = [];
    var intentions = '';
    if (chatbot === 'ai-customer-support') {
      queryEmbedding = await generateQueryEmbedding(prompt);
      results = await searchMilvus(queryEmbedding);
      intentions = `Relevant intentions: ${results.join(', ')}`; // Placeholder context
    }

    const { response, title } = await generateResponseWithAI(prompt, context, intentions, generateTitle, chatbot, interestRate);

    console.log('Generated response:', response);
    res.json({ message: response, title });
  } catch (error) {
    console.error('Error processing request:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Route to handle suggested prompts requests
 */
app.post('/api/suggested-prompts', async (req, res) => {
  console.log('Received request:', req.body);
  const { context, chatbot, interestRate } = req.body;

  if (!chatbot) {
    return res.status(400).json({ error: 'Chatbot type is required.' });
  }

  try {
    // Generate suggestions using OpenAI's GPT-4o model
    const prompts = await generateSuggestedPrompts(context, chatbot);
    console.log('Generated prompts:', prompts);
    res.json({ prompts });
  } catch (error) {
    console.error('Error generating suggested prompts:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
