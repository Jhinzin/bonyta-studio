import React, { useMemo } from 'react'
import { formatDateToISO } from '../utils'
import { appointmentMessageTemplates, buildWhatsAppUrl } from '../utils/whatsapp'

const statusLabel = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  concluido: 'Concluido',
  faltou: 'Faltou'
}

const paymentLabel = {
  aberto: 'Em aberto',
  sinal: 'Sinal',
  pago: 'Pago'
}

const formatCurrency = (value) => (
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
)

const formatTime = (time) => String(time || '').slice(0, 5)

const dayLabel = (date) => date.toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long'
})

export default function DailyCenterModal({
  open,
  onClose,
  theme,
  selectedDate,
  appointments = [],
  clients = [],
  professionals = [],
  onUpdateAppointment
}) {
  const dayISO = formatDateToISO(selectedDate)

  const dayAppointments = useMemo(() => (
    appointments
      .filter((appointment) => (
        appointment.date === dayISO &&
        !appointment.is_block &&
        appointment.status !== 'cancelado'
      ))
      .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
  ), [appointments, dayISO])

  if (!open) return null

  const isLight = theme === 'light'
  const bgMain = isLight ? '#f9f9f9' : '#121212'
  const bgCard = isLight ? '#ffffff' : '#222'
  const textMain = isLight ? '#333' : '#fff'
  const textSec = isLight ? '#666' : '#aaa'
  const borderCol = isLight ? '#ddd' : '#333'

  const totals = dayAppointments.reduce((acc, appointment) => {
    acc.revenue += Number(appointment.total_price || 0)
    acc.open += Math.max(Number(appointment.total_price || 0) - Number(appointment.amount_paid || 0), 0)
    acc[appointment.status] = (acc[appointment.status] || 0) + 1
    return acc
  }, { revenue: 0, open: 0, pendente: 0, confirmado: 0, concluido: 0, faltou: 0 })

  const findClient = (appointment) => clients.find((client) => String(client.id) === String(appointment.client_id))
  const findProfessional = (appointment) => professionals.find((professional) => String(professional.id) === String(appointment.professional_id))

  const sendWhatsApp = (appointment, template) => {
    const client = findClient(appointment)
    const professional = findProfessional(appointment)
    const phone = client?.phone

    if (!phone) return alert('Cliente sem WhatsApp cadastrado.')

    const builder = appointmentMessageTemplates[template] || appointmentMessageTemplates.lembrete
    const message = builder({
      clientName: client?.name || appointment.client_name,
      date: appointment.date,
      time: appointment.time,
      service: appointment.service,
      professional: professional?.name
    })

    window.open(buildWhatsAppUrl(phone, message), '_blank', 'noopener,noreferrer')
  }

  const updateStatus = async (appointment, status) => {
    try {
      await onUpdateAppointment?.(appointment.id, { status })
    } catch (err) {
      alert(`Erro ao atualizar status: ${err.message}`)
    }
  }

  return (
    <div className="modal-overlay active" style={{ zIndex: 99999 }}>
      <div className="modal-box" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh', padding: 0, background: bgMain }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <h3 style={{ color: 'var(--primary-color, #e91e63)', fontWeight: 900, margin: 0 }}>
              <i className="fa-solid fa-bell" style={{ marginRight: '8px' }}></i> Central do Dia
            </h3>
            <p style={{ color: textSec, fontSize: '0.78rem', marginTop: '4px', textTransform: 'capitalize' }}>{dayLabel(selectedDate)}</p>
          </div>
          <button onClick={onClose} style={{ width: '38px', height: '38px', borderRadius: '50%', border: `1px solid ${borderCol}`, background: bgCard, color: textMain, cursor: 'pointer' }} aria-label="Fechar">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '12px', padding: '10px' }}>
              <div style={{ color: textSec, fontSize: '0.66rem', fontWeight: 900, textTransform: 'uppercase' }}>Horarios</div>
              <strong style={{ color: textMain, fontSize: '1.1rem' }}>{dayAppointments.length}</strong>
            </div>
            <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '12px', padding: '10px' }}>
              <div style={{ color: textSec, fontSize: '0.66rem', fontWeight: 900, textTransform: 'uppercase' }}>Pendentes</div>
              <strong style={{ color: '#f59e0b', fontSize: '1.1rem' }}>{totals.pendente}</strong>
            </div>
            <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '12px', padding: '10px' }}>
              <div style={{ color: textSec, fontSize: '0.66rem', fontWeight: 900, textTransform: 'uppercase' }}>Receita</div>
              <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>{formatCurrency(totals.revenue)}</strong>
            </div>
            <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '12px', padding: '10px' }}>
              <div style={{ color: textSec, fontSize: '0.66rem', fontWeight: 900, textTransform: 'uppercase' }}>Aberto</div>
              <strong style={{ color: totals.open > 0 ? '#f59e0b' : textMain, fontSize: '0.95rem' }}>{formatCurrency(totals.open)}</strong>
            </div>
          </div>

          {dayAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '34px', color: textSec, background: bgCard, borderRadius: '12px', border: `1px dashed ${borderCol}` }}>
              Nenhum atendimento marcado para esta data.
            </div>
          ) : (
            dayAppointments.map((appointment) => {
              const client = findClient(appointment)
              const professional = findProfessional(appointment)
              const amountOpen = Math.max(Number(appointment.total_price || 0) - Number(appointment.amount_paid || 0), 0)

              return (
                <article key={appointment.id} style={{ background: bgCard, border: `1px solid ${borderCol}`, borderLeft: appointment.status === 'confirmado' ? '4px solid #3b82f6' : appointment.status === 'concluido' ? '4px solid #10b981' : appointment.status === 'faltou' ? '4px solid #ef4444' : '4px solid #f59e0b', borderRadius: '12px', padding: '14px', display: 'grid', gap: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ color: textMain, margin: 0, fontSize: '1rem', fontWeight: 900 }}>{formatTime(appointment.time)} · {appointment.client_name || client?.name}</h4>
                      <p style={{ color: textSec, marginTop: '3px', fontSize: '0.8rem' }}>{appointment.service} com {professional?.name || 'profissional'}</p>
                    </div>
                    <span style={{ height: 'fit-content', borderRadius: '999px', padding: '5px 9px', background: 'rgba(233,30,99,.14)', color: 'var(--primary-color, #e91e63)', fontSize: '0.68rem', fontWeight: 900 }}>
                      {statusLabel[appointment.status] || appointment.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', color: textSec, fontSize: '0.76rem' }}>
                    <span>{formatCurrency(appointment.total_price)}</span>
                    <span>·</span>
                    <span>{paymentLabel[appointment.payment_status] || 'Pagamento'}</span>
                    {amountOpen > 0 && <span>· falta {formatCurrency(amountOpen)}</span>}
                    {client?.phone && <span>· WhatsApp {client.phone}</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '7px' }}>
                    <button type="button" onClick={() => sendWhatsApp(appointment, 'confirmacao')} style={{ padding: '9px 5px', background: '#25D366', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '0.7rem' }}>
                      Confirmar
                    </button>
                    <button type="button" onClick={() => sendWhatsApp(appointment, 'lembrete')} style={{ padding: '9px 5px', background: '#128C7E', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '0.7rem' }}>
                      Lembrete
                    </button>
                    <button type="button" onClick={() => sendWhatsApp(appointment, 'reagendamento')} style={{ padding: '9px 5px', background: 'transparent', border: `1px solid ${borderCol}`, color: textMain, borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '0.7rem' }}>
                      Reagendar
                    </button>
                    <button type="button" onClick={() => sendWhatsApp(appointment, 'posAtendimento')} style={{ padding: '9px 5px', background: 'transparent', border: `1px solid ${borderCol}`, color: textMain, borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '0.7rem' }}>
                      Obrigada
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
                    <button type="button" onClick={() => updateStatus(appointment, 'confirmado')} style={{ padding: '9px 5px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '0.72rem' }}>
                      Confirmado
                    </button>
                    <button type="button" onClick={() => updateStatus(appointment, 'concluido')} style={{ padding: '9px 5px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '0.72rem' }}>
                      Concluido
                    </button>
                    <button type="button" onClick={() => updateStatus(appointment, 'faltou')} style={{ padding: '9px 5px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '0.72rem' }}>
                      Faltou
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
