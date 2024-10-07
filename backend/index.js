// backend/index.js
import express, { query } from 'express';      // Express framework
import cors from 'cors';            // CORS middleware
import OpenAI from 'openai';        // OpenAI SDK
import { GoogleGenerativeAI } from '@google/generative-ai'; // Google Generative AI SDK
import { MilvusClient, DataType, ConsistencyLevelEnum } from '@zilliz/milvus2-sdk-node'; // Milvus SDK
import { pipeline } from '@xenova/transformers';  // Import Xenova pipeline
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

// Hugging Face pipeline to generate embeddings
class MyEmbeddingPipeline {
  static task = 'feature-extraction'; // Task for embeddings
  static model = 'Xenova/all-mpnet-base-v2';  // Model used for embedding
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      // Initialize the pipeline if not already created
      this.instance = await pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

// Function to generate embeddings for the user query
const generateQueryEmbedding = async (userQuery) => {
  try {
    // Get the embedding pipeline instance
    const embeddingPipeline = await MyEmbeddingPipeline.getInstance();

    // Use the pipeline to generate embeddings
    const embeddings = await embeddingPipeline(userQuery);

    // Extract the first 768 values (the CLS token's embedding)
    const clsEmbedding = embeddings.data.slice(0, 768);  // Assuming embeddings.data is the raw data

    console.log('Generated Embedding (CLS):', clsEmbedding);
    console.log('Embedding size:', clsEmbedding.length);

    const clsEmbeddingArray = Array.from(clsEmbedding);  // Convert Float32Array to regular array

    console.log('IsArray: ', Array.isArray(clsEmbeddingArray));

    // Verify the length of the embedding
    if (clsEmbeddingArray.length === 768) {
      return clsEmbeddingArray;  // Return the correct embedding for Milvus search
    } else {
      throw new Error(`Unexpected embedding size: ${clsEmbeddingArray.length}. Expected 768.`);
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
const generateResponseWithOpenAI = async (userQuery, context) => {
  const prompt = `
    You are a helpful banking customer support assistant.
    User asked: "${userQuery}"
    Possible issues: "${context}"
    Based on this, provide a helpful response.
  `;
  try {
    // Try calling OpenAI with retry logic
    const completion = await retryWithBackoff(() => openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a customer service agent for a bank." },
        { role: "user", content: prompt },
      ],
    }));

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error connecting to OpenAI, falling back to Gemini:', error.message);

    // Fallback to Google Gemini if OpenAI fails
    try {
      const result = await geminiModel.generateContent(prompt);
      return result.response.text(); // Adjust based on the actual response structure
    } catch (geminiError) {
      console.error('Error connecting to Gemini API:', geminiError.message);
      throw new Error('Both OpenAI and Gemini APIs failed.');
    }
  }
};

// Route to handle chat requests
app.post('/api/chat', async (req, res) => {
  console.log('Received a request to /api/chat'); // Log when the route is hit
  const { prompt } = req.body;

  try {
    // Step 1: Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(prompt);

    // Step 2: Search Milvus for similar embeddings
    const results = await searchMilvus(queryEmbedding);

    // Step 3: Generate response using retrieved context and OpenAI
    const context = `Relevant intentions: ${results.join(', ')}`; // Placeholder context
    const response = await generateResponseWithOpenAI(prompt, context);

    res.json({ message: response });
  } catch (error) {
    console.error('Error processing request:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
console.log(`Server running on port ${port}`);
});
