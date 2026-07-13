import React, { useState } from 'react';
import { formatDateToISO } from '../utils';

const BRAZIL_HOLIDAYS = {
  '01-01': 'Ano Novo',
  '04-21': 'Tiradentes',
  '05-01': 'Trabalho',
  '09-07': 'Independência',
  '10-12': 'Nossa Sra.',
  '11-02': 'Finados',
  '11-15': 'República',
  '11-20': 'Zumbi',
  '12-25': 'Natal'
};

export default function MonthView({ appointments, selectedDate, profFilter, theme, onDayClick, onPrev, onNext }) {
  const [viewMode, setViewMode] = useState('lista'); 

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const monthName = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const isLight = theme === 'light';
  const textMain = isLight ? '#333' : '#fff';
  const textSec = isLight ? '#666' : '#888';
  const bgCard = isLight ? '#fff' : '#2a2a2a';
  const borderCol = isLight ? '#e0e0e0' : '#333';
  const bgMain = isLight ? '#f9f9f9' : '#121212';

  const EXPECTED_APPS_PER_DAY = 8; 

  return (
    <div style={{ 
      width: '100%', 
      /* MÁGICA DO SCROLL: Define altura máxima e ativa a barra de rolagem */
      height: 'calc(100vh - 160px)', 
      overflowY: 'auto', 
      overflowX: 'hidden',
      paddingBottom: '120px', 
      background: bgMain,
      padding: viewMode === 'contador' ? '16px' : '16px 0 120px 0' // Tira as bordas na visão lista
    }}>
      
      {/* 1. SELETORES */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '0.9rem', color: textMain, marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
          <input 
            type="radio" name="mode" checked={viewMode === 'contador'} 
            onChange={() => setViewMode('contador')} 
            style={{ accentColor: 'var(--primary-color, #e91e63)' }}
          />
          Visão Contador
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
          <input 
            type="radio" name="mode" checked={viewMode === 'lista'} 
            onChange={() => setViewMode('lista')} 
            style={{ accentColor: 'var(--primary-color, #e91e63)' }}
          />
          Visão Lista
        </label>
      </div>

      {/* 2. NAVEGADOR DE MÊS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '16px' }}>
        <button onClick={onPrev} style={{ background: 'transparent', border: 'none', color: textMain, fontSize: '1.3rem', cursor: 'pointer', padding: '8px' }}>
          <i className="fas fa-chevron-left"></i>
        </button>
        <h3 style={{ textTransform: 'capitalize', fontSize: '1.3rem', color: 'var(--primary-color, #e91e63)', fontWeight: 'bold', margin: 0 }}>
          {monthName}
        </h3>
        <button onClick={onNext} style={{ background: 'transparent', border: 'none', color: textMain, fontSize: '1.3rem', cursor: 'pointer', padding: '8px' }}>
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {/* 3. GRID DO CALENDÁRIO */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: viewMode === 'contador' ? '12px' : '0', 
        textAlign: 'center',
        borderTop: viewMode === 'lista' ? `1px solid ${borderCol}` : 'none',
        borderLeft: viewMode === 'lista' ? `1px solid ${borderCol}` : 'none'
      }}>
        
        {weekDays.map(day => (
          <div key={day} style={{ 
            fontSize: '0.75rem', fontWeight: 'bold', color: textSec, padding: '10px 0',
            background: viewMode === 'lista' ? bgMain : 'transparent',
            borderRight: viewMode === 'lista' ? `1px solid ${borderCol}` : 'none',
            borderBottom: viewMode === 'lista' ? `1px solid ${borderCol}` : 'none'
          }}>
            {day}
          </div>
        ))}

        {blanks.map(b => (
           <div key={`blank-${b}`} style={{ 
             borderRight: viewMode === 'lista' ? `1px solid ${borderCol}` : 'none',
             borderBottom: viewMode === 'lista' ? `1px solid ${borderCol}` : 'none',
             background: viewMode === 'lista' ? (isLight ? '#f9f9f9' : '#151515') : 'transparent' 
           }} />
        ))}

        {days.map(day => {
          const dayStr = String(day).padStart(2, '0');
          const monthStr = String(month + 1).padStart(2, '0');
          const holidayKey = `${monthStr}-${dayStr}`;
          const isHoliday = BRAZIL_HOLIDAYS[holidayKey];

          const iso = `${year}-${monthStr}-${dayStr}`;
          const dayApps = appointments.filter(a => a.date === iso && a.professional_id === profFilter);
          const appCount = dayApps.length;
          const isToday = iso === formatDateToISO(new Date());

          // ==========================================
          // VISÃO CONTADOR (Restaurada para a versão bonita original)
          // ==========================================
          if (viewMode === 'contador') {
            const occupancyPercent = Math.min((appCount / EXPECTED_APPS_PER_DAY) * 100, 100);
            return (
              <div 
                key={day} 
                onClick={() => onDayClick(new Date(year, month, day))}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', cursor: 'pointer' }}
              >
                {appCount > 0 && (
                  <div style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: 'var(--primary-color, #e91e63)', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold',
                    width: '16px', height: '16px', borderRadius: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2
                  }}>
                    {appCount}
                  </div>
                )}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `
                    radial-gradient(closest-side, ${bgMain} 79%, transparent 80% 100%),
                    conic-gradient(var(--primary-color, #e91e63) ${occupancyPercent}%, ${borderCol} 0)
                  `,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    background: isToday ? 'var(--primary-color, #e91e63)' : bgCard,
                    color: isToday ? '#fff' : textMain,
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: isToday ? 'bold' : 'normal', fontSize: '0.9rem'
                  }}>
                    {day}
                  </div>
                </div>
                {/* Feriado sutil fora do círculo para não estragar o design */}
                {isHoliday && <div style={{ fontSize: '0.55rem', color: '#7c4dff', fontWeight: 'bold', marginTop: '4px' }}>Feriado</div>}
              </div>
            );
          }

          // ==========================================
          // VISÃO LISTA (Agora com rolagem e células altas)
          // ==========================================
          return (
            <div 
              key={day} 
              onClick={() => onDayClick(new Date(year, month, day))}
              style={{ 
                background: isToday ? (isLight ? '#fff5f8' : '#251218') : bgMain, 
                minHeight: '140px', // Altura generosa para os dias
                display: 'flex', flexDirection: 'column', 
                padding: '4px 2px', cursor: 'pointer',
                borderRight: `1px solid ${borderCol}`,
                borderBottom: `1px solid ${borderCol}`,
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: isToday ? '900' : '700', color: isToday ? 'var(--primary-color, #e91e63)' : textSec }}>
                  {day}
                </span>

                {isHoliday && (
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 'bold', background: isLight ? '#eeeeee' : '#3a3a3a', color: isLight ? '#555555' : '#bbbbbb',
                    padding: '1px 3px', borderRadius: '3px', maxWidth: '40px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }} title={isHoliday}>
                    Feriado
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                {dayApps.slice(0, 5).map(app => ( 
                  <div key={app.id} style={{
                    background: 'var(--primary-color, #e91e63)', color: '#fff', fontSize: '0.6rem',
                    padding: '2px 4px', borderRadius: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left', fontWeight: '600'
                  }}>
                    {app.time.slice(0, 5)} {app.client_name.split(' ')[0]}
                  </div>
                ))}
                {appCount > 5 && (
                  <div style={{ fontSize: '0.6rem', color: textSec, fontWeight: 'bold' }}>+{appCount - 5} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
