import { useEffect, useState, useRef } from 'react'

export default function Header({
  theme, toggleTheme, view, setView, profFilter, setProfFilter, professionals, selectedDate, onPrev, onNext, allowAllProfessionals = true, onMenuClick
}) {
  const [profDropdownOpen, setProfDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    if (!profDropdownOpen) return
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profDropdownOpen])

  // Formatação para Visão Semanal
  let dateLabel = '';
  if (view === 'semana') {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    dateLabel = `Semana de ${start.getDate()} de ${start.toLocaleDateString('pt-BR', { month: 'short' })}`;
  }

  const selectedProfName = profFilter === 'todos'
    ? 'Todos'
    : professionals.find((p) => p.id === profFilter)?.name || 'Todos'

  const isLight = theme === 'light'

  return (
    <header className="main-header">
      <div className="header-top-row">
        {/* BRAND — clique no B abre o sidebar drawer */}
        <div className="brand">
          <span
            className="brand-logo"
            onClick={onMenuClick}
            style={{ cursor: 'pointer' }}
            role="button"
            aria-label="Abrir menu"
          >
            B
          </span>
          <h2>Bonyta Studio</h2>
        </div>

        {/* AÇÕES: Tema + Filtro Profissional compacto */}
        <div className="header-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Alternar tema">
            <i className={theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'}></i>
          </button>

          {/* DROPDOWN COMPACTO DE PROFISSIONAL */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setProfDropdownOpen(!profDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: `1px solid ${isLight ? '#dbdfe7' : '#1f1f2e'}`,
                background: isLight ? '#eaedf2' : '#171721',
                color: isLight ? '#333' : '#ccc',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              aria-label="Filtrar profissional"
            >
              <i className="fa-solid fa-user" style={{ fontSize: '0.7rem', color: 'var(--primary-color, #e91e63)' }}></i>
              {selectedProfName}
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.55rem', opacity: 0.7 }}></i>
            </button>

            {profDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                minWidth: '160px',
                borderRadius: '12px',
                border: `1px solid ${isLight ? '#dbdfe7' : '#1f1f2e'}`,
                background: isLight ? '#ffffff' : '#171721',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                zIndex: 999,
                overflow: 'hidden'
              }}>
                {view === 'dia' && allowAllProfessionals && (
                  <button
                    type="button"
                    onClick={() => { setProfFilter('todos'); setProfDropdownOpen(false) }}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      border: 'none',
                      background: profFilter === 'todos' ? 'var(--primary-color, #e91e63)' : 'transparent',
                      color: profFilter === 'todos' ? '#fff' : (isLight ? '#333' : '#ccc'),
                      fontSize: '0.82rem',
                      fontWeight: profFilter === 'todos' ? 800 : 600,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <i className="fa-solid fa-users" style={{ width: '18px', textAlign: 'center', fontSize: '0.75rem' }}></i>
                    Todos
                  </button>
                )}
                {professionals.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setProfFilter(p.id); setProfDropdownOpen(false) }}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      border: 'none',
                      background: profFilter === p.id ? 'var(--primary-color, #e91e63)' : 'transparent',
                      color: profFilter === p.id ? '#fff' : (isLight ? '#333' : '#ccc'),
                      fontSize: '0.82rem',
                      fontWeight: profFilter === p.id ? 800 : 600,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <i className="fa-solid fa-user" style={{ width: '18px', textAlign: 'center', fontSize: '0.75rem' }}></i>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. SELETOR DE VISÃO */}
      <div className="view-switcher-container">
        <div className="view-switcher">
          {['dia', 'semana', 'mes'].map((v) => (
            <button key={v} className={`switch-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
              {v === 'dia' ? 'Dia' : v === 'semana' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. NAVEGADOR DE DATAS (Apenas na Semana) */}
      {view === 'semana' && (
        <div className="date-navigator-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>
          <button className="nav-arrow" onClick={onPrev}><i className="fas fa-chevron-left"></i></button>
          <h3 style={{ textTransform: 'capitalize', color: 'var(--primary-color, #e91e63)' }}>{dateLabel}</h3>
          <button className="nav-arrow" onClick={onNext}><i className="fas fa-chevron-right"></i></button>
        </div>
      )}
    </header>
  )
}
