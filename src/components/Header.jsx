import { useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Header({
  theme, toggleTheme, view, setView, profFilter, setProfFilter, professionals, selectedDate, onPrev, onNext
}) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Formatação apenas para a Visão Semanal
  let dateLabel = '';
  if (view === 'semana') {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    dateLabel = `Semana de ${start.getDate()} de ${start.toLocaleDateString('pt-BR', { month: 'short' })}`;
  }

  return (
    <header className="main-header">
      <div className="header-top-row">
        <div className="brand">
          <span className="brand-logo">B</span>
          <h2>Bonyta Studio</h2>
        </div>
        <div className="header-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Alternar tema">
            <i className={theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'}></i>
          </button>
          <button className="header-signout" type="button" onClick={() => supabase.auth.signOut()} aria-label="Sair da conta" title="Sair da conta">
            <i className="fa-solid fa-arrow-right-from-bracket" />
          </button>
        </div>
      </div>

      {/* 1. SELETOR DE VISÃO (Fixo no topo da navegação) */}
      <div className="view-switcher-container">
        <div className="view-switcher">
          {['dia', 'semana', 'mes'].map((v) => (
            <button key={v} className={`switch-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
              {v === 'dia' ? 'Dia' : v === 'semana' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. NAVEGADOR DE DATAS (Aparece APENAS na Semana, logo abaixo da visão) */}
      {view === 'semana' && (
        <div className="date-navigator-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>
          <button className="nav-arrow" onClick={onPrev}><i className="fas fa-chevron-left"></i></button>
          <h3 style={{ textTransform: 'capitalize', color: 'var(--primary-color, #e91e63)' }}>{dateLabel}</h3>
          <button className="nav-arrow" onClick={onNext}><i className="fas fa-chevron-right"></i></button>
        </div>
      )}

      {/* 3. FILTRO DE PROFISSIONAIS (Sempre na base do Header) */}
      <div className="prof-tabs-scroller" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px 20px', scrollbarWidth: 'none' }}>
        {view === 'dia' && (
          <button
            style={{
              padding: '6px 16px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap',
              background: profFilter === 'todos' ? 'var(--primary-color, #e91e63)' : (theme === 'light' ? '#e0e0e0' : 'var(--bg-color, #2a2a2a)'),
              color: profFilter === 'todos' ? '#fff' : (theme === 'light' ? '#333' : 'var(--text-secondary, #888)')
            }}
            onClick={() => setProfFilter('todos')}
          >
            Todos
          </button>
        )}
        {professionals.map((p) => (
          <button
            key={p.id}
            style={{
              padding: '6px 16px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap',
              background: profFilter === p.id ? 'var(--primary-color, #e91e63)' : (theme === 'light' ? '#e0e0e0' : 'var(--bg-color, #2a2a2a)'),
              color: profFilter === p.id ? '#fff' : (theme === 'light' ? '#333' : 'var(--text-secondary, #888)')
            }}
            onClick={() => setProfFilter(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>
    </header>
  )
}
