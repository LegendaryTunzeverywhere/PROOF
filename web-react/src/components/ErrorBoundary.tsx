import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function isDeployRefreshError(error: Error | null) {
  if (!error) return false;
  const message = error.message || '';
  return /Failed to fetch dynamically imported module|Loading chunk|ChunkLoadError|loading chunk/i.test(message);
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

  private handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isRefreshIssue = isDeployRefreshError(this.state.error);

      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f5f0ea] p-4 sm:p-6">
          <div className="w-full max-w-[560px] rounded-[28px] border border-[#d65b4d] bg-[#f3d9d3] p-6 shadow-[0_10px_26px_rgba(90,57,51,0.12)] sm:p-8">
            <div className="mb-5 flex justify-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#f5b302] text-3xl shadow-inner shadow-[#d89e00]/40">
                ⚠
              </div>
            </div>

            <h1 className="text-center text-3xl font-extrabold tracking-[-0.04em] text-[#d65145] sm:text-4xl">
              {isRefreshIssue ? 'The app just updated' : 'Something went wrong'}
            </h1>

            <p className="mt-4 text-center text-base leading-7 text-[#7d4b45]">
              {isRefreshIssue
                ? 'A fresh version is available. Refreshing now will load the latest content and keep your place in the app.'
                : 'This page could not be loaded. You can refresh the app or return to your learning path.'}
            </p>

            {this.state.error && (
              <details className="mt-5 rounded-xl border border-[#e3b5ad] bg-[#f8efe9] p-3 text-left">
                <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.08em] text-[#6b4b46]">
                  More details
                </summary>
                <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-[#6e564f]">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={this.handleRefresh}
                className="flex-1 rounded-xl bg-[#d94d3f] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#c94438]"
              >
                {isRefreshIssue ? 'Refresh now' : 'Try again'}
              </button>
              <a
                href="/learn"
                className="flex-1 rounded-xl border border-[#d8c7bf] bg-[#f7f2ee] px-4 py-3 text-center text-sm font-semibold text-[#2a2422] transition-colors hover:bg-[#f1ebea]"
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
