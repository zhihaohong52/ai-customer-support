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
const getPreviousStockDataFromHistory = (symbol, context) => {
  // Split context by newlines to mimic message history
  const lines = context.split('\n');

  // Reverse the array to search from the most recent message backward
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    // Check if the line includes both the symbol and stock quote data
    if (line.includes(`Real-Time Stock Quote for ${symbol}`) && line.includes(`News Sentiment for ${symbol}`)) {
      return line;
    }
  }
  return null;
};

// Track if stock data was provided in the initial query
let stockDataProvided = false;

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

    // Handle 'ai-customer-support' chatbot type
    if (chatbot === 'ai-customer-support') {
      queryEmbedding = await generateQueryEmbedding(prompt);
      results = await searchMilvus(queryEmbedding);
      intentions = `Relevant intentions: ${results.join(', ')}`;
    }

    // Handle 'stock-market' chatbot type by fetching stock data only for the initial query
    if (chatbot === 'stock-market') {
      const stockSymbolMatches = prompt.match(/\b[A-Z]{1,5}(?:\.[A-Z]{2,4})?\b/g);
      let symbols = stockSymbolMatches ? [...new Set(stockSymbolMatches)] : [];

      if (!stockDataProvided && symbols.length > 0) {
        // Initial query: fetch stock data and set the flag
        console.log('Fetching stock data for initial query');
        stockDataProvided = true;

        const stockDataPromises = symbols.map(async (symbol) => {
          try {
            const previousData = getPreviousStockDataFromHistory(symbol, context);
            if (previousData) {
              return previousData;
            }

            const quoteData = await getRealTimeQuote(symbol);
            const timeSeries = await getDailyTimeSeries(symbol, { period: '1mo', interval: '1d' });
            const sentimentData = await getNewsSentiment(symbol);

            const formattedQuote = formatStockQuote(quoteData, timeSeries);
            const formattedSentiment = formatNewsSentiment(sentimentData);

            return `${formattedQuote}\n${formattedSentiment}`;
          } catch (error) {
            console.error('Error fetching stock data:', error.message);
            return `Sorry, I couldn't retrieve complete data for the stock symbol "${symbol}". Please ensure it's correct and try again.`;
          }
        });

        const stockResponses = await Promise.all(stockDataPromises);
        const combinedResponse = stockResponses.join('\n');

        return res.json({
          message: combinedResponse,
          title: generateTitle ? `Stock Analysis: ${symbols.join(', ')}` : null,
        });
      } else {
        // Follow-up question: send directly to GPT without fetching stock data
        console.log('Handling follow-up question');
        const { response, title } = await generateResponseWithAI(
          prompt,
          context,
          intentions,
          generateTitle,
          chatbot,
          interestRate,
          getChatbotRole(chatbot),
          geminiModel
        );

        return res.json({ message: response, title });
      }
    }

    // Default case: other chatbot types
    const { response, title } = await generateResponseWithAI(
      prompt,
      context,
      intentions,
      generateTitle,
      chatbot,
      interestRate,
      getChatbotRole(chatbot),
      geminiModel
    );

    res.json({ message: response, title });
  } catch (error) {
    console.error('Error processing /api/chat request:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
