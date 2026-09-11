import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
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
    console.error('[CustomerErrorBoundary] Caught rendering error:', error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[400px] flex items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full bg-white border border-[#F3E8DF] rounded-3xl p-8 shadow-xs space-y-5">
            <div className="w-14 h-14 bg-[#A94332]/10 border border-[#A94332]/20 rounded-2xl flex items-center justify-center mx-auto text-[#C85A3F]">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-extrabold text-[#202124] tracking-tight font-display">
                {this.props.fallbackTitle || 'Explore failed to load'}
              </h2>
              <p className="text-xs text-[#756B64] font-medium leading-relaxed max-w-sm mx-auto">
                {this.props.fallbackSubtitle || 'Something went wrong while opening restaurant discovery.'}
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-6 py-2.5 bg-[#C85A3F] hover:bg-[#A94332] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
