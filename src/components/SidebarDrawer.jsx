import React from 'react';
import { supabase } from '../supabaseClient';

const SidebarDrawer = ({
  open,
  onClose,
  activeTab,
  setActiveTab,
  allowedTabs,
  theme
}) => {
  const isDark = theme === 'dark';

  // Colors based on theme
  const bgColor = isDark ? '#0f0f14' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#111111';
  const borderColor = isDark ? '#1f1f2e' : '#dbdfe7';
  const inactiveTextColor = isDark ? '#cccccc' : '#333333';
  const overlayBg = 'rgba(0,0,0,0.5)';

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const handleMenuClick = (id) => {
    setActiveTab(id);
    onClose(); // Close drawer after selection on mobile
  };

  const menuItems = [
    { id: 'agenda', icon: 'fa-calendar', label: 'Agenda' },
    { id: 'clientes', icon: 'fa-users', label: 'Clientes & Anamnese' },
    { id: 'servicos', icon: 'fa-list-check', label: 'Serviços & Pacotes' },
    { 
      id: 'financeiro', 
      icon: 'fa-wallet', 
      label: allowedTabs && allowedTabs.length <= 2 ? 'Meus Ganhos' : 'Finanças' 
    }
  ];

  const visibleItems = menuItems.filter(item => 
    !allowedTabs || allowedTabs.includes(item.id)
  );

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: overlayBg,
          zIndex: 10000,
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, visibility 0.3s ease',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '280px',
          backgroundColor: bgColor,
          zIndex: 10001,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${borderColor}`,
          color: textColor,
          boxSizing: 'border-box',
          padding: '24px 16px',
        }}
      >
        {/* Header / Greeting */}
        <div style={{ marginBottom: '32px', padding: '0 12px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
            Olá, <span style={{ color: 'var(--primary-color, #e91e63)' }}>Bonyta</span>!
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: inactiveTextColor }}>
            O que vamos fazer hoje?
          </p>
        </div>

        {/* Menu Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {visibleItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                style={{
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--primary-color, #e91e63)' : 'transparent',
                  color: isActive ? '#ffffff' : inactiveTextColor,
                  borderRadius: '12px',
                  transition: 'background-color 0.2s ease, color 0.2s ease',
                }}
              >
                <i 
                  className={`fa-solid ${item.icon}`} 
                  style={{ width: '24px', textAlign: 'center', fontSize: '1.1rem' }}
                ></i>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Bottom Section (Logout) */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ 
            height: '1px', 
            backgroundColor: borderColor, 
            margin: '16px 0',
            opacity: 0.5 
          }} />
          
          <div
            onClick={handleLogout}
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#ef4444',
              borderRadius: '12px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <i 
              className="fa-solid fa-arrow-right-from-bracket" 
              style={{ width: '24px', textAlign: 'center', fontSize: '1.1rem' }}
            ></i>
            <span>Sair</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarDrawer;
