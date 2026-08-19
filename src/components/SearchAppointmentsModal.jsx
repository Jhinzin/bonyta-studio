import React, { useState, useMemo } from 'react'
import { addMinutesToTime } from '../utils'
import { buildWhatsAppUrl } from '../utils/whatsapp'

const formatLongDate = (isoDate) => {
  if (!isoDate || typeof isoDate !== 'string') return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' })
  const month = date.toLocaleDateString('pt-BR', { month: 'long' })
  const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  const capMonth = month.charAt(0).toUpperCase() + month.slice(1)
  return `${capWeekday}, ${d} de ${capMonth} de ${y}`
}

const statusBadgeStyle = {
  concluido: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', label: 'Concluído' },
  confirmado: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6', label: 'Confirmado' },
  pendente: { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b', label: 'Pendente' },
  faltou: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444', label: 'Faltou' }
}

export default function SearchAppointmentsModal({
  open,
  onClose,
  appointments = [],
  professionals = [],
  clients = [],
  onSelectAppointment,
  theme
}) {
  const [query, setQuery] = useState('')

  const isLight = theme === 'light'
  const bgMain = isLight ? '#f9f9f9' : '#0f0f14'
  const bgCard = isLight ? '#ffffff' : '#171721'
  const bgInput = isLight ? '#eaedf2' : '#1f1f2e'
  const textMain = isLight ? '#111' : '#fff'
  const textSec = isLight ? '#666' : '#8e8e9a'
  const borderCol = isLight ? '#dbdfe7' : '#2a2a3c'

  const filteredAppointments = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    return (appointments || [])
      .filter((app) => {
        if (!app) return false
        const clientName = (app.client_name || '').toLowerCase()
        const serviceName = (app.service || '').toLowerCase()
        return clientName.includes(q) || serviceName.includes(q)
      })
      .sort((a, b) => {
        // Ordena por data e horário
        const dateA = `${a.date || ''} ${a.time || ''}`
        const dateB = `${b.date || ''} ${b.time || ''}`
        return dateA.localeCompare(dateB)
      })
  }, [query, appointments])

  // Encontra telefone da cliente pesquisada se existir
  const matchedClient = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return (clients || []).find((c) => c && (c.name || '').toLowerCase().includes(q))
  }, [query, clients])

  const handleShareWhatsApp = () => {
    if (filteredAppointments.length === 0) return

    const clientName = filteredAppointments[0]?.client_name || 'Cliente'
    let text = `Olá, *${clientName}*! 🌸\nSeguem seus próximos agendamentos no *Bonyta Studio*:\n\n`

    filteredAppointments.forEach((app) => {
      const formattedDate = formatLongDate(app.date)
      const startTime = String(app.time || '').slice(0, 5)
      const endTime = addMinutesToTime(app.time, app.duration_minutes)
      const profName = (professionals || []).find((p) => p && p.id === app.professional_id)?.name || ''
      text += `📅 *${formattedDate}*\n⏰ ${startTime} às ${endTime}\n💅 ${app.service || 'Procedimento'}${profName ? ` (com ${profName})` : ''}\n\n`
    })

    text += `Qualquer dúvida estamos à disposição! 💕`

    const phone = matchedClient?.phone || ''
    window.open(buildWhatsAppUrl(phone, text), '_blank', 'noopener,noreferrer')
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '16px 8px'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          maxHeight: '92vh',
          background: bgMain,
          borderRadius: '20px',
          border: `1px solid ${borderCol}`,
          boxShadow: '0 25px 70px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* BARRA DE PESQUISA SUPERIOR */}
        <div
          style={{
            padding: '16px',
            background: bgCard,
            borderBottom: `1px solid ${borderCol}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: textMain,
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '6px'
            }}
            aria-label="Voltar"
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>

          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <i
              className="fa-solid fa-magnifying-glass"
              style={{
                position: 'absolute',
                left: '14px',
                color: 'var(--primary-color, #e91e63)',
                fontSize: '0.95rem'
              }}
            ></i>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o nome da cliente..."
              style={{
                width: '100%',
                padding: '12px 38px 12px 40px',
                borderRadius: '12px',
                border: `1px solid ${borderCol}`,
                background: bgInput,
                color: textMain,
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: textSec,
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '4px'
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        </div>

        {/* RESUMO / AÇÃO DE COMPARTILHAMENTO */}
        {filteredAppointments.length > 0 && (
          <div
            style={{
              padding: '12px 18px',
              background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.1)',
              borderBottom: `1px solid ${borderCol}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: textMain }}>
              📌 {filteredAppointments.length} agendamento{filteredAppointments.length > 1 ? 's' : ''} encontrado{filteredAppointments.length > 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: 'none',
                background: '#25D366',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
              }}
            >
              <i className="fa-brands fa-whatsapp" style={{ fontSize: '0.95rem' }}></i>
              Enviar lista no WhatsApp
            </button>
          </div>
        )}

        {/* LISTAGEM DOS AGENDAMENTOS */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {!query ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: textSec }}>
              <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '2.4rem', opacity: 0.3, marginBottom: '14px', display: 'block' }}></i>
              <strong style={{ fontSize: '1rem', color: textMain, display: 'block', marginBottom: '6px' }}>
                Pesquise por uma cliente
              </strong>
              <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
                Digite o nome da cliente acima para ver todos os horários e procedimentos marcados no ano.
              </p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: textSec }}>
              <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '2.4rem', opacity: 0.3, marginBottom: '14px', display: 'block' }}></i>
              <strong style={{ fontSize: '1rem', color: textMain, display: 'block', marginBottom: '6px' }}>
                Nenhum agendamento encontrado
              </strong>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                Não encontramos agendamentos com o termo "{query}".
              </p>
            </div>
          ) : (
            filteredAppointments.map((app) => {
              const startTime = String(app.time || '').slice(0, 5)
              const endTime = addMinutesToTime(app.time, app.duration_minutes)
              const prof = (professionals || []).find((p) => p && p.id === app.professional_id)
              const statusInfo = statusBadgeStyle[app.status] || { bg: 'rgba(255,255,255,0.1)', text: textSec, label: app.status }

              return (
                <div
                  key={app.id}
                  onClick={() => {
                    if (onSelectAppointment) {
                      onSelectAppointment(app)
                      onClose()
                    }
                  }}
                  style={{
                    background: bgCard,
                    border: `1px solid ${borderCol}`,
                    borderRadius: '14px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color, #e91e63)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = borderCol
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* DATA E CABEÇALHO DO CARD */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${borderCol}`, paddingBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-color, #e91e63)' }}>
                      📅 {formatLongDate(app.date)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: statusInfo.bg,
                        color: statusInfo.text
                      }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* CORPO DO CARD */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: textMain, marginBottom: '3px' }}>
                        {app.client_name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: textSec }}>
                        💅 {app.service}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: textMain }}>
                        ⏰ {startTime} - {endTime}
                      </div>
                      {prof && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--primary-color, #e91e63)', fontWeight: 700, marginTop: '2px' }}>
                          👤 {prof.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {app.observation && (
                    <div style={{ fontSize: '0.75rem', color: textSec, fontStyle: 'italic', background: bgInput, padding: '6px 10px', borderRadius: '6px', marginTop: '4px' }}>
                      <i className="fa-solid fa-circle-info" style={{ marginRight: '6px', opacity: 0.8 }}></i>
                      {app.observation}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
