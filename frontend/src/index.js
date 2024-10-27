// src/index.js

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Create a root element for rendering
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the application wrapped in BrowserRouter and React.StrictMode
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);