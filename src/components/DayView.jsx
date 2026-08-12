import { useEffect, useRef, useState } from 'react'
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
  concluido: 'Concluído',
  faltou: 'Faltou'
}

const statusColors = {
  pendente: '#f59e0b',
  confirmado: '#3b82f6',
  concluido: '#10b981',
  faltou: '#ef4444'
}

const statusIcon = {
  confirmado: 'fa-thumbs-up',
  concluido: 'fa-check-circle',
  faltou: 'fa-triangle-exclamation'
}

// Calcula o top% do indicador "Agora" dentro da timeline
const getNowPosition = () => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()

  if (hours < TIMELINE_CONFIG.startHour || hours > TIMELINE_CONFIG.endHour) return null

  const minutesFromStart = (hours - TIMELINE_CONFIG.startHour) * 60 + minutes
  return (minutesFromStart / 60) * TIMELINE_CONFIG.hourHeight
}

const getNowLabel = () => {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
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
  const [nowTop, setNowTop] = useState(getNowPosition())
  const [nowLabel, setNowLabel] = useState(getNowLabel())
  const scrollRef = useRef(null)
  const currentISO = formatDateToISO(selectedDate)

  // Atualiza o indicador "Agora" a cada 30 segundos
  useEffect(() => {
    const update = () => {
      setNowTop(getNowPosition())
      setNowLabel(getNowLabel())
    }
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll para hora atual ao abrir a visão de hoje
  useEffect(() => {
    const todayISO = formatDateToISO(new Date())
    if (currentISO === todayISO && scrollRef.current) {
      const top = getNowPosition()
      if (top !== null) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ top: Math.max(top - 120, 0), behavior: 'smooth' })
        }, 150)
      }
    }
  }, [currentISO])

  const timeSlots = []
  for (let h = TIMELINE_CONFIG.startHour; h <= TIMELINE_CONFIG.endHour; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`)
    if (h !== TIMELINE_CONFIG.endHour) {
      timeSlots.push(`${String(h).padStart(2, '0')}:30`)
    }
  }

  const visibleProfs = professionals.filter((prof) => profFilter === 'todos' || prof.id === profFilter)
  const slotHeight = TIMELINE_CONFIG.hourHeight / 2

  // FIX: compensar scrollTop do container ao calcular horário pelo clique
  const slotFromY = (y) => {
    const dayMinutes = (TIMELINE_CONFIG.endHour - TIMELINE_CONFIG.startHour) * 60
    const totalMinutes = Math.min(Math.max((y / TIMELINE_CONFIG.hourHeight) * 60, 0), dayMinutes)
    const snapped = Math.floor(totalMinutes / 30) * 30
    const hour = Math.floor(snapped / 60) + TIMELINE_CONFIG.startHour
    const min = snapped % 60
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selDate = new Date(selectedDate)
  selDate.setHours(0, 0, 0, 0)
  const diffDays = Math.round((selDate - today) / (1000 * 60 * 60 * 24))
  const isToday = diffDays === 0

  let relativeText = ''
  if (diffDays === 0) relativeText = 'Hoje, '
  else if (diffDays === 1) relativeText = 'Amanhã, '
  else if (diffDays === -1) relativeText = 'Ontem, '

  const fullDateStr = selDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div
      ref={scrollRef}
      className="timeline-scroll-wrapper"
      style={{ width: '100%', flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}
    >
      {/* Botão "Hoje" flutuante quando não está no dia atual */}
      {!isToday && (
        <button
          type="button"
          onClick={onToday}
          style={{
            position: 'fixed',
            left: '50%',
            bottom: '100px',
            transform: 'translateX(-50%)',
            zIndex: 9997,
            border: 'none',
            borderRadius: '12px',
            background: 'var(--accent-pink)',
            color: '#fff',
            padding: '10px 22px',
            fontWeight: 800,
            fontSize: '0.88rem',
            boxShadow: 'var(--shadow-pink)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fa-solid fa-calendar-day" />
          Hoje
        </button>
      )}

      {/* Barra de data */}
      <div style={{
        textAlign: 'center',
        padding: '10px 16px',
        fontSize: '0.95rem',
        color: isToday ? 'var(--accent-pink)' : 'var(--text-primary)',
        fontWeight: 800,
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        {isToday && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-pink)', display: 'inline-block', animation: 'now-pulse 2s infinite' }} />}
        {relativeText}{fullDateStr}
      </div>

      {/* Cabeçalho com nomes das profissionais */}
      <div style={{ display: 'flex', width: '100%', flexShrink: 0, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ width: '60px', flexShrink: 0, borderRight: '1px solid var(--border-color)' }} />
        <div style={{ display: 'flex', flex: 1 }}>
          {visibleProfs.length === 0 ? (
            <div style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', width: '100%' }}>
              Nenhuma profissional cadastrada.
            </div>
          ) : (
            visibleProfs.map((prof) => (
              <div key={prof.id} style={{ flex: 1, minWidth: 0, borderRight: '1px solid var(--border-color)', textAlign: 'center', padding: '10px 4px', overflow: 'hidden' }}>
                <span style={{ fontSize: 'clamp(0.78rem, 2.5vw, 0.95rem)', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', display: 'block' }}>
                  {prof.name}
                </span>
                {prof.specialty && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-pink)', fontWeight: 700, letterSpacing: '0.04em' }}>
                    {prof.specialty}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Grid da Timeline */}
      <div style={{ display: 'flex', flex: 1, width: '100%', position: 'relative' }}>
        {/* Eixo de horas */}
        <div style={{ width: '60px', flexShrink: 0, borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)', position: 'sticky', left: 0, zIndex: 5 }}>
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
                  fontSize: isHalf ? '0.68rem' : '0.82rem',
                  color: isHalf ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                  borderBottom: isHalf ? '1px dashed var(--border-soft)' : '1px solid var(--border-color)',
                  fontWeight: 700
                }}
              >
                {isHalf ? '' : time}
              </div>
            )
          })}
        </div>

        {/* Colunas das profissionais */}
        <div style={{ display: 'flex', flex: 1 }}>
          {visibleProfs.map((prof) => {
            const dayApps = appointments.filter(
              (appt) => appt.date === currentISO && appt.professional_id === prof.id
            )

            return (
              <div
                key={prof.id}
                style={{ flex: 1, minWidth: 0, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', position: 'relative' }}
              >
                <div
                  style={{ position: 'relative' }}
                  onMouseMove={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect()
                    setHoveredSlot(slotFromY(event.clientY - rect.top))
                  }}
                  onMouseLeave={() => setHoveredSlot(null)}
                  onClick={(event) => {
                    if (event.target.closest('.dynamic-appointment-card')) return
                    const rect = event.currentTarget.getBoundingClientRect()
                    // FIX: compensar scroll do container
                    const scrollTop = scrollRef.current?.scrollTop || 0
                    const relativeY = event.clientY - rect.top
                    onSlotClick(prof, slotFromY(relativeY))
                  }}
                >
                  {/* Grid de slots */}
                  {timeSlots.map((time, index) => {
                    const isHalf = time.endsWith(':30')
                    const isHovered = hoveredSlot === time
                    return (
                      <div
                        key={`grid-${time}`}
                        style={{
                          height: `${slotHeight}px`,
                          borderBottom: isHalf ? '1px dashed var(--border-soft)' : '1px solid var(--border-color)',
                          background: isHovered ? 'rgba(212, 20, 90, 0.05)' : 'transparent',
                          transition: 'background 0.1s'
                        }}
                      />
                    )
                  })}

                  {/* Indicador do "Agora" — apenas para coluna do dia atual */}
                  {isToday && nowTop !== null && (
                    <div
                      className="now-indicator"
                      style={{ top: `${nowTop}px` }}
                    >
                      <div className="now-indicator-dot" />
                      <div className="now-indicator-line" />
                      <div className="now-indicator-label">{nowLabel}</div>
                    </div>
                  )}

                  {/* Cards de agendamentos */}
                  {dayApps.map((appointment) => {
                    const [hh, mm] = appointment.time.split(':').map(Number)
                    const minutesFromStart = (hh - TIMELINE_CONFIG.startHour) * 60 + mm
                    const isBlock = appointment.is_block === true
                    const startTime = appointment.time.slice(0, 5)
                    const endTime = addMinutesToTime(appointment.time, appointment.duration_minutes)
                    const status = appointment.status || 'pendente'

                    let cardBg = 'var(--accent-pink)'
                    if (isBlock) {
                      cardBg = 'repeating-linear-gradient(45deg, rgba(120,120,120,0.1), rgba(120,120,120,0.1) 10px, rgba(120,120,120,0.2) 10px, rgba(120,120,120,0.2) 20px)'
                    } else {
                      cardBg = statusColors[status] || 'var(--accent-pink)'
                    }

                    return (
                      <div
                        key={appointment.id}
                        className="dynamic-appointment-card"
                        style={{
                          position: 'absolute',
                          top: `${(minutesFromStart / 60) * TIMELINE_CONFIG.hourHeight}px`,
                          height: `${Math.max((appointment.duration_minutes / 60) * TIMELINE_CONFIG.hourHeight, 28)}px`,
                          left: '3px',
                          right: '3px',
                          width: 'auto',
                          overflow: 'hidden',
                          borderRadius: '10px',
                          zIndex: 10,
                          background: isBlock ? undefined : cardBg,
                          backgroundColor: isBlock ? 'rgba(80, 80, 80, 0.06)' : undefined,
                          border: isBlock ? '1px dashed rgba(150,150,150,0.4)' : 'none',
                          borderLeft: isBlock ? '2px dashed rgba(150,150,150,0.5)' : `3px solid rgba(255,255,255,0.25)`,
                          color: isBlock ? 'var(--text-secondary)' : '#fff',
                          opacity: status === 'faltou' ? 0.6 : 1,
                          cursor: 'pointer',
                          boxShadow: isBlock ? 'none' : '0 2px 8px rgba(0,0,0,0.25)'
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          onCardClick(appointment)
                        }}
                      >
                        {isBlock ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '6px', flexDirection: 'column', textAlign: 'center', padding: '4px' }}>
                            <i className="fa-solid fa-ban" style={{ color: '#888', fontSize: '0.8rem' }} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                              {appointment.service || 'Bloqueado'}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                              {startTime} – {endTime}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: 'clamp(0.62rem, 1.8vw, 0.78rem)', fontWeight: 800, opacity: 0.9 }}>
                                {startTime}–{endTime}
                              </span>
                              <span className="card-status-badge">
                                {statusIcon[status] && <i className={`fa-solid ${statusIcon[status]}`} />}
                                {statusLabel[status] || status}
                              </span>
                            </div>
                            <div style={{ fontSize: 'clamp(0.74rem, 2.2vw, 0.9rem)', fontWeight: 800, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {appointment.client_name}
                            </div>
                            <div style={{ fontSize: 'clamp(0.65rem, 1.9vw, 0.8rem)', opacity: 0.88, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {appointment.service}
                            </div>
                            {appointment.observation && (
                              <div style={{ fontSize: '0.65rem', marginTop: 'auto', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {appointment.observation}
                              </div>
                            )}
                          </div>
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
