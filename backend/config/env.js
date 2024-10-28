// backend/config/env.js

import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'PORT',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'MILVUS_ADDRESS',
  'MILVUS_TOKEN',
  'HUGGINGFACE_API_TOKEN',
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Error: Missing required environment variable ${varName}`);
    process.exit(1);
  }
});

export default {
  port: process.env.PORT,
  openaiApiKey: process.env.OPENAI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  milvusAddress: process.env.MILVUS_ADDRESS,
  milvusToken: process.env.MILVUS_TOKEN,
  huggingFaceApiToken: process.env.HUGGINGFACE_API_TOKEN,
};
