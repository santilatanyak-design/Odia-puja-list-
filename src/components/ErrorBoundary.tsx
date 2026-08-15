import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    try {
      console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    } catch {
      // Ignore logging failures in ultra-restrictive environments
    }
  }

  private handleReload = () => {
    try {
      window.location.reload();
    } catch {
      window.location.href = '/';
    }
  };

  private handleGoHome = () => {
    try {
      window.location.href = window.location.origin + window.location.pathname;
    } catch {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#FFFBF0] text-amber-950 flex flex-col items-center justify-center p-4 font-sans selection:bg-amber-200">
          <div className="max-w-md w-full bg-white border-2 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 border-2 border-amber-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
              🚩
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-black text-amber-950">
                ଜୟ ଜଗନ୍ନାଥ (Jay Jagannath)
              </h1>
              <p className="text-xs sm:text-sm text-amber-900/90 font-bold">
                ପୃଷ୍ଠା ଲୋଡ୍ ହେବାରେ ସାମାନ୍ୟ ସମସ୍ୟା ହୋଇଛି।
              </p>
              <p className="text-[11px] text-amber-800 font-medium">
                (A temporary issue occurred while loading this view on your browser.)
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                🔄 ପୁନଃ ଲୋଡ୍ (Refresh)
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-extrabold rounded-2xl text-xs transition border border-amber-400 cursor-pointer"
              >
                🏠 ମୁଖ୍ୟ ପୃଷ୍ଠା (Go Home)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
