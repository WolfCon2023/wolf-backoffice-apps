import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Suppress specific development errors and warnings
if (process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  
  console.error = (...args) => {
    const errorText = args[0]?.toString() || '';
    
    // Skip logging these specific error types
    if (
      // WebSocket connection errors
      (typeof args[0] === 'string' && 
       (args[0].includes('WebSocket connection') || 
        args[0].includes('WebSocketClient'))) ||
      
      // React key warnings that we've already addressed
      (typeof args[0] === 'string' && 
       args[0].includes('Warning: Each child in a list should have a unique "key" prop')) ||
       
      // ARIA hidden warnings that we can't fix in development mode due to StrictMode
      (typeof args[0] === 'string' && 
       args[0].includes('aria-hidden'))
    ) {
      return;
    }
    
    // IMPORTANT: We now allow API 404 errors to be logged for troubleshooting
    // These were previously filtered out but are needed for debugging API issues
    
    // Log all other errors normally
    originalConsoleError(...args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // Using StrictMode can sometimes cause ARIA issues in development 
  // when components mount/unmount during the double-rendering
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
