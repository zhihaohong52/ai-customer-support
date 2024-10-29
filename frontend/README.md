# Frontend - AI Chatbot Application

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Material-UI](https://img.shields.io/badge/Material--UI-0081CB?style=flat&logo=material-ui&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)

This directory contains the frontend code for the AI Chatbot application. The frontend is built using React and interacts with the backend API to provide a user-friendly chat interface for interacting with AI assistants.

## Table of Contents

- [Getting Started with Create React App](#getting-started-with-create-react-app)
  - [Available Scripts](#available-scripts)
  - [Learn More](#learn-more)
    - [Code Splitting](#code-splitting)
    - [Analyzing the Bundle Size](#analyzing-the-bundle-size)
    - [Making a Progressive Web App](#making-a-progressive-web-app)
    - [Advanced Configuration](#advanced-configuration)
    - [Deployment](#deployment)
    - [npm run build fails to minify](#npm-run-build-fails-to-minify)
- [Project-Specific Information](#project-specific-information)
  - [Features](#features)
  - [Getting Started](#getting-started)
  - [Environment Variables](#environment-variables)
  - [Deployment on Vercel](#deployment-on-vercel)
  - [Folder Structure](#folder-structure)
  - [Styling](#styling)
  - [Firebase Integration](#firebase-integration)
  - [Accessibility](#accessibility)

## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

#### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

#### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

### Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

#### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

#### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

#### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

#### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

#### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

#### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Project-Specific Information

### Features

- **User Authentication**: Secure login and registration using Firebase Authentication.
- **Chatbot Selection**: Choose between different AI assistants tailored to your needs.
- **Chat Interface**: Interact with AI assistants in a user-friendly chat interface.
- **Financial Planning**: Input financial details to calculate required interest rates.
- **Stock Market Insights**: Get real-time stock data and market analysis.
- **Responsive Design**: Optimized for both desktop and mobile devices.

### Getting Started

After setting up the backend and configuring Firebase as mentioned in the root `README.md`, follow these steps to get the frontend up and running:

1. **Navigate to the Frontend Directory**

   ```bash
   cd frontend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. Configure Firebase

   Update `src/firebase.js` with your Firebase project credentials.

4. Run the Application

   ```bash
   npm start
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### Environment Variables

Ensure that the following environment variables are set in your .env file within the frontend directory:

```bash
REACT_APP_API_URL=https://your-backend.onrender.com
```

**Note**: Replace https://your-backend.onrender.com with your backend server URL if it's different.

### Deployment on Vercel

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

### Folder Structure

```plaintext
frontend/
├── public/
│   └── images/
├── src/
│   ├── components/
│   │   ├── Chatbot.js
│   │   ├── ChatbotSelection.js
│   │   └── FinancialForm.js
│   ├── firebase.js
│   ├── App.js
│   ├── index.js
│   ├── App.css
│   └── Chatbot.css
├── README.md
└── package.json
```

### Styling

The frontend uses [Material-UI](https://material-ui.com) components for styling. Material-UI is a popular React UI framework that provides a wide range of components and themes for building modern web applications.

### Firebase Integration

- **Authentication**: Managed using Firebase Authentication.
- **Firestore**: Stores user chat histories and related data.

### Accessibility

The application follows accessibility best practices, including:

- **ARIA Labels**: For interactive elements.
- **Responsive Design**: Ensures usability across different devices and screen sizes.

## License
This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for more information.

## Acknowledgements

- [Firebase](https://firebase.google.com)
- [Express.js](https://expressjs.com)
- [Create React App](https://create-react-app.dev)
- [Material-UI](https://material-ui.com)
- [React](https://reactjs.org)
- [Vercel](https://vercel.com)