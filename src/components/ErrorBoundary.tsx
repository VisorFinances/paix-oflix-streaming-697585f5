import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-display text-foreground">Algo deu errado</h1>
          <p className="text-muted-foreground text-sm max-w-md">
            {this.state.error?.message || 'Erro inesperado. Tente recarregar a página.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-80 transition"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
