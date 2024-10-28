// backend/routes/chat.js

import express from 'express';
import {
  generateChatTitle,
  generateResponseWithAI,
  generateSuggestedPrompts,
  generateQueryEmbedding,
  openai,
} from '../services/openaiService.js';
import { searchMilvus } from '../services/milvusService.js';
import { searchSymbol, getRealTimeQuote, getDailyTimeSeries, getNewsSentiment } from '../services/stockService.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/env.js';

const router = express.Router();

// Initialize Google Generative AI (Gemini) SDK
const genAI = new GoogleGenerativeAI({
  apiKey: config.geminiApiKey,
});
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Function to get the role of the chatbot based on the chat
 * @param {string} chatbot - Type of chatbot
 * @returns {string} - Role description
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

/**
 * Formats the stock quote data into a user-friendly message.
 * @param {object} quoteData - The real-time quote data.
 * @param {Array<object>} timeSeriesData - The historical time series data.
 * @returns {string} - Formatted stock quote message.
 */
const formatStockQuote = (quoteData, timeSeriesData) => {
  // Find the latest trading day from historical data
  const latestTradingDay = timeSeriesData[0].date.toISOString().split('T')[0];
  const latestData = timeSeriesData[0];

  return `
**Real-Time Stock Quote for ${quoteData.symbol}:**
- **Price:** $${parseFloat(quoteData.regularMarketPrice).toFixed(2)}
- **Change:** ${parseFloat(quoteData.regularMarketChange).toFixed(2)} (${parseFloat((quoteData.regularMarketChangePercent * 100).toFixed(2))}%)
- **Last Trading Day:** ${latestTradingDay}
- **Open:** $${parseFloat(latestData.open).toFixed(2)}
- **High:** $${parseFloat(latestData.high).toFixed(2)}
- **Low:** $${parseFloat(latestData.low).toFixed(2)}
- **Close:** $${parseFloat(latestData.close).toFixed(2)}
- **Volume:** ${latestData.volume.toLocaleString()}
`;
};

/**
 * Formats the news sentiment data into a user-friendly message.
 * @param {object} sentimentData - The news sentiment data.
 * @returns {string} - Formatted news sentiment message.
 */
const formatNewsSentiment = (sentimentData) => {
  if (!sentimentData.news || sentimentData.news.length === 0) {
    return 'No recent news sentiment data available for this stock.';
  }

  // Calculate average polarity
  const totalPolarity = sentimentData.news.reduce((acc, article) => acc + parseFloat(article.score), 0);
  const averagePolarity = (totalPolarity / sentimentData.news.length).toFixed(2);
  const sentimentType =
    averagePolarity > 0.1 ? 'Positive' :
    averagePolarity < -0.1 ? 'Negative' :
    'Neutral';

  return `
**News Sentiment for ${sentimentData.tickers[0]}:**
- **Average Sentiment Score:** ${averagePolarity} (${sentimentType})
- **Number of Articles Analyzed:** ${sentimentData.news.length}
`;
};

/**
 * Function to check if stock data is already in the conversation history.
 * @param {string} symbol - The stock symbol.
 * @param {string} context - The conversation history as a string.
 * @returns {string|null} - The previously fetched stock data or null.
 */
/**
 * Function to check if stock data is already in the conversation history.
 * @param {string} symbol - The stock symbol.
 * @param {string} context - The conversation history as a string.
 * @returns {boolean} - True if stock data is already present, false otherwise.
 */
const getPreviousStockDataFromHistory = (symbol, context) => {
  return context.includes(`Real-Time Stock Quote for ${symbol}:`);
};

/**
 * Route to handle chat requests
 */
router.post('/', async (req, res) => {
  console.log('Received /api/chat request:', req.body);
  const { prompt, context, generateTitle, chatbot, interestRate } = req.body;

  if (!chatbot) {
    return res.status(400).json({ error: 'Chatbot type is required.' });
  }

  try {
    let queryEmbedding = [];
    let results = [];
    let intentions = '';
    let updatedContext = context; // Initialize updatedContext with the original context
    let additionalResponseData = ''; // Initialize an empty string for any additional data to include in the response

    // Handle 'ai-customer-support' chatbot type
    if (chatbot === 'ai-customer-support') {
      queryEmbedding = await generateQueryEmbedding(prompt);
      results = await searchMilvus(queryEmbedding);
      intentions = `Relevant intentions: ${results.join(', ')}`;
    }

    // Handle 'stock-market' chatbot type
    if (chatbot === 'stock-market') {
      // Extract stock symbols from the prompt
      const stockSymbolMatches = prompt.match(/\b[A-Z]{1,5}(?:\.[A-Z]{1,4})?\b/g);
      let symbols = stockSymbolMatches ? [...new Set(stockSymbolMatches)] : [];

      // Check if stock data is already in the context
      const stockDataAlreadyProvided = symbols.every(symbol =>
        context.includes(`Real-Time Stock Quote for ${symbol}:`)
      );

      if (!stockDataAlreadyProvided && symbols.length > 0) {
        // Fetch stock data since it hasn't been provided yet
        console.log('Fetching stock data for symbols:', symbols);

        const stockDataPromises = symbols.map(async (symbol) => {
          try {
            const previousDataExists = getPreviousStockDataFromHistory(symbol, context);
            if (previousDataExists) {
              console.log(`Stock data for ${symbol} is already in the context.`);
              return ''; // Skip fetching if data is already in context
            }

            // Fetch stock data
            const quoteData = await getRealTimeQuote(symbol);
            const timeSeries = await getDailyTimeSeries(symbol, { period: '1mo', interval: '1d' });
            const sentimentData = await getNewsSentiment(symbol);

            const formattedQuote = formatStockQuote(quoteData, timeSeries);
            const formattedSentiment = formatNewsSentiment(sentimentData);

            return `${formattedQuote}\n${formattedSentiment}`;
          } catch (error) {
            console.error(`Error fetching stock data for ${symbol}:`, error.message);
            return `Sorry, I couldn't retrieve complete data for the stock symbol "${symbol}". Please ensure it's correct and try again.`;
          }
        });

        const stockResponses = await Promise.all(stockDataPromises);
        const combinedStockData = stockResponses.filter(response => response).join('\n\n');

        // Update the conversation context by appending the new stock data
        updatedContext = `${context}\n${combinedStockData}`;

        // Include the stock data in the response sent to the user after generating the AI response
        additionalResponseData = combinedStockData;
      }
    }

    // Generate AI response using the updated context
    const { response: aiResponse, title } = await generateResponseWithAI(
      prompt,
      updatedContext,
      intentions,
      generateTitle,
      chatbot,
      interestRate,
      getChatbotRole(chatbot),
      geminiModel
    );

    // Prepare the final response
    let finalResponse = aiResponse;

    // If there is additional data (e.g., stock data), include it in the final response
    if (additionalResponseData) {
      finalResponse = `${additionalResponseData}\n\n${aiResponse}`.trim();
    }

    // Send the response
    return res.json({ message: finalResponse, title });

  } catch (error) {
    console.error('Error processing /api/chat request:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
