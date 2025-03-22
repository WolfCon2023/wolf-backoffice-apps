import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Suppress only WebSocket connection errors in development
// This will hide the noisy connection errors but keep API errors visible
if (process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && 
        (args[0].includes('WebSocket connection') || 
         args[0].includes('WebSocketClient'))) {
      // Skip logging WebSocket errors
      return;
    }
    originalConsoleError(...args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
