import React from 'react'

export default function BottomNav({ activeTab, setActiveTab, theme, allowedTabs, bookingRequestsCount = 0 }) {
  const navItems = [
    { id: 'agenda', icon: 'fa-calendar', label: 'Agenda' },
    { id: 'clientes', icon: 'fa-users', label: 'Clientes' },
    { id: 'servicos', icon: 'fa-list-check', label: 'Serviços' },
    {
      id: 'financeiro',
      icon: 'fa-wallet',
      label: allowedTabs?.length === 2 ? 'Meus ganhos' : 'Finanças'
    }
  ].filter((item) => !allowedTabs || allowedTabs.includes(item.id))

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = activeTab === item.id
        const showBadge = item.id === 'agenda' && bookingRequestsCount > 0

        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {showBadge && (
              <span className="nav-badge">
                {bookingRequestsCount > 9 ? '9+' : bookingRequestsCount}
              </span>
            )}
            <i className={`fa-solid ${item.icon}`} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
