import { useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Header({
  theme, toggleTheme, view, setView, profFilter, setProfFilter, professionals, selectedDate, onPrev, onNext, allowAllProfessionals = true, onOpenAiAssistant
}) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Label para a visão semanal
  let dateLabel = ''
  if (view === 'semana') {
    const start = new Date(selectedDate)
    start.setDate(selectedDate.getDate() - selectedDate.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const startStr = start.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    const endStr = end.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    dateLabel = `${startStr} – ${endStr}`
  }

  // Label para a visão mensal
  let monthLabel = ''
  if (view === 'mes') {
    monthLabel = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  return (
    <header className="main-header">
      <div className="header-top-row">
        <div className="brand">
          <span className="brand-logo">B</span>
          <div>
            <h2>Bonyta Studio</h2>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Agenda Interna
            </span>
          </div>
        </div>
        <div className="header-actions">
          {onOpenAiAssistant && (
            <button
              type="button"
              onClick={onOpenAiAssistant}
              style={{
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                border: 'none',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
              }}
              title="Abrir Assistente de IA para alterar ou cancelar agendamentos (Ctrl+K)"
            >
              <span>🤖</span> IA
            </button>
          )}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Alternar tema">
            <i className={theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'} />
          </button>
          <button
            className="header-signout"
            type="button"
            onClick={() => supabase.auth.signOut()}
            aria-label="Sair da conta"
            title="Sair da conta"
          >
            <i className="fa-solid fa-arrow-right-from-bracket" />
          </button>
        </div>
      </div>

      {/* Seletor de visão */}
      <div className="view-switcher-container">
        <div className="view-switcher">
          {[
            { id: 'dia', label: 'Dia' },
            { id: 'semana', label: 'Semana' },
            { id: 'mes', label: 'Mês' }
          ].map((v) => (
            <button key={v.id} className={`switch-btn ${view === v.id ? 'active' : ''}`} onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navegador de período (Semana e Mês) */}
      {(view === 'semana' || view === 'mes') && (
        <div className="date-navigator-bar" style={{ padding: '0 4px 8px' }}>
          <button className="nav-arrow" onClick={onPrev} aria-label="Período anterior">
            <i className="fas fa-chevron-left" />
          </button>
          <h3 style={{ textTransform: 'capitalize', color: 'var(--accent-pink)', textAlign: 'center' }}>
            {view === 'semana' ? dateLabel : monthLabel}
          </h3>
          <button className="nav-arrow" onClick={onNext} aria-label="Próximo período">
            <i className="fas fa-chevron-right" />
          </button>
        </div>
      )}

      {/* Filtro de profissionais */}
      <div className="prof-tabs-scroller" style={{ padding: '2px 0 8px' }}>
        {view === 'dia' && allowAllProfessionals && (
          <button
            className={`prof-tab ${profFilter === 'todos' ? 'active' : ''}`}
            onClick={() => setProfFilter('todos')}
          >
            Todas
          </button>
        )}
        {professionals.map((p) => (
          <button
            key={p.id}
            className={`prof-tab ${profFilter === p.id ? 'active' : ''}`}
            onClick={() => setProfFilter(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>
    </header>
  )
}
