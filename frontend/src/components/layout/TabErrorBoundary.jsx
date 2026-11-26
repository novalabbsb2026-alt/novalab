import React from 'react';

class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erro na renderização da aba:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.activeTab !== this.props.activeTab && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="glass-panel"
          style={{
            padding: '36px',
            textAlign: 'center',
            margin: '30px auto',
            maxWidth: '650px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.05)',
          }}
        >
          <div style={{ color: '#ef4444', marginBottom: '14px', fontSize: '2.4rem' }}>⚠️</div>
          <h3 style={{ margin: '0 0 10px 0', color: 'hsl(var(--text-primary))', fontSize: '1.2rem', fontWeight: 800 }}>
            Ocorreu um erro ao carregar esta tela
          </h3>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.88rem', marginBottom: '18px', lineHeight: 1.5 }}>
            {this.state.error?.message || 'Erro inesperado de renderização no componente.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={() => this.setState({ hasError: false, error: null })}>
              Tentar Novamente
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => this.props.onReset?.()}>
              Voltar ao Início
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default TabErrorBoundary;
