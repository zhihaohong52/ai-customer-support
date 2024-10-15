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

const client = new MilvusClient({address, token})

// Function to generate the title for the chat
const generateChatTitle = async (userQuery) => {
  try {
    const prompt = `
      Based on the following user query, generate a brief and meaningful title for the conversation:
      "${userQuery}".
      Please make sure the title is engaging and relevant to the user query.
      Please make sure the title is not more than 40 characters long.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that generates conversation titles." },
        { role: "user", content: prompt },
      ],
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating chat title:", error.message);
    return "New Chat"; // Default fallback title
  }
};

// Function to generate embeddings for the user query
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
    if (response.data.length === 768) {
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

// Function to call OpenAI and fallback to Gemini if needed
const generateResponseWithOpenAI = async (userQuery, context, intentions, generateTitle) => {
  const prompt = `
    You are a helpful banking customer support assistant.
    User asked: "${userQuery}"
    Historical context: "${context}"
    Predicted intentions: "${intentions}"
    Based on this, provide a helpful response.
  `;
  try {
    const completion = await retryWithBackoff(() => openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a customer service agent for a bank." },
        { role: "assistant", content: "Hello, how can I help you today?" },
        { role: "user", content: prompt },
      ],
    }));

    const response = completion.choices[0].message.content;

    let title = null;
    if (generateTitle) {
      title = await generateChatTitle(userQuery); // Make sure to await the title generation
    }

    return { response, title };
  } catch (error) {
    console.error('Error connecting to OpenAI, falling back to Gemini:', error.message);

    try {
      const result = await geminiModel.generateContent(prompt);
      return { response: result.response.text(), title: null }; // Only return response, no title generation in Gemini
    } catch (geminiError) {
      console.error('Error connecting to Gemini API:', geminiError.message);
      throw new Error('Both OpenAI and Gemini APIs failed.');
    }
  }
};

// Function to generate suggested prompts
const generateSuggestedPrompts = async (context) => {
  try {
    const prompt = `
      Based on the following conversation context, suggest up to 5 helpful questions or topics that the user might be interested in. The prompts should be concise and relevant.

      Conversation Context:
      "${context}"

      Suggested Prompts:
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an assistant that suggests helpful prompts to users in a customer support chat." },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      n: 1,
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;

    // Split the response into individual prompts
    const prompts = responseText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);

    console.log('Suggested Prompts:', prompts);

    return prompts;
  } catch (error) {
    console.error("Error generating suggested prompts:", error.message);
    return [];
  }
};


// Route to handle chat requests
app.post('/api/chat', async (req, res) => {
  const { prompt, context, generateTitle } = req.body;

  try {
    const queryEmbedding = await generateQueryEmbedding(prompt);
    const results = await searchMilvus(queryEmbedding);

    const intentions = `Relevant intentions: ${results.join(', ')}`; // Placeholder context
    const { response, title } = await generateResponseWithOpenAI(prompt, context, intentions, generateTitle);

    res.json({ message: response, title });
  } catch (error) {
    console.error('Error processing request:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route to handle suggested prompts
app.post('/api/suggested-prompts', async (req, res) => {
  const { context } = req.body;

  try {
    // Generate suggestions using OpenAI's GPT-4 model
    const prompts = await generateSuggestedPrompts(context);
    res.json({ prompts });
  } catch {
    console.error('Error generating suggested prompts:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
console.log(`Server running on port ${port}`);
});
