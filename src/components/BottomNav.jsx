import React from 'react'

export default function BottomNav({ activeTab, setActiveTab, theme, allowedTabs }) {
  const isLight = theme === 'light'
  const bgNav = isLight ? '#ffffff' : '#1a1a1a'
  const borderNav = isLight ? '#ebebeb' : '#2d2d2d'
  const textActive = 'var(--primary-color, #e91e63)'
  const textInactive = isLight ? '#888888' : '#666666'

  const navItems = [
    { id: 'agenda', icon: 'fa-calendar', label: 'Agenda' },
    { id: 'clientes', icon: 'fa-users', label: 'Clientes' },
    { id: 'servicos', icon: 'fa-list-check', label: 'Serviços' },
    { id: 'financeiro', icon: 'fa-wallet', label: allowedTabs?.length === 2 ? 'Meus ganhos' : 'Finanças' }
  ].filter((item) => !allowedTabs || allowedTabs.includes(item.id))

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, width: '100%',
      background: bgNav, borderTop: `1px solid ${borderNav}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 5px', zIndex: 9998, height: '80px', paddingBottom: '15px',
      boxShadow: isLight ? '0 -4px 12px rgba(0,0,0,0.03)' : '0 -4px 12px rgba(0,0,0,0.2)'
    }}>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === item.id ? textActive : textInactive,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            flex: 1,
            height: '100%',
            transition: 'color 0.2s ease, transform 0.1s ease',
            transform: activeTab === item.id ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          <i className={`fa-solid ${item.icon}`} style={{ fontSize: '1.4rem' }}></i>
          <span style={{ fontSize: '0.7rem', fontWeight: activeTab === item.id ? '800' : '600' }}>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
