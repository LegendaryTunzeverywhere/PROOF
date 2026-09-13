import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/home';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-app p-6">
          <div className="w-full max-w-md rounded-2xl border border-bad bg-bad-soft p-8 text-center shadow-lg">
            <div className="mb-4 text-5xl">⚠️</div>
            <h1 className="mb-3 text-2xl font-bold text-bad">Something went wrong</h1>
            <p className="mb-2 text-sm text-bad">
              This lesson could not be displayed. You can try the lesson again or return to your learning paths.
            </p>
            {this.state.error && (
              <details className="mt-4 rounded-lg bg-elevated p-3 text-left">
                <summary className="cursor-pointer text-xs font-semibold text-muted">
                  Error details
                </summary>
                <pre className="mt-2 overflow-auto text-[10px] text-faint">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 rounded-lg bg-bad px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bad-deep"
              >
                Try again
              </button>
              <a
                href="/learn"
                className="flex-1 rounded-lg border border-line bg-surface px-4 py-2.5 text-center text-sm font-semibold text-ink transition-colors hover:bg-elevated"
              >
                Back to learning
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
