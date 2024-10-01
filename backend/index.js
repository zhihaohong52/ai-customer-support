// backend/index.js
import express from 'express';      // Express framework
import cors from 'cors';            // CORS middleware
import OpenAI from 'openai';        // OpenAI SDK
import { GoogleGenerativeAI } from '@google/generative-ai'; // Google Generative AI SDK
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
const getResponseWithFallback = async (prompt) => {
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
      const response = await getResponseWithFallback(prompt);
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
