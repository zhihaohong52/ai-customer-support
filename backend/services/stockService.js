// backend/services/stockService.js

import yahooFinance from 'yahoo-finance2';
import axios from 'axios';
import Parser from 'rss-parser';
import config from '../config/env.js';
import NodeCache from 'node-cache';

// Initialize cache with a TTL of 1 hour
const stockCache = new NodeCache({ stdTTL: 60 * 60 });

// Initialize RSS Parser for fetching news feeds
const parser = new Parser();

// Object to hold pending promises for cache locking
const pendingPromises = {};

/**
 * Performs sentiment analysis using Hugging Face Inference API.
 * @param {string} text - The text to analyze.
 * @returns {object} - Sentiment analysis result.
 */
const analyzeSentiment = async (text) => {
  try {
    // Ensure API token is loaded
    if (!config.huggingFaceApiToken) {
      throw new Error('Hugging Face API token is not defined.');
    }

    const cacheKey = `sentiment_${text}`;
    const cachedSentiment = stockCache.get(cacheKey);
    if (cachedSentiment) {
      console.log(`Cache hit for sentiment analysis.`);
      return cachedSentiment;
    }

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis',
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${config.huggingFaceApiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Sentiment Analysis Response:', response.data);

    // Correctly extract the first sentiment object from the nested arrays
    if (
      response.data &&
      Array.isArray(response.data) &&
      Array.isArray(response.data[0]) &&
      response.data[0].length > 0
    ) {
      const sentiment = response.data[0][0];
      stockCache.set(cacheKey, sentiment);
      console.log(`Cache set for sentiment analysis.`);
      return sentiment;
    } else {
      throw new Error('Invalid response structure from Hugging Face API.');
    }
  } catch (error) {
    console.error('Error performing sentiment analysis:', error.message);
    // Return neutral sentiment if analysis fails
    return { label: 'NEUTRAL', score: 0 };
  }
};

/**
 * Searches for the best matching stock symbols based on keywords.
 * @param {string} keywords - The search keywords (e.g., "Apple").
 * @returns {Array<object>} - Array of matching symbols with details.
 */
const searchSymbol = async (keywords) => {
  try {
    console.log(`Searching symbols for: ${keywords}`);
    const cacheKey = `symbol_search_${keywords.toUpperCase()}`;
    const cachedResult = stockCache.get(cacheKey);
    if (cachedResult) {
      console.log(`Cache hit for symbol search: ${keywords}`);
      return cachedResult;
    }

    const searchResults = await yahooFinance.search(keywords);

    console.log(`Symbol Search API Response for "${keywords}":`, searchResults);

    if (!searchResults || searchResults.count === 0 || !searchResults.quotes || searchResults.quotes.length === 0) {
      throw new Error(`No matching symbols found for keywords: ${keywords}`);
    }

    // Extract relevant data
    const matches = searchResults.quotes.map((quote) => ({
      symbol: quote.symbol,
      shortname: quote.shortname,
      exchDisp: quote.exchDisp,
      typeDisp: quote.typeDisp,
    }));

    // Cache the result
    stockCache.set(cacheKey, matches);
    console.log(`Cache set for symbol search: ${keywords}`);

    return matches;
  } catch (error) {
    console.error(`Error searching symbols for "${keywords}":`, error.message);
    throw error;
  }
};

/**
 * Fetches real-time stock quote from Yahoo Finance with caching.
 * @param {string} symbol - Stock ticker symbol (e.g., AAPL).
 * @returns {object} - Stock quote data.
 */
const getRealTimeQuote = async (symbol) => {
  try {
    const cacheKey = `real_time_quote_${symbol}`;
    const cachedQuote = stockCache.get(cacheKey);
    if (cachedQuote) {
      console.log(`Cache hit for real-time quote: ${symbol}`);
      return cachedQuote;
    }

    const quote = await yahooFinance.quote(symbol);

    if (!quote || Object.keys(quote).length === 0) {
      throw new Error(`No real-time data found for symbol: ${symbol}`);
    }

    // Cache the real-time quote
    stockCache.set(cacheKey, quote);
    console.log(`Cache set for real-time quote: ${symbol}`);
    console.log('Real-Time Quote:', quote);
    return quote;
  } catch (error) {
    console.error(`Error fetching real-time quote for ${symbol}:`, error.message);
    throw error;
  }
};

/**
 * Fetches historical daily stock prices from Yahoo Finance with caching.
 * @param {string} symbol - Stock ticker symbol.
 * @param {object} options - Options for historical data (e.g., period, interval).
 * @returns {Array<object>} - Array of historical stock data.
 */
const getDailyTimeSeries = async (symbol, options = { period: '1mo', interval: '1d' }) => {
  try {
    const cacheKey = `daily_time_series_${symbol}_${options.period}_${options.interval}`;
    const cachedTimeSeries = stockCache.get(cacheKey);
    if (cachedTimeSeries) {
      console.log(`Cache hit for daily time series: ${symbol}, ${options.period}, ${options.interval}`);
      return cachedTimeSeries;
    }

    // Convert 'period' to period1 and period2 dates
    let period1Date;
    const period2Date = new Date();

    switch (options.period) {
      case '1mo':
        period1Date = new Date();
        period1Date.setMonth(period1Date.getMonth() - 1);
        break;
      case '6mo':
        period1Date = new Date();
        period1Date.setMonth(period1Date.getMonth() - 6);
        break;
      case '1y':
        period1Date = new Date();
        period1Date.setFullYear(period1Date.getFullYear() - 1);
        break;
      default:
        // Default to 1 month if unknown period
        period1Date = new Date();
        period1Date.setMonth(period1Date.getMonth() - 1);
    }

    const period1 = period1Date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const period2 = period2Date.toISOString().split('T')[0]; // 'YYYY-MM-DD'

    const queryOptions = {
      period1,
      period2,
      interval: options.interval,
    };

    const chartData = await yahooFinance.chart(symbol, queryOptions);

    if (!chartData || !chartData.quotes || chartData.quotes.length === 0) {
      throw new Error(`No historical data found for symbol: ${symbol}`);
    }

    // Convert quotes to desired format
    const historical = chartData.quotes.map((quote) => ({
      date: new Date(quote.date),
      open: quote.open,
      high: quote.high,
      low: quote.low,
      close: quote.close,
      volume: quote.volume,
    }));

    // Sort descending by date (optional, based on your requirements)
    historical.sort((a, b) => b.date - a.date);

    // Cache the historical data
    stockCache.set(cacheKey, historical);
    console.log(`Cache set for daily time series: ${symbol}, ${options.period}, ${options.interval}`);
    console.log('Historical Data:', historical);
    return historical;
  } catch (error) {
    console.error(`Error fetching daily time series for ${symbol}:`, error.message);
    throw error;
  }
};

/**
 * Fetches market news and sentiment data using Yahoo Finance RSS feeds.
 * @param {string} symbol - Stock ticker symbol.
 * @returns {object} - News sentiment data.
 */
const getNewsSentiment = async (symbol) => {
  try {
    const cacheKey = `news_sentiment_${symbol}`;
    const cachedSentiment = stockCache.get(cacheKey);
    if (cachedSentiment) {
      console.log(`Cache hit for news sentiment: ${symbol}`);
      return cachedSentiment;
    }

    // If a promise for this symbol is already pending, await it
    if (pendingPromises[cacheKey]) {
      console.log(`Awaiting existing promise for news sentiment: ${symbol}`);
      return await pendingPromises[cacheKey];
    }

    console.log(`Cache miss for news sentiment: ${symbol}. Fetching from API...`);

    // Create a new promise and store it in pendingPromises
    pendingPromises[cacheKey] = (async () => {
      // Fetch RSS feed for the symbol
      const rssUrl = `https://finance.yahoo.com/rss/headline?s=${symbol}`;
      const feed = await parser.parseURL(rssUrl);

      if (!feed || !feed.items || feed.items.length === 0) {
        throw new Error(`No news articles found for symbol: ${symbol}`);
      }

      // Limit to the latest 10 articles
      const latestNews = feed.items.slice(0, 10);

      // Perform sentiment analysis on each article's summary
      const sentimentPromises = latestNews.map(async (article) => {
        const text = article.content || article.summary || '';
        const sentiment = await analyzeSentiment(text);
        return {
          title: article.title,
          summary: article.contentSnippet || '',
          published: new Date(article.pubDate),
          sentiment: sentiment.label,
          score: sentiment.score,
        };
      });

      const newsWithSentiment = await Promise.all(sentimentPromises);

      // Debugging: Log each article's sentiment score
      newsWithSentiment.forEach((article, index) => {
        console.log(`Article ${index + 1} Score: ${article.score}`);
      });

      // Map sentiment labels to numerical values
      const labelToValue = {
        positive: 1,
        neutral: 0,
        negative: -1,
      };

      // Calculate weighted sentiment scores
      const weightedScores = newsWithSentiment.map((article) => {
        const sentimentValue = labelToValue[article.sentiment.toLowerCase()] || 0;
        return sentimentValue * article.score;
      });

      // Calculate average sentiment score
      const totalWeightedScore = weightedScores.reduce((acc, curr) => acc + curr, 0);
      const averageScore = (totalWeightedScore / newsWithSentiment.length).toFixed(2);

      // Determine sentiment type based on average score
      let sentimentType = 'Neutral';
      if (averageScore > 0.1) {
        sentimentType = 'Positive';
      } else if (averageScore < -0.1) {
        sentimentType = 'Negative';
      }

      const sentimentData = {
        tickers: [symbol],
        news: newsWithSentiment,
        averageSentiment: {
          score: parseFloat(averageScore),
          type: sentimentType,
        },
      };

      // Cache the sentiment data
      stockCache.set(cacheKey, sentimentData);
      console.log(`Cache set for news sentiment: ${symbol}`);

      // Remove the promise from pendingPromises
      delete pendingPromises[cacheKey];
      console.log('News Sentiment Data:', sentimentData);
      return sentimentData;
    })();

    return await pendingPromises[cacheKey];
  } catch (error) {
    console.error(`Error fetching news sentiment for ${symbol}:`, error.message);
    // Remove the promise from pendingPromises in case of error
    delete pendingPromises[`news_sentiment_${symbol}`];
    // Return neutral sentiment if analysis fails
    return { tickers: [symbol], news: [], sentiment: { label: 'NEUTRAL', score: 0 } };
  }
};

export { searchSymbol, getRealTimeQuote, getDailyTimeSeries, getNewsSentiment };
