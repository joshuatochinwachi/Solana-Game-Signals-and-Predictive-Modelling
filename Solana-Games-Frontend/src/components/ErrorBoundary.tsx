import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-bg-primary p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-risk-high/10 border border-risk-high rounded-lg p-6">
                            <h1 className="text-2xl font-bold text-risk-high mb-4">Something went wrong</h1>
                            <details className="whitespace-pre-wrap text-sm">
                                <summary className="cursor-pointer text-text-primary mb-2">Error details</summary>
                                <div className="bg-bg-tertiary p-4 rounded mt-2 overflow-auto">
                                    <p className="text-risk-high font-mono mb-2">{this.state.error && this.state.error.toString()}</p>
                                    <p className="text-text-secondary font-mono text-xs">{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
                                </div>
                            </details>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-4 py-2 bg-solana-purple text-white rounded-lg hover:bg-solana-purple/80 transition-colors"
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
