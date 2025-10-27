/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */

'use client';

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console or error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            background: 'rgba(254, 242, 242, 0.5)',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <AlertCircle
            style={{
              width: '48px',
              height: '48px',
              color: '#ef4444',
              margin: '0 auto 1rem',
            }}
          />
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#374151',
              margin: '0 0 0.5rem',
            }}
          >
            Something went wrong
          </h3>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0 0 1.5rem',
              maxWidth: '400px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#dc2626';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#ef4444';
            }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for Error Boundary with common use cases
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
