import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Shield } from 'lucide-react';

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

class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `admin-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      errorId: `admin-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    // Log error to admin monitoring system
    this.logErrorToAdminSystem(error, errorInfo);
  }

  logErrorToAdminSystem = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('userId'),
        sessionId: localStorage.getItem('sessionId')
      };

      // Send to admin error logging endpoint
      const response = await fetch('/api/admin/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Session-ID': localStorage.getItem('sessionId') || ''
        },
        body: JSON.stringify(errorData)
      });

      if (response.ok) {
        console.log('✅ Admin error logged successfully');
      } else {
        console.warn('⚠️ Failed to log admin error to server');
      }
    } catch (logError) {
      console.error('Failed to log admin error:', logError);
      // Log locally for demo purposes
      console.log('📝 Admin Error (Demo Mode):', {
        message: error.message,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString()
      });
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  handleReportError = async () => {
    try {
      const reportData = {
        errorId: this.state.errorId,
        userDescription: (document.getElementById('error-description') as HTMLTextAreaElement)?.value || '',
        reproductionSteps: (document.getElementById('reproduction-steps') as HTMLTextAreaElement)?.value || ''
      };

      const response = await fetch('/api/admin/report-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Session-ID': localStorage.getItem('sessionId') || ''
        },
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        alert('Error report submitted successfully. Our team will investigate this issue.');
      } else {
        console.log('📝 Error Report (Demo Mode):', reportData);
        alert('Error report logged locally (Demo Mode). In production, this would be sent to the development team.');
      }
    } catch (error) {
      console.error('Failed to submit error report:', error);
      console.log('📝 Error Report (Demo Mode):', {
        errorId: this.state.errorId,
        userDescription: (document.getElementById('error-description') as HTMLTextAreaElement)?.value || '',
        reproductionSteps: (document.getElementById('reproduction-steps') as HTMLTextAreaElement)?.value || ''
      });
      alert('Error report logged locally (Demo Mode). In production, this would be sent to the development team.');
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            {/* Error Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Admin Panel Error
              </h1>
              <p className="text-gray-600 mb-4">
                Something went wrong in the admin panel. This error has been logged for investigation.
              </p>
              <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700">
                <strong>Error ID:</strong> {this.state.errorId}
              </div>
            </div>

            {/* Error Details (Development Mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6">
                <details className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold text-red-800 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="text-sm text-red-700 space-y-2">
                    <div>
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Error Reporting Form */}
            <div className="mb-6 space-y-4">
              <div>
                <label htmlFor="error-description" className="block text-sm font-medium text-gray-700 mb-2">
                  What were you trying to do when this error occurred?
                </label>
                <textarea
                  id="error-description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe what you were doing when the error occurred..."
                />
              </div>
              <div>
                <label htmlFor="reproduction-steps" className="block text-sm font-medium text-gray-700 mb-2">
                  Steps to reproduce (optional)
                </label>
                <textarea
                  id="reproduction-steps"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="1. Click on...\n2. Navigate to...\n3. Error occurred when..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={this.handleReportError}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                <AlertTriangle className="w-4 h-4" />
                Report Error
              </button>
              
              <button
                onClick={() => window.location.href = '/admin-dashboard'}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                <Home className="w-4 h-4" />
                Back to Store
              </button>
            </div>

            {/* Additional Help */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                If this error persists, please contact the system administrator with the Error ID above.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
