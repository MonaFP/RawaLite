import {Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * 🛡️ Global Error Boundary for RawaLite
 * 
 * Fängt unerwartete React-Rendering-Fehler ab und zeigt eine
 * benutzerfreundliche Fehlermeldung anstatt einer weißen Seite.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('🚨 Global Error Boundary caught an error:', error);
    console.error('📊 Error Info:', errorInfo);
    
    // Update state with detailed error info
    this.setState({
      error,
      errorInfo
    });
    
    // In production, you might want to send this to a logging service
    // LoggingService.logError('React Error Boundary', error, errorInfo);
  }

  private handleReload = () => {
    // Reset error state and reload the component tree
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    
    // Force a complete reload if the error persists
    if (this.state.hasError) {
      window.location.reload();
    }
  };

  private handleRestart = async () => {
    try {
      // Try to restart the Electron app if available
      if (window.rawalite?.app?.restart) {
        await window.rawalite.app.restart();
      } else {
        // Fallback to page reload
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to restart app:', err);
      window.location.reload();
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
        <div style={{
          padding: '2rem',
          maxWidth: '600px',
          margin: '2rem auto',
          textAlign: 'center',
          fontFamily: '"Roboto", sans-serif',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⚠️</div>
          
          <h1 style={{ 
            color: '#d32f2f', 
            marginBottom: '1rem',
            fontSize: '1.5rem',
            fontWeight: 500
          }}>
            Unerwarteter Fehler
          </h1>
          
          <p style={{ 
            color: '#666', 
            marginBottom: '1.5rem',
            lineHeight: 1.6
          }}>
            RawaLite ist auf einen unerwarteten Fehler gestoßen. 
            Ihre Daten sind sicher gespeichert.
          </p>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                marginRight: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              Neu laden
            </button>
            
            <button
              onClick={this.handleRestart}
              style={{
                backgroundColor: '#388e3c',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              App neu starten
            </button>
          </div>
          
          {/* Development error details */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ 
              textAlign: 'left', 
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                🔍 Fehlerdetails (Development)
              </summary>
              <div style={{ color: '#d32f2f', marginBottom: '0.5rem' }}>
                <strong>Fehler:</strong> {this.state.error.name}: {this.state.error.message}
              </div>
              <div style={{ color: '#666' }}>
                <strong>Stack:</strong>
                <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                  {this.state.error.stack}
                </pre>
              </div>
              {this.state.errorInfo && (
                <div style={{ color: '#666', marginTop: '0.5rem' }}>
                  <strong>Component Stack:</strong>
                  <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </details>
          )}
          
          <div style={{ 
            marginTop: '1.5rem', 
            fontSize: '12px', 
            color: '#999',
            borderTop: '1px solid #eee',
            paddingTop: '1rem'
          }}>
            RawaLite v1.6.0 - Wenn das Problem weiterhin besteht, 
            prüfen Sie die Entwicklerkonsole für weitere Details.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
