import { useState } from 'react'
import { formatDateToISO, TIMELINE_CONFIG } from '../utils'

export default function DayView({ professionals, appointments, selectedDate, profFilter, onSlotClick, onCardClick }) {
  const [hoveredSlot, setHoveredSlot] = useState(null)
  const currentISO = formatDateToISO(selectedDate)

  // Geração da régua de horários
  const timeSlots = []
  for (let h = TIMELINE_CONFIG.startHour; h <= TIMELINE_CONFIG.endHour; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`)
    if (h !== TIMELINE_CONFIG.endHour) {
      timeSlots.push(`${String(h).padStart(2, '0')}:30`)
    }
  }

  const visibleProfs = professionals.filter((p) => profFilter === 'todos' || p.id === profFilter)
  const slotHeight = TIMELINE_CONFIG.hourHeight / 2 

  const slotFromY = (y) => {
    const totalMinutes = (y / TIMELINE_CONFIG.hourHeight) * 60
    const hour = Math.floor(totalMinutes / 60) + TIMELINE_CONFIG.startHour
    const min = totalMinutes % 60 >= 30 ? 30 : 0
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  }

  // Lógica de texto Hoje/Amanhã/Ontem
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selDate = new Date(selectedDate);
  selDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((selDate - today) / (1000 * 60 * 60 * 24));
  
  let relativeText = "";
  if (diffDays === 0) relativeText = "Hoje, ";
  else if (diffDays === 1) relativeText = "Amanhã, ";
  else if (diffDays === -1) relativeText = "Ontem, ";

  const fullDateStr = selDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="timeline-scroll-wrapper" style={{ width: '100%', flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: '120px' }}>
      
      <div style={{ textAlign: 'center', padding: '12px', fontSize: '1rem', color: 'var(--primary-color, #e91e63)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color, #333)', flexShrink: 0 }}>
        {relativeText} {fullDateStr}
      </div>

      <div className="timeline-grid-container" style={{ display: 'flex', flex: 1, width: '100%' }}>
        
        {/* EIXO DE HORAS */}
        <div className="timeline-hours-axis" style={{ width: '60px', flexShrink: 0, borderRight: '1px solid var(--border-color, #333)' }}>
          {timeSlots.map((time) => {
            const isHalf = time.endsWith(':30')
            return (
              <div 
                key={time} 
                style={{
                  height: `${slotHeight}px`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isHalf ? '0.7rem' : '0.85rem',
                  color: isHalf ? 'var(--text-tertiary, #666)' : 'var(--text-secondary, #aaa)',
                  borderBottom: isHalf ? '1px dashed var(--border-color, rgba(255,255,255,0.05))' : '1px solid var(--border-color, #333)',
                  background: hoveredSlot === time ? 'rgba(233, 30, 99, 0.05)' : 'transparent'
                }}
              >
                {time}
              </div>
            )
          })}
        </div>

        {/* COLUNAS DAS PROFISSIONAIS */}
        <div className="professionals-columns-grid" style={{ display: 'flex', flex: 1, width: 'calc(100% - 60px)' }}>
          {visibleProfs.length === 0 && (
            <div style={{ padding: 16, color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', width: '100%' }}>Nenhuma profissional cadastrada.</div>
          )}

          {visibleProfs.map((prof) => {
            const dayApps = appointments.filter((a) => a.date === currentISO && a.professional_id === prof.id)
            
            return (
              <div key={prof.id} style={{ flex: 1, minWidth: 0, borderRight: '1px solid var(--border-color, #333)', display: 'flex', flexDirection: 'column' }}>
                
                {/* Nome da Profissional */}
                <div style={{ textAlign: 'center', padding: '10px 4px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-color, #333)', overflow: 'hidden' }}>
                  <span style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.95rem)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {prof.name}
                  </span>
                </div>
                
                {/* Malha de Horários Clicável */}
                <div
                  style={{ position: 'relative', flex: 1 }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setHoveredSlot(slotFromY(e.clientY - rect.top))
                  }}
                  onMouseLeave={() => setHoveredSlot(null)}
                  onClick={(e) => {
                    if (e.target.closest('.dynamic-appointment-card')) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    onSlotClick(prof, parseInt(slotFromY(e.clientY - rect.top).split(':')[0])) 
                  }}
                >
                  {/* Linhas de Grade de 30 em 30 min */}
                  {timeSlots.map((time, idx) => {
                    const isHalf = time.endsWith(':30')
                    return (
                      <div key={`grid-${time}`} style={{
                        position: 'absolute', top: `${idx * slotHeight}px`, width: '100%', height: `${slotHeight}px`,
                        borderBottom: isHalf ? '1px dashed var(--border-color, rgba(255,255,255,0.05))' : '1px solid var(--border-color, rgba(255,255,255,0.05))',
                        pointerEvents: 'none'
                      }} />
                    )
                  })}

                  {/* CARTÕES DE AGENDAMENTO / BLOQUEIO (Aqui a variável "app" nasce) */}
                  {dayApps.map((app) => {
                    const [hh, mm] = app.time.split(':').map(Number)
                    const minutesFromStart = (hh - TIMELINE_CONFIG.startHour) * 60 + mm
                    const isBlock = app.is_block === true; 

                    // DESIGN SYSTEM: Lógica Semântica de Cores Baseada no Status
                    let cardBg = 'var(--primary-color, #e91e63)'; // Rosa Padrão (Pendente)
                    if (isBlock) {
                      cardBg = 'repeating-linear-gradient(45deg, rgba(120,120,120,0.15), rgba(120,120,120,0.15) 10px, rgba(120,120,120,0.25) 10px, rgba(120,120,120,0.25) 20px)';
                    } else {
                      if (app.status === 'concluido') cardBg = '#10b981'; // Verde (Sucesso)
                      else if (app.status === 'faltou') cardBg = '#ef4444'; // Vermelho (Erro)
                      else if (app.status === 'confirmado') cardBg = '#3b82f6'; // Azul (Ação/Confirmado)
                    }

                    return (
                      <div
                        key={app.id}
                        className={isBlock ? "" : `dynamic-appointment-card ${prof.style_class}`}
                        style={{
                          position: 'absolute',
                          top: `${(minutesFromStart / 60) * TIMELINE_CONFIG.hourHeight}px`,
                          height: `${(app.duration_minutes / 60) * TIMELINE_CONFIG.hourHeight}px`,
                          left: '2px', right: '2px', width: 'auto', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '6px', borderRadius: '6px', zIndex: 10,
                          
                          // APLICANDO AS CORES E OPACIDADE
                          background: cardBg,
                          backgroundColor: isBlock ? 'rgba(80, 80, 80, 0.05)' : '',
                          border: isBlock ? '1px dashed rgba(150, 150, 150, 0.4)' : 'none',
                          color: isBlock ? '#aaa' : '#fff',
                          opacity: app.status === 'faltou' ? 0.6 : 1, // Esmaece se a pessoa faltou
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isBlock ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onClick={(e) => { e.stopPropagation(); onCardClick(app); }}
                      >
                        {/* MODO BLOQUEIO DE HORÁRIO */}
                        {isBlock ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', flexDirection: 'column', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#888' }}>
                              <i className="fa-solid fa-ban" style={{ marginRight: '6px', color: '#ff4444' }}></i>
                              {app.service || 'Horário Bloqueio'}
                            </span>
                            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                              {app.time.slice(0, 5)} ({app.duration_minutes}min)
                            </span>
                          </div>
                        ) : (
                          // MODO AGENDAMENTO NORMAL (CLIENTE)
                          <>
                            <div style={{ fontWeight: 'bold', fontSize: 'clamp(0.65rem, 2vw, 0.8rem)' }}>
                              {app.time.slice(0, 5)} ({app.duration_minutes}m)
                            </div>
                            
                            {/* ÍCONES DE STATUS AO LADO DO NOME DO CLIENTE */}
                            <div style={{ fontSize: 'clamp(0.7rem, 2.2vw, 0.9rem)', lineHeight: 1.1, margin: '2px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {app.status === 'concluido' && <i className="fa-solid fa-check-circle" style={{ color: '#fff' }}></i>}
                              {app.status === 'confirmado' && <i className="fa-solid fa-thumbs-up" style={{ fontSize: '0.7rem', color: '#fff' }}></i>}
                              {app.client_name}
                            </div>
                            
                            <div style={{ fontSize: 'clamp(0.65rem, 2vw, 0.8rem)', opacity: 0.9 }}>{app.service}</div>
                            
                            {app.observation && (
                              <div style={{ fontSize: 'clamp(0.6rem, 1.8vw, 0.75rem)', marginTop: 'auto', fontStyle: 'italic', background: 'rgba(0, 0, 0, 0.2)', padding: '2px 4px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {app.observation}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
