// backend/routes/suggestedPrompts.js

import express from 'express';
import { generateSuggestedPrompts } from '../services/openaiService.js';

const router = express.Router();

/**
 * Route to handle suggested prompts requests
 */
router.post('/', async (req, res) => {
  console.log('Received /api/suggested-prompts request:', req.body);
  const { context, chatbot } = req.body;

  if (!chatbot) {
    return res.status(400).json({ error: 'Chatbot type is required.' });
  }

  try {
    // Generate suggestions using OpenAI's GPT-4 model
    const prompts = await generateSuggestedPrompts(context, chatbot);
    console.log('Generated prompts:', prompts);
    res.json({ prompts });
  } catch (error) {
    console.error('Error generating suggested prompts:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
