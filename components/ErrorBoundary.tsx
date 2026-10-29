import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f0', padding: '20px', fontFamily: 'sans-serif' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e2da', padding: '30px', maxWidth: '500px', width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <span style={{ color: '#df705e', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>FASHIONHUB RECOVERY</span>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', margin: '10px 0 15px', color: '#20251f' }}>This page took a brief detour.</h2>
            <p style={{ color: '#73776e', fontSize: '13px', lineHeight: '1.6', margin: '0 0 20px' }}>
              We encountered an unexpected display error. Your session and data remain safe.
            </p>
            {this.state.error?.message && (
              <div style={{ background: '#f7e6e1', color: '#813d33', padding: '10px 12px', fontSize: '11px', marginBottom: '20px', overflowX: 'auto' }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
                style={{ background: '#315039', color: '#fff', border: 0, padding: '10px 16px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
              >
                Return to Marketplace
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{ background: 'transparent', color: '#315039', border: '1px solid #315039', padding: '10px 16px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
