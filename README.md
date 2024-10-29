# AI Chatbot Application

![Tech Stack](https://img.shields.io/badge/Tech%20Stack-React%20%7C%20Node.js%20%7C%20Firebase%20%7C%20OpenAI%20%7C%20Google%20Gemini%20%7C%20Hugging%20Face%20%7C%20Milvus%20%7C%20Yahoo%20Finance%20%7C%20Firebase%20Firestore-000000?style=for-the-badge)

An AI-powered chatbot application featuring multiple assistants:

- **AI Customer Support Assistant**
- **Financial Planning Assistant**
- **Stock Market Assistant**

## Table of Contents

- [Features](#features)
- [Live App](#live-app)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Deployment](#deployment)
  - [Backend Deployment on Render](#backend-deployment-on-render)
  - [Frontend Deployment on Vercel](#frontend-deployment-on-vercel)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Features

- **AI Customer Support**: Provides assistance for banking-related queries.
- **Financial Planning Assistant**: Helps users plan their finances with expert advice and tools.
- **Stock Market Assistant**: Offers real-time stock data and market insights.
- **User Authentication**: Secure login and registration using Firebase Authentication.
- **Chat History**: Stores user conversations using Firebase Firestore.
- **Suggested Prompts**: Recommends follow-up questions based on the conversation context.
- **Rate Limiting**: Prevents abuse by limiting the number of requests per IP.
- **Error Handling**: Gracefully handles errors and provides user-friendly messages.
- **Progressive Web App**: Optimized for performance and can function offline.

## Live App

[Link to Vercel app](https://ai-customer-support-woad.vercel.app/)

## Tech Stack

### Frontend

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Material-UI](https://img.shields.io/badge/Material--UI-0081CB?style=flat&logo=material-ui&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-00C7B7?style=flat-square&logo=openai)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=flat&logo=google&logoColor=white)
![Yahoo Finance API](https://img.shields.io/badge/Yahoo%20Finance-720E9E?style=flat&logo=yahoo&logoColor=white)
![Hugging Face](https://img.shields.io/badge/Hugging%20Face-FFD54F?style=flat&logo=hugging-face&logoColor=black)

### Database & Authentication

![Firebase Firestore](https://img.shields.io/badge/Firebase%20Firestore-FFCA28?style=flat&logo=firebase&logoColor=black)
![Firebase Authentication](https://img.shields.io/badge/Firebase%20Auth-FFCA28?style=flat&logo=firebase&logoColor=black)
![Milvus](https://img.shields.io/badge/Milvus-039BE5?style=flat&logo=milvus&logoColor=white)

## Project Structure

```plaintext
ai-chatbot-application/
├── backend/
│   ├── app.js
│   ├── index.js
│   ├── config/
│   │   └── env.js
│   ├── routes/
│   │   ├── chat.js
│   │   └── suggestedPrompts.js
│   ├── services/
│   │   ├── openaiService.js
│   │   ├── stockService.js
│   │   └── milvusService.js
│   ├── middlewares/
│   │   └── errorHandler.js
│   └── utils/
│       ├── logger.js
│       └── retry.js
├── frontend/
│   ├── public/
│   │   └── images/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chatbot.js
│   │   │   ├── ChatbotSelection.js
│   │   │   └── FinancialForm.js
│   │   ├── firebase.js
│   │   ├── App.js
│   │   └── index.js
│   └── README.md
├── README.md
└── package.json
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase Account: For authentication and Firestore.
- API Keys:
  - [OpenAI API Key](https://platform.openai.com/api-keys)
  - [Google Gemini API Key](https://aistudio.google.com/app/apikey)
  - [Hugging Face API Token](https://huggingface.co/settings/tokens)
  - [Milvus Address and Token](https://zilliz.com/blog/getting-started-zilliz-rest-api)

### Backend Setup

1. **Navigate to the Backend Directory**

   ```bash
   cd backend
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

### Frontend Setup

1. **Navigate to the Frontend Directory**

   ```bash
   cd frontend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Firebase**

   In `src/firebase.js`, replace the Firebase configuration with your own:

   ```javascript
   // frontend/src/firebase.js

   import { initializeApp } from 'firebase/app'
   import { getAuth } from 'firebase/auth' // For Authentication
   import { getFirestore } from 'firebase/firestore' // Firestore

   // Your web app's Firebase configuration
   const firebaseConfig = {
     apiKey: 'your_firebase_api_key',
     authDomain: 'your_firebase_auth_domain',
     projectId: 'your_project_id',
     storageBucket: 'your_storage_bucket',
     messagingSenderId: 'your_messaging_sender_id',
     appId: 'your_app_id',
     measurementId: 'your_measurement_id'
   }

   // Initialize Firebase
   const app = initializeApp(firebaseConfig)

   // Initialize Firebase services you need
   const auth = getAuth(app)
   const firestore = getFirestore(app)

   // Export the Firebase services so they can be used in the app
   export { auth, firestore }
   ```

   **Note**: Do not share your Firebase API key publicly.

4. **Run the Frontend Server**

   ```bash
   npm start
   ```

   The frontend server should now be running on `http://localhost:3000`.

## Deployment

### Backend Deployment on Render

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

### Frontend Deployment on Vercel

[Vercel](https://vercel.com) is a cloud platform for static sites and Serverless Functions that fits perfectly with frontend frameworks like React.

1. **Create an Account on Vercel**

   Sign up for a free account on Vercel.

2. **Import Your Project**

- Click on New Project in the Vercel dashboard.
- Import your GitHub repository containing the `frontend` directory.

3. **Configure Build Settings**

- Set the Root Directory to the `frontend` folder.
- Vercel will automatically detect that it's a Create React App project.
- Ensure that the Build Command is `npm run build` and the Output Directory is `build`.

4. **Set Environment Variables**

   In the **Environment Variables** section, add:

   ```bash
   REACT_APP_API_URL=https://your-backend.onrender.com
   ```

   **Note**: Replace `https://your-backend.onrender.com` with your actual Render backend URL.

5. **Deploy**

- Click **Deploy**.
- Vercel will build and deploy your frontend application.
- Once deployed, your frontend will be accessible via the provided Vercel URL (e.g., `https://your-frontend.vercel.app`).

6. **Continuous Deployment**

   Vercel automatically sets up continuous deployment. Any changes pushed to the connected GitHub repository will trigger a new deployment.

## Usage

1. **Open the Application**

   Navigate to your deployed frontend URL (e.g., `https://your-frontend.vercel.app`) in your web browser.

2. **Sign In / Register**

   Use Google Sign-In or Email/Password to create an account.

3. **Select a Chatbot**

   Choose from AI Customer Support, Financial Planning Assistant, or Stock Market Assistant.

4. **Start Chatting**

- Interact with the chatbot by typing your queries.
- For the Financial Planning Assistant, input your financial details to calculate the required interest rate.
- For the Stock Market Assistant, enter the stock symbol to get real-time data.

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Repository**

2. **Create a New Branch**

   ```bash
   git checkout -b feature/YourFeature
   ```

3. **Commit Your Changes**

   ```bash
   git commit -m "Add a new feature"
   ```

4. **Push to the Branch**

   ```bash
   git push origin feature/YourFeature
   ```

5. **Open a Pull Request**

   Describe your changes and submit the PR.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [OpenAI](https://openai.com)
- [Google Gemini](https://aistudio.google.com)
- [Hugging Face](https://huggingface.co)
- [Yahoo Finance API](https://finance.yahoo.com)
- [Firebase](https://firebase.google.com)
- [Milvus](https://milvus.io)
- [Zilliz](https://zilliz.com)
- [Node.js](https://nodejs.org)
- [React](https://reactjs.org)
- [Express.js](https://expressjs.com)
- [Create React App](https://create-react-app.dev)
- [Material-UI](https://material-ui.com)
- [Render](https://render.com)
- [Vercel](https://vercel.com)
