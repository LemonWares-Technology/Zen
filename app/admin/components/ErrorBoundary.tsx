"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Here you could send error to logging service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you would send this to your error tracking service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId,
    };

    console.error("Error Report:", errorReport);
    
    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, { extra: errorReport });
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl w-full">
            <div className="bg-white shadow-xl rounded-2xl border border-red-200 p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Something went wrong
                </h1>
                <p className="text-gray-600">
                  We're sorry, but something unexpected happened. Our team has been notified.
                </p>
              </div>

              {/* Error Details */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <div className="flex items-center mb-4">
                  <Bug className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Error Details
                  </h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Error ID:</span>
                    <span className="ml-2 font-mono text-gray-800 bg-gray-200 px-2 py-1 rounded">
                      {this.state.errorId}
                    </span>
                  </div>
                  
                  {this.state.error && (
                    <div>
                      <span className="font-medium text-gray-600">Message:</span>
                      <p className="mt-1 text-red-700 font-mono text-xs bg-red-50 p-2 rounded">
                        {this.state.error.message}
                      </p>
                    </div>
                  )}
                  
                  {process.env.NODE_ENV === "development" && this.state.error?.stack && (
                    <div>
                      <span className="font-medium text-gray-600">Stack Trace:</span>
                      <pre className="mt-1 text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Go Home
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  If this problem persists, please contact support with the Error ID above.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error("Error caught by useErrorHandler:", error, errorInfo);
    
    // In a real app, you might want to show a toast or send to error service
    // showError("An error occurred", error.message);
  };
}
