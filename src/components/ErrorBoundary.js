import React from 'react';
import { Button } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';
import ErrorLogger from '../services/ErrorLogger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log the error
    ErrorLogger.logToFile(error, 'ErrorBoundary');
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReportError = () => {
    ErrorLogger.downloadLogs();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-content">
            <ErrorIcon className="error-icon" />
            <h1>Something went wrong</h1>
            <p>We apologize for the inconvenience. An unexpected error has occurred.</p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="error-details">
                <h3>Error Details:</h3>
                <pre>{this.state.error?.toString()}</pre>
                <h3>Component Stack:</h3>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </div>
            )}

            <div className="error-actions">
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={this.handleReportError}
              >
                Download Error Report
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 