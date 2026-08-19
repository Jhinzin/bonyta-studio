import React, { useEffect, useState, useMemo } from 'react'
import { appointmentMessageTemplates, buildWhatsAppUrl } from '../utils/whatsapp'
import { TIMELINE_CONFIG, addMinutesToTime } from '../utils'
import { generateRecurringDates, formatShortDate } from '../utils/recurrence'

const emptyForm = {
  client_id: '',
  service_id: '',
  professional_id: '',
  date: '',
  time: '',
  duration_minutes: 60,
  observation: '',
  status: 'pendente',
  amount_paid: 0,
  payment_method: 'nao_informado',
  payment_status: 'aberto'
}

const statusOptions = [
  { id: 'pendente', label: 'Pendente', color: '#f59e0b', icon: 'fa-clock' },
  { id: 'confirmado', label: 'Confirmado', color: '#3b82f6', icon: 'fa-thumbs-up' },
  { id: 'concluido', label: 'Concluido', color: '#10b981', icon: 'fa-check' },
  { id: 'faltou', label: 'Faltou', color: '#ef4444', icon: 'fa-triangle-exclamation' }
]

const paymentMethodOptions = [
  { id: 'nao_informado', label: 'Nao informado' },
  { id: 'pix', label: 'Pix' },
  { id: 'credito', label: 'Credito' },
  { id: 'debito', label: 'Debito' },
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'outro', label: 'Outro' }
]

const paymentStatusOptions = [
  { id: 'aberto', label: 'Em aberto', color: '#f59e0b' },
  { id: 'sinal', label: 'Sinal pago', color: '#3b82f6' },
  { id: 'pago', label: 'Pago', color: '#10b981' }
]

const parseSavedItems = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const formatCurrency = (value) => (
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
)

const timeToMinutes = (time) => {
  if (!time) return null
  const [hours, minutes] = String(time || '').slice(0, 5).split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

const formatTime = (time) => String(time || '').slice(0, 5)

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

const roundUpToHalfHour = (minutes) => Math.ceil(minutes / 30) * 30

const rangesOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA

const findScheduleConflict = ({ appointments = [], form, editingAppointment }) => {
  if (!form || !form.professional_id || !form.date || !form.time || !form.duration_minutes) return null

  const start = timeToMinutes(form.time)
  const duration = Number(form.duration_minutes || 0)
  if (start === null || duration <= 0) return null

  const end = start + duration
  const editingId = form.id || editingAppointment?.id

  return (appointments || []).find((appointment) => {
    if (!appointment) return false
    if (editingId && String(appointment.id) === String(editingId)) return false
    if (appointment.status === 'cancelado') return false
    if (appointment.date !== form.date) return false
    if (String(appointment.professional_id) !== String(form.professional_id)) return false

    const appointmentStart = timeToMinutes(appointment.time)
    const appointmentDuration = Number(appointment.duration_minutes || 0)
    if (appointmentStart === null || appointmentDuration <= 0) return false

    return rangesOverlap(start, end, appointmentStart, appointmentStart + appointmentDuration)
  }) || null
}

const findAvailableSlots = ({ appointments = [], form, editingAppointment, limit = 3 }) => {
  if (!form || !form.professional_id || !form.date || !form.duration_minutes) return []

  const duration = Number(form.duration_minutes || 0)
  if (duration <= 0) return []

  const startLimit = (TIMELINE_CONFIG?.startHour ?? 8) * 60
  const endLimit = (TIMELINE_CONFIG?.endHour ?? 23) * 60
  const preferredStart = timeToMinutes(form.time)
  const firstCandidate = roundUpToHalfHour(Math.max(preferredStart ?? startLimit, startLimit))
  const slots = []

  for (let candidate = firstCandidate; candidate + duration <= endLimit && slots.length < limit; candidate += 30) {
    const candidateForm = { ...form, time: minutesToTime(candidate) }
    const conflict = findScheduleConflict({ appointments, form: candidateForm, editingAppointment })
    if (!conflict) slots.push(minutesToTime(candidate))
  }

  return slots
}

export default function AppointmentModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  professionals = [],
  defaultDate,
  editingAppointment,
  prefill,
  theme,
  clients = [],
  services = [],
  products = [],
  appointments = []
}) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [showComanda, setShowComanda] = useState(false)
  const [comandaItens, setComandaItens] = useState([])

  // Estado de Recorrência
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceFreq, setRecurrenceFreq] = useState('biweekly')
  const [recurrenceDurationMonths, setRecurrenceDurationMonths] = useState(4)
  const [recurrenceCustomDays, setRecurrenceCustomDays] = useState(15)

  const isLight = theme === 'light'
  const bgMain = isLight ? '#f9f9f9' : '#121212'
  const bgCard = isLight ? '#ffffff' : '#1e1e1e'
  const bgInput = isLight ? '#ffffff' : '#222'
  const textMain = isLight ? '#333' : '#fff'
  const textSec = isLight ? '#666' : '#ccc'
  const borderCol = isLight ? '#ddd' : '#333'

  const inputStyle = {
    width: '100%',
    padding: '13px',
    borderRadius: '8px',
    border: `1px solid ${borderCol}`,
    background: bgInput,
    color: textMain,
    outline: 'none',
    fontSize: '0.95rem'
  }

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    WebkitAppearance: 'none',
    paddingRight: '40px',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='${isLight ? '%23333' : '%23fff'}' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPositionX: 'calc(100% - 12px)',
    backgroundPositionY: 'center'
  }

  useEffect(() => {
    if (!open) return

    if (editingAppointment) {
      setForm({ ...emptyForm, ...editingAppointment })
      const savedItems = editingAppointment.comanda || parseSavedItems(editingAppointment.comanda_json)
      setComandaItens(Array.isArray(savedItems) ? savedItems : [])
      setShowComanda(Array.isArray(savedItems) && savedItems.length > 0)
      return
    }

    setForm({
      ...emptyForm,
      date: prefill?.date || defaultDate || '',
      client_id: prefill?.client_id || '',
      service_id: prefill?.service_id || '',
      professional_id: prefill?.professional_id || professionals?.[0]?.id || '',
      time: prefill?.time || '',
      duration_minutes: prefill?.duration_minutes || emptyForm.duration_minutes,
      observation: prefill?.observation || '',
      booking_request_id: prefill?.booking_request_id || null
    })
    setComandaItens([])
    setShowComanda(false)
  }, [open, defaultDate, professionals, editingAppointment, prefill])

  const recurringDates = useMemo(() => {
    if (!isRecurring || !form.date) return []
    try {
      return generateRecurringDates({
        startDate: form.date,
        frequency: recurrenceFreq,
        durationMonths: recurrenceDurationMonths,
        customDays: recurrenceCustomDays
      }) || []
    } catch {
      return []
    }
  }, [isRecurring, form.date, recurrenceFreq, recurrenceDurationMonths, recurrenceCustomDays])

  if (!open) return null

  const selectedClient = (clients || []).find((client) => client && String(client.id) === String(form.client_id))
  const selectedService = (services || []).find((service) => service && String(service.id) === String(form.service_id))
  const selectedProfessional = (professionals || []).find((professional) => professional && String(professional.id) === String(form.professional_id))
  
  const scheduleConflict = findScheduleConflict({ appointments, form, editingAppointment })
  const availableSuggestions = scheduleConflict
    ? findAvailableSlots({ appointments, form, editingAppointment })
    : []

  const servicePrice = selectedService ? Number(selectedService.price || 0) : Number(form.total_price || 0)
  const serviceCost = selectedService ? Number(selectedService.material_cost || 0) : Number(form.total_cost || 0)
  const extrasPrice = (Array.isArray(comandaItens) ? comandaItens : []).reduce((sum, item) => sum + Number(item?.price || 0) * Number(item?.qty || 1), 0)
  const extrasCost = (Array.isArray(comandaItens) ? comandaItens : []).reduce((sum, item) => sum + Number(item?.cost || 0) * Number(item?.qty || 1), 0)
  const totalGeral = servicePrice + extrasPrice
  const totalCost = serviceCost + extrasCost
  const amountPaid = Number(form.amount_paid || 0)
  const amountPending = Math.max(totalGeral - amountPaid, 0)
  const depositAmount = totalGeral > 0 ? Math.round(totalGeral * 0.3 * 100) / 100 : 0

  const handleAddItem = (productId) => {
    if (!productId) return
    const product = (products || []).find((item) => item && String(item.id) === String(productId))
    if (!product) return
    setComandaItens((current) => [...(Array.isArray(current) ? current : []), { ...product, qty: 1 }])
  }

  const handleRemoveItem = (index) => {
    setComandaItens((current) => (Array.isArray(current) ? current : []).filter((_, itemIndex) => itemIndex !== index))
  }

  const handleServiceChange = (serviceId) => {
    const nextService = (services || []).find((service) => service && String(service.id) === String(serviceId))
    setForm((current) => ({
      ...current,
      service_id: serviceId,
      duration_minutes: nextService?.duration_minutes || current.duration_minutes
    }))
  }

  const handleWhatsApp = (template = 'lembrete') => {
    if (!selectedClient) return alert('Selecione uma cliente.')
    if (!selectedClient.phone) return alert('Cliente sem telefone valido.')

    const textBuilder = appointmentMessageTemplates[template] || appointmentMessageTemplates.lembrete
    const text = textBuilder({
      clientName: selectedClient?.name || form.client_name || 'Cliente',
      date: form.date,
      time: form.time,
      service: selectedService?.name || form.service || 'Atendimento',
      professional: selectedProfessional?.name,
      totalPrice: totalGeral,
      depositAmount
    })
    window.open(buildWhatsAppUrl(selectedClient.phone, text), '_blank', 'noopener,noreferrer')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.client_id && !form.client_name) return alert('Selecione uma cliente ou informe o nome.')
    if (!form.professional_id || !form.date || !form.time) return alert('Preencha profissional, data e horario.')
    if (scheduleConflict) {
      return alert(`Este horario conflita com ${scheduleConflict.is_block ? 'um bloqueio' : scheduleConflict.client_name || 'outro atendimento'} das ${formatTime(scheduleConflict.time)} as ${addMinutesToTime(scheduleConflict.time, scheduleConflict.duration_minutes)}.`)
    }

    setSaving(true)
    try {
      await onSubmit({
        ...form,
        is_block: false,
        duration_minutes: Number(form.duration_minutes || 60),
        client_name: selectedClient?.name || form.client_name,
        service: selectedService?.name || form.service,
        total_price: totalGeral,
        total_cost: totalCost,
        amount_paid: amountPaid,
        payment_method: form.payment_method || 'nao_informado',
        payment_status: form.payment_status || (amountPaid >= totalGeral && totalGeral > 0 ? 'pago' : amountPaid > 0 ? 'sinal' : 'aberto'),
        comanda: comandaItens,
        recurringDates: isRecurring ? recurringDates : []
      })
      onClose()
    } catch (err) {
      alert(`Erro ao salvar: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay active" onClick={onClose} style={{ zIndex: 99999 }}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '92vh', borderRadius: '16px', padding: 0, background: bgMain, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ color: 'var(--primary-color, #e91e63)', fontWeight: 900, margin: 0, fontSize: '1.12rem' }}>
              {editingAppointment ? 'Detalhes do horario' : 'Novo agendamento'}
            </h3>
            <div style={{ color: textSec, fontSize: '0.78rem', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {form.time || '--:--'} {selectedProfessional ? `com ${selectedProfessional.name}` : ''}
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ width: '38px', height: '38px', borderRadius: '50%', border: `1px solid ${borderCol}`, background: bgCard, color: textMain, cursor: 'pointer' }} aria-label="Fechar">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '18px 20px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <section style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="appointment-core-grid">
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: textSec }}>Cliente</label>
                  <select value={form.client_id || ''} onChange={(event) => setForm({ ...form, client_id: event.target.value })} style={selectStyle}>
                    <option value="">{form.client_name ? `${form.client_name} (Avulso)` : 'Selecione...'}</option>
                    {(clients || []).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: textSec }}>Servico</label>
                  <select value={form.service_id || ''} onChange={(event) => handleServiceChange(event.target.value)} style={selectStyle}>
                    <option value="">{form.service ? `${form.service} (${formatCurrency(form.total_price)})` : 'Selecione...'}</option>
                    {(services || []).map((service) => <option key={service.id} value={service.id}>{service.name} ({formatCurrency(service.price)})</option>)}
                  </select>
                </div>
              </div>

              <div className="appointment-schedule-grid">
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: textSec }}>Data</label>
                  <input type="date" required value={form.date || ''} onChange={(event) => setForm({ ...form, date: event.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: textSec }}>Horario</label>
                  <input type="time" required value={form.time || ''} onChange={(event) => setForm({ ...form, time: event.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: textSec }}>Profissional</label>
                  <select required value={form.professional_id || ''} onChange={(event) => setForm({ ...form, professional_id: event.target.value })} style={selectStyle}>
                    {(professionals || []).map((professional) => <option key={professional.id} value={professional.id}>{professional.name}</option>)}
                  </select>
                </div>
              </div>

              {scheduleConflict && (
                <div style={{ background: isLight ? '#fef2f2' : 'rgba(239,68,68,0.13)', color: isLight ? '#991b1b' : '#fecaca', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', padding: '11px 12px', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
                    Horario indisponivel
                  </strong>
                  Conflita com {scheduleConflict.is_block ? 'um bloqueio' : scheduleConflict.client_name || 'outro atendimento'} das {formatTime(scheduleConflict.time)} as {addMinutesToTime(scheduleConflict.time, scheduleConflict.duration_minutes)}.
                  {availableSuggestions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '7px', marginTop: '10px' }}>
                      <span style={{ fontWeight: 800 }}>Livres:</span>
                      {availableSuggestions.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setForm({ ...form, time })}
                          style={{ border: 'none', borderRadius: '999px', background: isLight ? '#ffffff' : 'rgba(255,255,255,0.08)', color: isLight ? '#991b1b' : '#fff', padding: '6px 10px', fontWeight: 900, cursor: 'pointer' }}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: textSec }}>Duracao</label>
                <select value={form.duration_minutes || 60} onChange={(event) => setForm({ ...form, duration_minutes: event.target.value })} style={selectStyle}>
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1 hora e 30 minutos</option>
                  <option value="120">2 horas</option>
                  <option value="150">2 horas e 30 minutos</option>
                  <option value="180">3 horas</option>
                  <option value="240">4 horas</option>
                </select>
              </div>

              {selectedClient?.observation && (
                <div style={{ background: isLight ? '#fff7ed' : 'rgba(245,158,11,0.12)', color: isLight ? '#7c2d12' : '#ffd08a', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '10px', padding: '10px', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '6px' }}></i>
                    Alerta da cliente
                  </strong>
                  {selectedClient.observation}
                </div>
              )}
            </section>

            {/* SEÇÃO DE AGENDAMENTO RECORRENTE */}
            {!editingAppointment && (
              <section style={{ background: bgCard, border: `1px solid ${isRecurring ? 'var(--primary-color, #e91e63)' : borderCol}`, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-arrows-rotate" style={{ color: 'var(--primary-color, #e91e63)' }}></i>
                      Repetir agendamento (Recorrência)
                    </strong>
                    <p style={{ color: textSec, fontSize: '0.76rem', margin: '3px 0 0' }}>
                      Agendar automaticamente a cada 15 dias, 21 dias, semanal ou mensal
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--primary-color, #e91e63)', cursor: 'pointer' }}
                  />
                </div>

                {isRecurring && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '12px', borderTop: `1px solid ${borderCol}` }}>
                    
                    {/* Botões Rápidos de Sugestão / IA */}
                    <div>
                      <label style={{ fontSize: '0.76rem', color: textSec, fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                        ⚡ Sugestões Rápidas:
                      </label>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => { setRecurrenceFreq('biweekly'); setRecurrenceDurationMonths(4); }}
                          style={{ fontSize: '0.72rem', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${recurrenceFreq === 'biweekly' && recurrenceDurationMonths === 4 ? 'var(--primary-color, #e91e63)' : borderCol}`, background: recurrenceFreq === 'biweekly' && recurrenceDurationMonths === 4 ? 'var(--primary-color, #e91e63)' : bgInput, color: recurrenceFreq === 'biweekly' && recurrenceDurationMonths === 4 ? '#fff' : textMain, cursor: 'pointer', fontWeight: 700 }}
                        >
                          💅 A cada 15 dias (4 meses)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRecurrenceFreq('every_3_weeks'); setRecurrenceDurationMonths(4); }}
                          style={{ fontSize: '0.72rem', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${recurrenceFreq === 'every_3_weeks' && recurrenceDurationMonths === 4 ? 'var(--primary-color, #e91e63)' : borderCol}`, background: recurrenceFreq === 'every_3_weeks' && recurrenceDurationMonths === 4 ? 'var(--primary-color, #e91e63)' : bgInput, color: recurrenceFreq === 'every_3_weeks' && recurrenceDurationMonths === 4 ? '#fff' : textMain, cursor: 'pointer', fontWeight: 700 }}
                        >
                          👁️ A cada 21 dias (4 meses)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRecurrenceFreq('weekly'); setRecurrenceDurationMonths(2); }}
                          style={{ fontSize: '0.72rem', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${recurrenceFreq === 'weekly' && recurrenceDurationMonths === 2 ? 'var(--primary-color, #e91e63)' : borderCol}`, background: recurrenceFreq === 'weekly' && recurrenceDurationMonths === 2 ? 'var(--primary-color, #e91e63)' : bgInput, color: recurrenceFreq === 'weekly' && recurrenceDurationMonths === 2 ? '#fff' : textMain, cursor: 'pointer', fontWeight: 700 }}
                        >
                          📅 Semanal (2 meses)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRecurrenceFreq('daily'); setRecurrenceDurationMonths(4); }}
                          style={{ fontSize: '0.72rem', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${recurrenceFreq === 'daily' && recurrenceDurationMonths === 4 ? 'var(--primary-color, #e91e63)' : borderCol}`, background: recurrenceFreq === 'daily' && recurrenceDurationMonths === 4 ? 'var(--primary-color, #e91e63)' : bgInput, color: recurrenceFreq === 'daily' && recurrenceDurationMonths === 4 ? '#fff' : textMain, cursor: 'pointer', fontWeight: 700 }}
                        >
                          ✨ Todo dia (4 meses)
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.78rem', color: textSec }}>Frequência</label>
                        <select value={recurrenceFreq} onChange={(e) => setRecurrenceFreq(e.target.value)} style={selectStyle}>
                          <option value="biweekly">A cada 15 dias (Quinzenal)</option>
                          <option value="every_3_weeks">A cada 21 dias (3 Semanas)</option>
                          <option value="weekly">Semanal (A cada 7 dias)</option>
                          <option value="monthly">Mensal (Mesmo dia do mês)</option>
                          <option value="daily">Todo dia</option>
                          <option value="custom">Personalizado (dias)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.78rem', color: textSec }}>Duração</label>
                        <select value={recurrenceDurationMonths} onChange={(e) => setRecurrenceDurationMonths(Number(e.target.value))} style={selectStyle}>
                          <option value="1">Durante 1 mês</option>
                          <option value="2">Durante 2 meses</option>
                          <option value="3">Durante 3 meses</option>
                          <option value="4">Durante 4 meses</option>
                          <option value="6">Durante 6 meses</option>
                          <option value="12">Durante 1 ano</option>
                        </select>
                      </div>
                    </div>

                    {recurrenceFreq === 'custom' && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.78rem', color: textSec }}>Intervalo em dias</label>
                        <input type="number" min="1" max="90" value={recurrenceCustomDays} onChange={(e) => setRecurrenceCustomDays(Number(e.target.value))} style={inputStyle} />
                      </div>
                    )}

                    {/* Previsão das datas geradas */}
                    <div style={{ background: bgInput, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderCol}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: textMain }}>
                          📅 {recurringDates.length + 1} agendamentos gerados:
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--primary-color, #e91e63)', fontWeight: 800 }}>
                          1 inicial + {recurringDates.length} repetições
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '85px', overflowY: 'auto' }}>
                        <span style={{ fontSize: '0.72rem', background: 'var(--primary-color, #e91e63)', color: '#fff', padding: '3px 7px', borderRadius: '4px', fontWeight: 800 }}>
                          {formatShortDate(form.date)} (1º)
                        </span>
                        {recurringDates.map((rd, idx) => (
                          <span key={rd} style={{ fontSize: '0.72rem', background: isLight ? '#e5e7eb' : '#333', color: textMain, padding: '3px 7px', borderRadius: '4px', fontWeight: 700 }}>
                            {formatShortDate(rd)} ({idx + 2}º)
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </section>
            )}

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {statusOptions.map((status) => {
                const active = form.status === status.id
                return (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => setForm({ ...form, status: status.id })}
                    style={{
                      border: `1px solid ${active ? status.color : borderCol}`,
                      background: active ? status.color : bgCard,
                      color: active ? '#fff' : textSec,
                      borderRadius: '10px',
                      padding: '10px 6px',
                      fontWeight: 800,
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <i className={`fa-solid ${status.icon}`}></i>
                    {status.label}
                  </button>
                )
              })}
            </section>

            <section>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: textSec }}>Observacao para o atendimento</label>
              <textarea
                rows="3"
                value={form.observation || ''}
                onChange={(event) => setForm({ ...form, observation: event.target.value })}
                placeholder="Ex: alergia, preferencia, sinal pago, detalhe do alongamento..."
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.4 }}
              />
            </section>

            <section style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '12px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setShowComanda((current) => !current)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', border: 'none', background: 'transparent', color: textMain, cursor: 'pointer', fontWeight: 900 }}
              >
                <span><i className="fa-solid fa-receipt" style={{ marginRight: '8px', color: 'var(--primary-color, #e91e63)' }}></i>Comanda e extras</span>
                <span style={{ color: 'var(--primary-color, #e91e63)' }}>{formatCurrency(totalGeral)}</span>
              </button>

              {showComanda && (
                <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <select onChange={(event) => { handleAddItem(event.target.value); event.target.value = '' }} style={selectStyle}>
                    <option value="">+ Adicionar produto ou extra...</option>
                    {(products || []).map((product) => (
                      <option key={product.id} value={product.id}>{product.name} (+ {formatCurrency(product.price)})</option>
                    ))}
                  </select>

                  {(!products || products.length === 0) && (
                    <div style={{ color: textSec, fontSize: '0.8rem', lineHeight: 1.35 }}>
                      Cadastre produtos e extras na aba Catalogo &gt; Produtos para usar aqui.
                    </div>
                  )}

                  {Array.isArray(comandaItens) && comandaItens.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {comandaItens.map((item, index) => (
                        <div key={`${item.id}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: bgMain, padding: '9px 10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                          <span style={{ color: textMain }}>{item.name} (x{item.qty || 1})</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <strong style={{ color: textMain }}>{formatCurrency(item.price)}</strong>
                            <button type="button" onClick={() => handleRemoveItem(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.84rem', color: textSec }}>
                    <span>Servico</span><strong style={{ color: textMain, textAlign: 'right' }}>{formatCurrency(servicePrice)}</strong>
                    <span>Extras</span><strong style={{ color: textMain, textAlign: 'right' }}>{formatCurrency(extrasPrice)}</strong>
                  </div>

                  <div style={{ borderTop: `1px solid ${borderCol}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.78rem', color: textSec }}>Valor recebido</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.amount_paid ?? 0}
                          onChange={(event) => {
                            const nextAmount = Number(event.target.value || 0)
                            setForm({
                              ...form,
                              amount_paid: event.target.value,
                              payment_status: nextAmount >= totalGeral && totalGeral > 0 ? 'pago' : nextAmount > 0 ? 'sinal' : 'aberto'
                            })
                          }}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.78rem', color: textSec }}>Forma</label>
                        <select value={form.payment_method || 'nao_informado'} onChange={(event) => setForm({ ...form, payment_method: event.target.value })} style={selectStyle}>
                          {paymentMethodOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {depositAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm({
                          ...form,
                          amount_paid: depositAmount,
                          payment_status: 'sinal',
                          payment_method: form.payment_method === 'nao_informado' ? 'pix' : form.payment_method
                        })}
                        style={{
                          border: '1px solid rgba(59,130,246,0.4)',
                          background: isLight ? '#eff6ff' : 'rgba(59,130,246,0.12)',
                          color: isLight ? '#1d4ed8' : '#bfdbfe',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          fontWeight: 900,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <i className="fa-solid fa-bolt" style={{ marginRight: '7px' }}></i>
                        Lançar sinal 30% ({formatCurrency(depositAmount)})
                      </button>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {paymentStatusOptions.map((option) => {
                        const active = (form.payment_status || 'aberto') === option.id
                        return (
                          <button
                            type="button"
                            key={option.id}
                            onClick={() => setForm({ ...form, payment_status: option.id })}
                            style={{ border: `1px solid ${active ? option.color : borderCol}`, background: active ? option.color : bgMain, color: active ? '#fff' : textSec, borderRadius: '8px', padding: '9px 5px', fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer' }}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.84rem', color: textSec }}>
                      <span>Recebido</span><strong style={{ color: '#10b981', textAlign: 'right' }}>{formatCurrency(amountPaid)}</strong>
                      <span>Falta receber</span><strong style={{ color: amountPending > 0 ? '#f59e0b' : textMain, textAlign: 'right' }}>{formatCurrency(amountPending)}</strong>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div style={{ padding: '14px 20px 28px', borderTop: `1px solid ${borderCol}`, background: bgMain, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: textMain }}>
              <span style={{ color: textSec, fontWeight: 700 }}>Total da comanda</span>
              <strong style={{ color: 'var(--primary-color, #e91e63)', fontSize: '1.18rem' }}>{formatCurrency(totalGeral)}</strong>
            </div>
            {depositAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: textSec, fontSize: '0.82rem' }}>
                <span>Sinal sugerido 30%</span>
                <strong style={{ color: '#93c5fd' }}>{formatCurrency(depositAmount)}</strong>
              </div>
            )}
            {amountPaid > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: textSec, fontSize: '0.82rem' }}>
                <span>Recebido {formatCurrency(amountPaid)}</span>
                <span>Aberto {formatCurrency(amountPending)}</span>
              </div>
            )}

            {editingAppointment && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <button type="button" onClick={() => handleWhatsApp('confirmacao')} style={{ padding: '11px 6px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.72rem' }}>
                  <i className="fa-brands fa-whatsapp" style={{ marginRight: '5px' }}></i>Confirmar
                </button>
                <button type="button" onClick={() => handleWhatsApp('lembrete')} style={{ padding: '11px 6px', background: '#128C7E', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.72rem' }}>
                  Lembrete
                </button>
                <button type="button" onClick={() => handleWhatsApp('reagendamento')} style={{ padding: '11px 6px', background: bgCard, color: textMain, border: `1px solid ${borderCol}`, borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.72rem' }}>
                  Reagendar
                </button>
                <button type="button" onClick={() => handleWhatsApp('posAtendimento')} style={{ padding: '11px 6px', background: bgCard, color: textMain, border: `1px solid ${borderCol}`, borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.72rem' }}>
                  Obrigada
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              {form.id && onDelete && (
                <button type="button" onClick={() => { if (window.confirm('Remover agendamento?')) { onDelete(form.id); onClose() } }} style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}>Excluir</button>
              )}
              <button type="button" onClick={onClose} disabled={saving} style={{ flex: 1, background: 'transparent', color: textMain, border: `1px solid ${borderCol}`, borderRadius: '8px', padding: '12px', cursor: 'pointer', fontWeight: 800 }}>Voltar</button>
              <button type="submit" disabled={saving || Boolean(scheduleConflict)} style={{ flex: 2, background: 'var(--primary-color, #e91e63)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 900, padding: '12px', cursor: scheduleConflict ? 'not-allowed' : 'pointer', opacity: saving || scheduleConflict ? 0.7 : 1 }}>
                {saving ? 'Gravando...' : scheduleConflict ? 'Horario ocupado' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
