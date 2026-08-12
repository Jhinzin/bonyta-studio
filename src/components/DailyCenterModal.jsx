import React, { useMemo, useState } from 'react'
import { formatDateToISO } from '../utils'
import { appointmentMessageTemplates, buildWhatsAppUrl } from '../utils/whatsapp'

const statusLabel = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
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

const shortDate = (iso) => {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  return day && month && year ? `${day}/${month}` : iso
}

const addDays = (date, amount) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

const depositFor = (appointment) => {
  const total = Number(appointment.total_price || 0)
  return total > 0 ? Math.round(total * 0.3 * 100) / 100 : 0
}

export default function DailyCenterModal({
  open,
  onClose,
  theme,
  selectedDate,
  appointments = [],
  clients = [],
  professionals = [],
  messageLogs = [],
  messageLogsError = null,
  onLogMessage,
  onUpdateAppointment
}) {
  const [rangeMode, setRangeMode] = useState('dia')
  const startISO = formatDateToISO(selectedDate)
  const endISO = formatDateToISO(addDays(selectedDate, 6))

  const visibleAppointments = useMemo(() => (
    appointments
      .filter((appointment) => {
        if (appointment.is_block || appointment.status === 'cancelado') return false
        if (rangeMode === 'dia') return appointment.date === startISO
        return appointment.date >= startISO && appointment.date <= endISO
      })
      .sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`))
  ), [appointments, endISO, rangeMode, startISO])

  if (!open) return null

  const isLight = theme === 'light'
  const bgMain = isLight ? '#f9f9f9' : '#121212'
  const bgCard = isLight ? '#ffffff' : '#222'
  const textMain = isLight ? '#333' : '#fff'
  const textSec = isLight ? '#666' : '#aaa'
  const borderCol = isLight ? '#ddd' : '#333'
  const periodLabel = rangeMode === 'dia'
    ? dayLabel(selectedDate)
    : `${shortDate(startISO)} até ${shortDate(endISO)}`

  const totals = visibleAppointments.reduce((acc, appointment) => {
    acc.revenue += Number(appointment.total_price || 0)
    acc.open += Math.max(Number(appointment.total_price || 0) - Number(appointment.amount_paid || 0), 0)
    acc.depositPending += Number(appointment.amount_paid || 0) <= 0 ? depositFor(appointment) : 0
    acc[appointment.status] = (acc[appointment.status] || 0) + 1
    return acc
  }, { revenue: 0, open: 0, depositPending: 0, pendente: 0, confirmado: 0, concluido: 0, faltou: 0 })

  const findClient = (appointment) => clients.find((client) => String(client.id) === String(appointment.client_id))
  const findProfessional = (appointment) => professionals.find((professional) => String(professional.id) === String(appointment.professional_id))

  const sendWhatsApp = async (appointment, template) => {
    const client = findClient(appointment)
    const professional = findProfessional(appointment)
    const phone = client?.phone

    if (!phone) return alert('Cliente sem WhatsApp cadastrado.')

    const totalPrice = Number(appointment.total_price || 0)
    const builder = appointmentMessageTemplates[template] || appointmentMessageTemplates.lembrete
    const message = builder({
      clientName: client?.name || appointment.client_name,
      date: appointment.date,
      time: appointment.time,
      service: appointment.service,
      professional: professional?.name,
      totalPrice,
      depositAmount: depositFor(appointment)
    })

    window.open(buildWhatsAppUrl(phone, message), '_blank', 'noopener,noreferrer')

    try {
      await onLogMessage?.({
        client_id: client?.id || appointment.client_id || null,
        appointment_id: appointment.id,
        professional_id: appointment.professional_id || null,
        message_type: template,
        recipient_name: client?.name || appointment.client_name,
        recipient_phone: phone,
        message_body: message,
        status: 'sent'
      })
    } catch (logError) {
      console.warn('Nao foi possivel registrar a mensagem:', logError)
    }
  }

  const updateStatus = async (appointment, status) => {
    try {
      await onUpdateAppointment?.(appointment.id, { status })
    } catch (err) {
      alert(`Erro ao atualizar status: ${err.message}`)
    }
  }

  const markDepositPaid = async (appointment) => {
    const depositAmount = depositFor(appointment)

    if (!depositAmount) return alert('Este atendimento não tem valor definido para calcular o sinal.')

    try {
      await onUpdateAppointment?.(appointment.id, {
        amount_paid: depositAmount,
        payment_status: 'sinal',
        payment_method: appointment.payment_method === 'nao_informado' ? 'pix' : appointment.payment_method
      })
    } catch (err) {
      alert(`Erro ao lançar sinal: ${err.message}`)
    }
  }

  return (
    <div className="modal-overlay active" style={{ zIndex: 99999 }}>
      <div className="modal-box" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh', padding: 0, background: bgMain }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <h3 style={{ color: 'var(--primary-color, #e91e63)', fontWeight: 900, margin: 0 }}>
              <i className="fa-solid fa-bell" style={{ marginRight: '8px' }}></i> Central de Operação
            </h3>
            <p style={{ color: textSec, fontSize: '0.78rem', marginTop: '4px', textTransform: 'capitalize' }}>{periodLabel}</p>
          </div>
          <button onClick={onClose} style={{ width: '38px', height: '38px', borderRadius: '50%', border: `1px solid ${borderCol}`, background: bgCard, color: textMain, cursor: 'pointer' }} aria-label="Fechar">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: bgCard, border: `1px solid ${borderCol}`, padding: '5px', borderRadius: '12px' }}>
            {[
              { id: 'dia', label: 'Dia selecionado' },
              { id: '7dias', label: 'Próximos 7 dias' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRangeMode(item.id)}
                style={{ border: 'none', borderRadius: '9px', padding: '10px', background: rangeMode === item.id ? 'var(--primary-color, #e91e63)' : 'transparent', color: rangeMode === item.id ? '#fff' : textSec, fontWeight: 900, cursor: 'pointer', fontSize: '0.78rem' }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '12px', padding: '10px' }}>
              <div style={{ color: textSec, fontSize: '0.66rem', fontWeight: 900, textTransform: 'uppercase' }}>Horários</div>
              <strong style={{ color: textMain, fontSize: '1.1rem' }}>{visibleAppointments.length}</strong>
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
              <div style={{ color: textSec, fontSize: '0.66rem', fontWeight: 900, textTransform: 'uppercase' }}>Sinais</div>
              <strong style={{ color: totals.depositPending > 0 ? '#93c5fd' : textMain, fontSize: '0.95rem' }}>{formatCurrency(totals.depositPending)}</strong>
            </div>
          </div>

          {messageLogsError && (
            <div style={{ padding: '12px', color: '#ffd08a', background: 'rgba(245,158,11,.13)', borderRadius: '10px', fontSize: '0.8rem' }}>
              Histórico de mensagens ainda indisponível. Rode a migration de message_logs no Supabase.
            </div>
          )}

          {visibleAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '34px', color: textSec, background: bgCard, borderRadius: '12px', border: `1px dashed ${borderCol}` }}>
              Nenhum atendimento encontrado para este período.
            </div>
          ) : (
            visibleAppointments.map((appointment) => {
              const client = findClient(appointment)
              const professional = findProfessional(appointment)
              const amountOpen = Math.max(Number(appointment.total_price || 0) - Number(appointment.amount_paid || 0), 0)
              const depositAmount = depositFor(appointment)
              const latestMessage = messageLogs.find((log) => String(log.appointment_id) === String(appointment.id))

              return (
                <article key={appointment.id} style={{ background: bgCard, border: `1px solid ${borderCol}`, borderLeft: appointment.status === 'confirmado' ? '4px solid #3b82f6' : appointment.status === 'concluido' ? '4px solid #10b981' : appointment.status === 'faltou' ? '4px solid #ef4444' : '4px solid #f59e0b', borderRadius: '12px', padding: '14px', display: 'grid', gap: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ color: textMain, margin: 0, fontSize: '1rem', fontWeight: 900 }}>
                        {rangeMode === '7dias' ? `${shortDate(appointment.date)} · ` : ''}{formatTime(appointment.time)} · {appointment.client_name || client?.name}
                      </h4>
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
                    {latestMessage && <span style={{ color: '#25D366' }}>última msg {new Date(latestMessage.sent_at).toLocaleString('pt-BR')}</span>}
                    {depositAmount > 0 && <span>· sinal 30% {formatCurrency(depositAmount)}</span>}
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

                  {Number(appointment.amount_paid || 0) <= 0 && depositAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => markDepositPaid(appointment)}
                      style={{ padding: '10px', background: isLight ? '#eff6ff' : 'rgba(59,130,246,0.13)', border: '1px solid rgba(59,130,246,0.38)', color: isLight ? '#1d4ed8' : '#bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '0.76rem' }}
                    >
                      <i className="fa-solid fa-bolt" style={{ marginRight: '6px' }}></i>
                      Lançar sinal 30% ({formatCurrency(depositAmount)})
                    </button>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
                    <button type="button" onClick={() => updateStatus(appointment, 'confirmado')} style={{ padding: '9px 5px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '0.72rem' }}>
                      Confirmado
                    </button>
                    <button type="button" onClick={() => updateStatus(appointment, 'concluido')} style={{ padding: '9px 5px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '0.72rem' }}>
                      Concluído
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
