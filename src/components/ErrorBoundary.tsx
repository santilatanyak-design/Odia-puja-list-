import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
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
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-xl mx-auto my-12 p-6 bg-amber-50 border-2 border-amber-300 rounded-3xl text-center space-y-4 shadow-lg">
          <div className="w-12 h-12 bg-amber-200 text-amber-900 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <h3 className="text-lg font-black text-amber-950">
            {this.props.fallbackTitle || 'ପୃଷ୍ଠା ଲୋଡ୍ କରିବାରେ ସାମୟିକ ସମସ୍ୟା ହୋଇଛି'}
          </h3>
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            କିଛି ସମୟ ପରେ ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ କିମ୍ବା ମୁଖ୍ୟ ପୃଷ୍ଠାକୁ ଫେରିଯାଆନ୍ତୁ।
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ (Retry)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
