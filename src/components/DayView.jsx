import { useState } from 'react'
import { formatDateToISO, TIMELINE_CONFIG } from '../utils'

const addMinutesToTime = (time, minutesToAdd) => {
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + Number(minutesToAdd || 0)
  const nextHours = Math.floor(totalMinutes / 60) % 24
  const nextMinutes = totalMinutes % 60
  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`
}

const statusLabel = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  concluido: 'Concluido',
  faltou: 'Faltou'
}

const statusIcon = {
  confirmado: 'fa-thumbs-up',
  concluido: 'fa-check-circle',
  faltou: 'fa-triangle-exclamation'
}

export default function DayView({
  professionals,
  appointments,
  selectedDate,
  profFilter,
  onSlotClick,
  onCardClick,
  onToday
}) {
  const [hoveredSlot, setHoveredSlot] = useState(null)
  const currentISO = formatDateToISO(selectedDate)

  const timeSlots = []
  for (let h = TIMELINE_CONFIG.startHour; h <= TIMELINE_CONFIG.endHour; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`)
    if (h !== TIMELINE_CONFIG.endHour) {
      timeSlots.push(`${String(h).padStart(2, '0')}:30`)
    }
  }

  const visibleProfs = professionals.filter((prof) => profFilter === 'todos' || prof.id === profFilter)
  const slotHeight = TIMELINE_CONFIG.hourHeight / 2

  const slotFromY = (y) => {
    const dayMinutes = (TIMELINE_CONFIG.endHour - TIMELINE_CONFIG.startHour) * 60
    const totalMinutes = Math.min(Math.max((y / TIMELINE_CONFIG.hourHeight) * 60, 0), dayMinutes)
    const hour = Math.floor(totalMinutes / 60) + TIMELINE_CONFIG.startHour
    const min = totalMinutes % 60 >= 30 ? 30 : 0
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selDate = new Date(selectedDate)
  selDate.setHours(0, 0, 0, 0)
  const diffDays = Math.round((selDate - today) / (1000 * 60 * 60 * 24))

  let relativeText = ''
  if (diffDays === 0) relativeText = 'Hoje, '
  else if (diffDays === 1) relativeText = 'Amanha, '
  else if (diffDays === -1) relativeText = 'Ontem, '

  const fullDateStr = selDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="timeline-scroll-wrapper" style={{ width: '100%', flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: '120px' }}>
      {diffDays !== 0 && (
        <button
          type="button"
          onClick={onToday}
          style={{
            position: 'fixed',
            left: '50%',
            bottom: '104px',
            transform: 'translateX(-50%)',
            zIndex: 9997,
            border: 'none',
            borderRadius: '10px',
            background: 'var(--primary-color, #e91e63)',
            color: '#fff',
            padding: '12px 22px',
            fontWeight: 800,
            boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
            cursor: 'pointer'
          }}
        >
          Hoje
        </button>
      )}

      <div style={{ textAlign: 'center', padding: '12px', fontSize: '1rem', color: 'var(--primary-color, #e91e63)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color, #333)', flexShrink: 0 }}>
        {relativeText}{fullDateStr}
      </div>

      <div style={{ display: 'flex', width: '100%', flexShrink: 0, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color, #333)' }}>
        <div style={{ width: '60px', flexShrink: 0, borderRight: '1px solid var(--border-color, #333)' }} />
        <div style={{ display: 'flex', flex: 1, width: 'calc(100% - 60px)' }}>
          {visibleProfs.length === 0 ? (
            <div style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', width: '100%' }}>Nenhuma profissional cadastrada.</div>
          ) : (
            visibleProfs.map((prof) => (
              <div key={prof.id} style={{ flex: 1, minWidth: 0, borderRight: '1px solid var(--border-color, #333)', textAlign: 'center', padding: '12px 4px', overflow: 'hidden' }}>
                <span style={{ fontSize: 'clamp(0.78rem, 2.5vw, 0.98rem)', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                  {prof.name}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="timeline-grid-container" style={{ display: 'flex', flex: 1, width: '100%' }}>
        <div className="timeline-hours-axis" style={{ width: '60px', flexShrink: 0, borderRight: '1px solid var(--border-color, #333)' }}>
          {timeSlots.map((time) => {
            const isHalf = time.endsWith(':30')
            return (
              <div
                key={time}
                style={{
                  height: `${slotHeight}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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

        <div className="professionals-columns-grid" style={{ display: 'flex', flex: 1, width: 'calc(100% - 60px)' }}>
          {visibleProfs.map((prof) => {
            const dayApps = appointments.filter((appointment) => appointment.date === currentISO && appointment.professional_id === prof.id)

            return (
              <div key={prof.id} style={{ flex: 1, minWidth: 0, borderRight: '1px solid var(--border-color, #333)', display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{ position: 'relative', flex: 1 }}
                  onMouseMove={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect()
                    setHoveredSlot(slotFromY(event.clientY - rect.top))
                  }}
                  onMouseLeave={() => setHoveredSlot(null)}
                  onClick={(event) => {
                    if (event.target.closest('.dynamic-appointment-card')) return
                    const rect = event.currentTarget.getBoundingClientRect()
                    onSlotClick(prof, slotFromY(event.clientY - rect.top))
                  }}
                >
                  {timeSlots.map((time, index) => {
                    const isHalf = time.endsWith(':30')
                    return (
                      <div
                        key={`grid-${time}`}
                        style={{
                          position: 'absolute',
                          top: `${index * slotHeight}px`,
                          width: '100%',
                          height: `${slotHeight}px`,
                          borderBottom: isHalf ? '1px dashed var(--border-color, rgba(255,255,255,0.05))' : '1px solid var(--border-color, rgba(255,255,255,0.05))',
                          pointerEvents: 'none'
                        }}
                      />
                    )
                  })}

                  {dayApps.map((appointment) => {
                    const [hh, mm] = appointment.time.split(':').map(Number)
                    const minutesFromStart = (hh - TIMELINE_CONFIG.startHour) * 60 + mm
                    const isBlock = appointment.is_block === true
                    const startTime = appointment.time.slice(0, 5)
                    const endTime = addMinutesToTime(appointment.time, appointment.duration_minutes)

                    let cardBg = 'var(--primary-color, #e91e63)'
                    if (isBlock) {
                      cardBg = 'repeating-linear-gradient(45deg, rgba(120,120,120,0.15), rgba(120,120,120,0.15) 10px, rgba(120,120,120,0.25) 10px, rgba(120,120,120,0.25) 20px)'
                    } else if (appointment.status === 'concluido') {
                      cardBg = '#10b981'
                    } else if (appointment.status === 'faltou') {
                      cardBg = '#ef4444'
                    } else if (appointment.status === 'confirmado') {
                      cardBg = '#3b82f6'
                    }

                    return (
                      <div
                        key={appointment.id}
                        className={isBlock ? 'dynamic-appointment-card' : `dynamic-appointment-card ${prof.style_class}`}
                        style={{
                          position: 'absolute',
                          top: `${(minutesFromStart / 60) * TIMELINE_CONFIG.hourHeight}px`,
                          height: `${(appointment.duration_minutes / 60) * TIMELINE_CONFIG.hourHeight}px`,
                          left: '2px',
                          right: '2px',
                          width: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          padding: '7px',
                          borderRadius: '6px',
                          zIndex: 10,
                          background: cardBg,
                          backgroundColor: isBlock ? 'rgba(80, 80, 80, 0.05)' : '',
                          border: isBlock ? '1px dashed rgba(150, 150, 150, 0.4)' : 'none',
                          color: isBlock ? '#aaa' : '#fff',
                          opacity: appointment.status === 'faltou' ? 0.64 : 1,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isBlock ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          onCardClick(appointment)
                        }}
                      >
                        {isBlock ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', flexDirection: 'column', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#888' }}>
                              <i className="fa-solid fa-ban" style={{ marginRight: '6px', color: '#ff4444' }}></i>
                              {appointment.service || 'Horario bloqueado'}
                            </span>
                            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                              {startTime} - {endTime}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: 'clamp(0.62rem, 1.8vw, 0.78rem)' }}>
                              <span>{startTime} - {endTime}</span>
                              <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: 0, opacity: 0.85, whiteSpace: 'nowrap' }}>
                                {statusLabel[appointment.status] || appointment.status}
                              </span>
                            </div>

                            <div style={{ fontSize: 'clamp(0.74rem, 2.2vw, 0.92rem)', lineHeight: 1.15, margin: '4px 0 2px', display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                              {statusIcon[appointment.status] && <i className={`fa-solid ${statusIcon[appointment.status]}`} style={{ color: '#fff', fontSize: '0.7rem' }}></i>}
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appointment.client_name}</span>
                            </div>

                            <div style={{ fontSize: 'clamp(0.65rem, 2vw, 0.8rem)', opacity: 0.92, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {appointment.service}
                            </div>

                            {appointment.observation && (
                              <div style={{ fontSize: 'clamp(0.6rem, 1.8vw, 0.75rem)', marginTop: 'auto', fontStyle: 'italic', background: 'rgba(0, 0, 0, 0.2)', padding: '2px 4px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {appointment.observation}
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
