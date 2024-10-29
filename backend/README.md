# Backend - AI Chatbot Application

![Node.js](https://img.shields.io/badge/Node.js-14.x-green?style=flat-square&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey?style=flat-square&logo=express)
![OpenAI](https://img.shields.io/badge/OpenAI-00C7B7?style=flat-square&logo=openai)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=flat-square&logo=google&logoColor=white)
![Yahoo Finance API](https://img.shields.io/badge/Yahoo%20Finance-720094?style=flat-square&logo=yahoo)
![Hugging Face](https://img.shields.io/badge/Hugging%20Face-FFD54F?style=flat&logo=hugging-face&logoColor=black)
![Milvus](https://img.shields.io/badge/Milvus-FF6F61?style=flat-square&logo=milvus)

## Introduction

The backend is built with **Node.js** and **Express.js**, handling API requests, integrating with external services, and processing data for the AI Chatbot Application.

## Features

- **API Endpoints**:
  - `POST /api/chat`: Handles chat requests and generates AI responses.
  - `POST /api/suggested-prompts`: Generates suggested prompts based on conversation context.
- **Authentication**: Secures API endpoints with environment variables and rate limiting.
- **External Integrations**:
  - **OpenAI**: For generating AI responses.
  - **Google Gemini**: Fallback AI model if OpenAI fails.
  - **Yahoo Finance API**: Fetches real-time stock data.
  - **Hugging Face API**: For embedding generation and sentiment analysis.
  - **Milvus**: Vector database for similarity searches.
- **Middleware**:
  - **CORS**: Enables Cross-Origin Resource Sharing.
  - **Rate Limiting**: Prevents abuse by limiting requests per IP.
  - **Error Handling**: Gracefully handles errors and logs them.

## Setup

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **API Keys**:
  - [OpenAI API Key](https://platform.openai.com/account/api-keys)
  - [Google Gemini API Key](https://developers.generativeai.google/guide/api_key)
  - [Hugging Face API Token](https://huggingface.co/settings/tokens)
  - [Milvus Address and Token](https://milvus.io/docs/overview.md)
  - [Yahoo Finance API](https://www.yahoofinanceapi.com/) (optional)

### Installation Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/ai-chatbot-application.git
   cd ai-chatbot-application/backend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the `backend` directory with the following content:

   ```bash
   PORT=8080
   OPENAI_API_KEY=your_openai_api_key
   GEMINI_API_KEY=your_google_gemini_api_key
   HUGGINGFACE_API_TOKEN=your_hugging_face_api_token
   MILVUS_ADDRESS=your_milvus_address
   MILVUS_TOKEN=your_milvus_token
   ```

   **Note**: Replace the placeholders with your actual API keys and tokens.

4. **Run the Backend Server**

   ```bash
   npm start
   ```

   The backend server should now be running on `http://localhost:8080`.

## API Endpoints

1. `POST /api/chat`

   Handles chat requests and generates AI responses based on user input.

   - Request Body:

   ```json
   {
     "prompt": "User's message",
     "context": "Conversation history",
     "generateTitle": true,
     "chatbot": "ai-customer-support",
     "interestRate": null
   }
   ```

   - Response

   ```json
   {
     "message": "AI's response",
     "title": "Generated Chat Title"
   }
   ```

2. `POST /api/suggested-prompts`

   Generates suggested prompts based on the conversation context.

   - Request Body:

   ```json
   {
     "context": "Conversation history",
     "chatbot": "financial-planning"
   }
   ```

   - Response

   ```json
   {
     "prompts": ["Suggested prompt 1",
     "Suggested prompt 2",
     "..."
     ]
   }
   ```

## Services

### OpenAI Service

Handles interactions with the OpenAI API for generating AI responses and suggested prompts.

- Functions:
    - `generateChatTitle`: Generates a chat title based on the conversation context.
    - `generateResponseWithAI`: Generates an AI response using the OpenAI API.
    - `generateSuggestedPrompts`: Generates suggested prompts based on the conversation context.
    - `generateQueryEmbedding`: Generates an embedding for a given query using the Hugging Face API.

### Google Gemini Service

Provides a fallback AI model for generating responses if the OpenAI API fails.

### Stock Service

Fetches real-time stock data from Yahoo Finance and performs sentiment analysis using Hugging Face's API.

- Functions:
    - `searchSymbol`: Searches for a stock symbol based on the company name.
    - `getRealTimeQuote`: Fetches real-time stock data for a given symbol.
    - `getDailyTimeSeries`: Fetches daily stock data for a given symbol for a specified date range.
    - `getNewsSentiment`: Analyzes the sentiment of news articles related to a stock.

### Milvus Service

Performs similarity searches using Milvus, a vector database optimized for handling embeddings.

- Functions:
    - `searchMilvus`: Searches for similar embeddings in the Milvus database.

## Middleware
- **CORS**: Enables Cross-Origin Resource Sharing to allow the frontend to communicate with the backend.
- **Rate Limiting**: Limits the number of requests per IP to prevent abuse.
- **Error Handling**: Captures and logs errors, sending user-friendly messages to the frontend.

## Utilities
- **Logger**: Uses Winston for logging errors and important information.
- **Retry Mechanism**: Implements exponential backoff for retrying failed API requests.

## Project Structure

```plaintext
backend/
├── app.js
├── index.js
├── config/
│   └── env.js
├── routes/
│   ├── chat.js
│   └── suggestedPrompts.js
├── services/
│   ├── openaiService.js
│   ├── stockService.js
│   └── milvusService.js
├── middlewares/
│   └── errorHandler.js
└── utils/
    ├── logger.js
    └── retry.js
```

## Error Handling
All errors are caught and handled gracefully using the `errorHandler` middleware. Errors are logged using Winston and a generic error message is sent to the frontend to avoid exposing sensitive information.

## Security
- **Environment Variables**: All sensitive information like API keys and tokens are stored securely using environment variables.
- **Rate Limiting**: Prevents abuse by limiting the number of requests per IP address.
- **CORS**: Configured to allow requests only from trusted origins.

## Testing
Run the test suite using:

```bash
npm test
```

**Note**: Ensure to write tests for all critical functionalities to maintain code quality.

## Deployment on Render

[Render](https://render.com) is a cloud platform that allows you to deploy web applications easily.

1. **Create an Account on Render**

   Sign up for a free account on Render.

2. **Create a New Web Service**

- Navigate to the Render dashboard.
- Click on **New** and select **Web Service**.
- Connect your GitHub repository and select the `backend` directory.

3. **Configure Environment Variables**

   In the Environment section, add the following variables:

   ```bash
     PORT=8080
     OPENAI_API_KEY=your_openai_api_key
     GEMINI_API_KEY=your_google_gemini_api_key
     HUGGINGFACE_API_TOKEN=your_hugging_face_api_token
     MILVUS_ADDRESS=your_milvus_address
     MILVUS_TOKEN=your_milvus_token
   ```

4. **Build and Deploy**

- Render will automatically detect the `npm start` script.
- Click Create Web Service to begin the deployment.
- Once deployed, your backend will be accessible via the provided Render URL (e.g., https://your-backend.onrender.com).

5. **Update Frontend API URL**

   In the frontend's .env file or environment settings on Vercel, set the REACT_APP_API_URL to your Render backend URL.

   ```bash
   REACT_APP_API_URL=https://your-backend.onrender.com
   ```

## License
This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for more information.

## Acknowledgements

- [OpenAI](https://openai.com)
- [Google Gemini](https://aistudio.google.com)
- [Hugging Face](https://huggingface.co)
- [Yahoo Finance API](https://finance.yahoo.com)
- [Milvus](https://milvus.io)
- [Zilliz](https://zilliz.com)
- [Node.js](https://nodejs.org)
- [Render](https://render.com)