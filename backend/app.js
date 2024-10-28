// backend/app.js

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from './config/env.js';
import chatRoutes from './routes/chat.js';
import suggestedPromptsRoutes from './routes/suggestedPrompts.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});

app.use(limiter);

// Mount routes
app.use('/api/chat', chatRoutes);
app.use('/api/suggested-prompts', suggestedPromptsRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.send('Chatbot API is running.');
});

// Error Handling Middleware
app.use(errorHandler);

export default app;
