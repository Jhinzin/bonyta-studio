import React, { useMemo, useState } from 'react'
import { appointmentMessageTemplates, buildWhatsAppUrl } from '../utils/whatsapp'

const typeMeta = {
  lembrete: { label: 'Lembrete', color: '#0ea5e9', icon: 'fa-clock' },
  confirmacao: { label: 'Confirmação', color: '#10b981', icon: 'fa-calendar-check' },
  manutencao: { label: 'Manutenção', color: '#e91e63', icon: 'fa-wand-magic-sparkles' },
  reativacao: { label: 'Reativação', color: '#f59e0b', icon: 'fa-heart' }
}

const dateTimeLabel = (date) => date.toLocaleString('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})

const overdueLabel = (dueAt, now) => {
  const differenceDays = Math.floor((now.getTime() - dueAt.getTime()) / (24 * 60 * 60 * 1000))
  if (differenceDays <= 0) return 'Enviar hoje'
  if (differenceDays === 1) return 'Atrasada há 1 dia'
  return `Atrasada há ${differenceDays} dias`
}

export default function CommunicationCenterModal({
  open,
  onClose,
  theme,
  tasks = [],
  onLogMessage
}) {
  const [filter, setFilter] = useState('pendentes')
  const now = new Date()
  const isLight = theme === 'light'
  const bgMain = isLight ? '#f7f7f8' : '#101011'
  const bgCard = isLight ? '#ffffff' : '#202022'
  const textMain = isLight ? '#18181b' : '#ffffff'
  const textSec = isLight ? '#71717a' : '#a1a1aa'
  const border = isLight ? '#e4e4e7' : '#343438'

  const visibleTasks = useMemo(() => {
    if (filter === 'agenda') return tasks.filter((task) => ['confirmacao', 'lembrete'].includes(task.type))
    if (filter === 'retornos') return tasks.filter((task) => ['manutencao', 'reativacao'].includes(task.type))
    return tasks
  }, [filter, tasks])

  if (!open) return null

  const sendTask = async (task) => {
    const phone = task.client?.phone
    if (!phone) {
      alert('Esta cliente ainda não tem WhatsApp cadastrado.')
      return
    }

    const appointment = task.appointment || {}
    const template = appointmentMessageTemplates[task.messageType]
    const message = template({
      clientName: task.client?.name || appointment.client_name,
      date: appointment.date,
      time: appointment.time,
      service: appointment.service,
      professional: task.professional?.name,
      totalPrice: appointment.total_price,
      maintenanceDays: task.maintenanceDays
    })

    window.open(buildWhatsAppUrl(phone, message), '_blank', 'noopener,noreferrer')

    try {
      await onLogMessage?.({
        client_id: task.client?.id || appointment.client_id || null,
        appointment_id: appointment.id || null,
        professional_id: appointment.professional_id || null,
        message_type: task.messageType,
        recipient_name: task.client?.name || appointment.client_name,
        recipient_phone: phone,
        message_body: message,
        status: 'sent'
      })
    } catch (error) {
      console.warn('Não foi possível registrar a mensagem:', error)
    }
  }

  const agendaCount = tasks.filter((task) => ['confirmacao', 'lembrete'].includes(task.type)).length
  const returnCount = tasks.filter((task) => ['manutencao', 'reativacao'].includes(task.type)).length

  return (
    <div className="modal-overlay active" style={{ zIndex: 99999 }}>
      <div className="modal-box" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh', padding: 0, background: bgMain }}>
        <header style={{ padding: '20px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: 'var(--primary-color, #e91e63)', fontWeight: 900, margin: 0 }}>
              <i className="fa-solid fa-comments" style={{ marginRight: '8px' }} /> Central de mensagens
            </h3>
            <p style={{ color: textSec, fontSize: '0.78rem', margin: '5px 0 0' }}>O app organiza. Você confere e envia pelo WhatsApp.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" style={{ width: 38, height: 38, borderRadius: '50%', border: `1px solid ${border}`, background: bgCard, color: textMain, cursor: 'pointer' }}>
            <i className="fa-solid fa-times" />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'grid', alignContent: 'start', gap: '14px' }}>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { id: 'pendentes', label: 'Todas', count: tasks.length },
              { id: 'agenda', label: 'Agenda', count: agendaCount },
              { id: 'retornos', label: 'Retornos', count: returnCount }
            ].map((item) => (
              <button key={item.id} type="button" onClick={() => setFilter(item.id)} style={{ border: `1px solid ${filter === item.id ? 'var(--primary-color, #e91e63)' : border}`, borderRadius: 12, padding: '10px 6px', background: filter === item.id ? 'rgba(233,30,99,.13)' : bgCard, color: filter === item.id ? 'var(--primary-color, #e91e63)' : textSec, cursor: 'pointer', fontWeight: 900 }}>
                {item.label} <span style={{ opacity: 0.8 }}>({item.count})</span>
              </button>
            ))}
          </section>

          <div style={{ padding: '12px 14px', borderRadius: 14, background: isLight ? '#fff7ed' : 'rgba(245,158,11,.11)', border: '1px solid rgba(245,158,11,.32)', color: isLight ? '#9a3412' : '#fed7aa', fontSize: '0.78rem', lineHeight: 1.45 }}>
            <strong>Modo gratuito:</strong> os prazos são automáticos; o envio ainda precisa do seu toque. Assim o número da Bonyta permanece seguro.
          </div>

          {visibleTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '42px 22px', borderRadius: 16, background: bgCard, border: `1px dashed ${border}`, color: textSec }}>
              <i className="fa-solid fa-circle-check" style={{ display: 'block', fontSize: '2rem', color: '#10b981', marginBottom: 10 }} />
              Nenhuma mensagem pendente nesta categoria.
            </div>
          ) : visibleTasks.map((task) => {
            const meta = typeMeta[task.type]
            const appointment = task.appointment || {}
            const needsMarketingConsent = ['manutencao', 'reativacao'].includes(task.type)
              && task.client?.whatsapp_marketing_opt_in !== true
            return (
              <article key={task.id} style={{ padding: 15, borderRadius: 16, background: bgCard, border: `1px solid ${border}`, borderLeft: `4px solid ${meta.color}`, display: 'grid', gap: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: meta.color, fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      <i className={`fa-solid ${meta.icon}`} /> {meta.label}
                    </span>
                    <h4 style={{ color: textMain, margin: '5px 0 0', fontSize: '0.96rem' }}>{task.title}</h4>
                    <p style={{ color: textSec, margin: '4px 0 0', fontSize: '0.77rem', lineHeight: 1.4 }}>{task.description}</p>
                  </div>
                  <span style={{ flexShrink: 0, borderRadius: 999, padding: '5px 8px', background: `${meta.color}20`, color: meta.color, fontSize: '0.65rem', fontWeight: 900 }}>
                    {overdueLabel(task.dueAt, now)}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, color: textSec, fontSize: '0.72rem' }}>
                  {appointment.date && <span>{appointment.date.split('-').reverse().join('/')} às {String(appointment.time || '').slice(0, 5)}</span>}
                  {task.professional?.name && <span>· {task.professional.name}</span>}
                  <span>· previsto {dateTimeLabel(task.dueAt)}</span>
                </div>

                {needsMarketingConsent && (
                  <div style={{ padding: '8px 10px', borderRadius: 9, background: 'rgba(245,158,11,.12)', color: isLight ? '#9a3412' : '#fed7aa', fontSize: '0.7rem' }}>
                    Consentimento para manutenção/novidades ainda não está registrado. Confirme com a cliente antes do envio.
                  </div>
                )}

                <button type="button" onClick={() => sendTask(task)} style={{ width: '100%', padding: '11px 14px', border: 'none', borderRadius: 11, background: '#25D366', color: '#fff', cursor: 'pointer', fontWeight: 900 }}>
                  <i className="fa-brands fa-whatsapp" style={{ marginRight: 7 }} /> Abrir mensagem pronta
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
