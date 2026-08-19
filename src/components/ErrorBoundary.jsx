import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#0f0f14',
          color: '#ffffff',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '420px',
            width: '100%',
            background: '#171721',
            border: '1px solid #2a2a3c',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ fontSize: '2.4rem', color: '#e91e63', marginBottom: '12px' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 800 }}>
              Ops! Ocorreu um erro
            </h3>
            <p style={{ color: '#8e8e9a', fontSize: '0.85rem', margin: '0 0 16px', lineHeight: 1.4 }}>
              Não se preocupe, seus dados estão seguros. Clique no botão abaixo para recarregar a tela.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #e91e63, #c2185b)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(233, 30, 99, 0.4)'
              }}
            >
              Recuperar tela
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
