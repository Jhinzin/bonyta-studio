import React, { useState, useMemo } from 'react'

export default function AiStaffAssistantModal({
  isOpen,
  onClose,
  appointments = [],
  professionals = [],
  services = [],
  onUpdateAppointment,
  onDeleteAppointment,
  onCreateAppointment,
  addToast
}) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Olá! Sou a assistente inteligente da agenda Bonyta 💖 O que você precisa fazer hoje? (Ex: "Desmarcar a Maria", "Mudar horário da Paula para amanhã 15h", "Buscar agendamentos da Carol")'
    }
  ])
  const [input, setInput] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  // Mapeia ID do profissional -> Nome
  const getProfName = (profId) => {
    const p = professionals.find((item) => String(item.id) === String(profId))
    return p ? p.name : 'Equipe Bonyta'
  }

  // Função auxiliar para normalizar texto (sem acentos, em minúsculas)
  const normalize = (text = '') =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()

  // Extrai intenção e detalhes do prompt
  const parsePrompt = (userPrompt) => {
    const raw = normalize(userPrompt)
    const activeApps = appointments.filter((a) => !a.is_block && a.status !== 'cancelado')

    let actionType = 'search' // 'cancel' | 'reschedule' | 'search' | 'create'
    if (raw.includes('cancel') || raw.includes('desmarc') || raw.includes('excluir') || raw.includes('apagar') || raw.includes('remover')) {
      actionType = 'cancel'
    } else if (raw.includes('muda') || raw.includes('altera') || raw.includes('reagend') || raw.includes('troca') || raw.includes('move') || raw.includes('passa')) {
      actionType = 'reschedule'
    } else if (raw.includes('nov') || raw.includes('marcar') || raw.includes('agendar')) {
      actionType = 'create'
    }

    // Busca agendamentos correspondentes pelo nome do cliente ou serviço
    const matches = activeApps.filter((app) => {
      const clientName = normalize(app.client_name || '')
      const serviceName = normalize(app.service || '')
      
      // Procura palavras com mais de 2 letras no prompt que apareçam no nome
      const words = raw.split(/\s+/).filter(w => w.length > 2 && !['para', 'com', 'as', 'que', 'hoje', 'amanha', 'semana', 'horario', 'agendamento', 'cliente'].includes(w))
      if (words.length === 0) return false

      return words.some(word => clientName.includes(word) || serviceName.includes(word))
    })

    return { actionType, matches, raw }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userText = input.trim()
    setMessages((prev) => [...prev, { sender: 'user', text: userText }])
    setInput('')
    setLoading(true)

    setTimeout(() => {
      const { actionType, matches, raw } = parsePrompt(userText)

      if (matches.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: 'Não encontrei nenhum agendamento ativo com esse nome ou serviço. Verifique a grafia ou pesquise o nome da cliente.'
          }
        ])
        setPendingAction(null)
        setLoading(false)
        return
      }

      if (actionType === 'cancel') {
        const target = matches[0]
        setPendingAction({
          type: 'cancel',
          appointment: target
        })
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `Localizei o agendamento de **${target.client_name}** (${target.service || 'Serviço'}) no dia **${formatDisplayDate(target.date)} às ${target.time?.slice(0, 5)}** com **${getProfName(target.professional_id)}**. Confirma o cancelamento?`
          }
        ])
      } else if (actionType === 'reschedule') {
        const target = matches[0]
        // Tenta inferir novo horário se mencionado
        let guessedDate = target.date
        if (raw.includes('amanha')) {
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          guessedDate = tomorrow.toISOString().slice(0, 10)
        } else if (raw.includes('hoje')) {
          guessedDate = new Date().toISOString().slice(0, 10)
        }

        // Tenta extrair hora (ex: 15h, 15:00)
        let guessedTime = target.time
        const timeMatch = raw.match(/(\d{1,2})h|(\d{1,2}:\d{2})/)
        if (timeMatch) {
          const hour = timeMatch[1] || timeMatch[2]?.split(':')[0]
          const min = timeMatch[2]?.split(':')[1] || '00'
          guessedTime = `${hour.padStart(2, '0')}:${min}`
        }

        setPendingAction({
          type: 'reschedule',
          appointment: target,
          newDate: guessedDate,
          newTime: guessedTime,
          newProfId: target.professional_id
        })
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `Encontrei o agendamento de **${target.client_name}**. Escolha abaixo a nova data e horário para confirmar o reagendamento:`
          }
        ])
      } else {
        // Modo Busca
        setPendingAction(null)
        const listText = matches
          .slice(0, 3)
          .map(
            (m) =>
              `• **${m.client_name}** - ${m.service || 'Procedimento'} em ${formatDisplayDate(m.date)} às ${m.time?.slice(0, 5)} com ${getProfName(m.professional_id)} [Status: ${m.status || 'pendente'}]`
          )
          .join('\n')

        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `Encontrei ${matches.length} agendamento(s):\n\n${listText}`
          }
        ])
      }

      setLoading(false)
    }, 400)
  }

  const confirmCancel = async () => {
    if (!pendingAction?.appointment) return
    setLoading(true)
    try {
      // Atualiza o status para 'cancelado'
      await onUpdateAppointment(pendingAction.appointment.id, { status: 'cancelado' })
      addToast?.('Agendamento cancelado com sucesso!', 'success')
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `✅ O agendamento de **${pendingAction.appointment.client_name}** foi marcado como **cancelado** com sucesso!`
        }
      ])
      setPendingAction(null)
    } catch (err) {
      addToast?.('Erro ao cancelar agendamento: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const confirmReschedule = async () => {
    if (!pendingAction?.appointment || !pendingAction.newDate || !pendingAction.newTime) return
    setLoading(true)
    try {
      await onUpdateAppointment(pendingAction.appointment.id, {
        date: pendingAction.newDate,
        time: pendingAction.newTime,
        professional_id: pendingAction.newProfId
      })
      addToast?.('Agendamento alterado com sucesso!', 'success')
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `✅ Agendamento de **${pendingAction.appointment.client_name}** reagendado para **${formatDisplayDate(pendingAction.newDate)} às ${pendingAction.newTime.slice(0, 5)}** com sucesso!`
        }
      ])
      setPendingAction(null)
    } catch (err) {
      addToast?.('Erro ao reagendar: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatDisplayDate = (isoDate) => {
    if (!isoDate) return ''
    const [y, m, d] = isoDate.split('-')
    return `${d}/${m}/${y}`
  }

  const handleQuickChip = (text) => {
    setInput(text)
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '94%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          background: 'var(--bg-secondary, #18181b)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}
      >
        {/* Header do Modal */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            padding: '16px 20px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Assistente de Agenda IA</h3>
              <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Altere ou cancele agendamentos digitando</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {/* Chips de Ação Rápida */}
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            background: 'rgba(0,0,0,0.15)'
          }}
        >
          <button
            type="button"
            onClick={() => handleQuickChip('Desmarcar ')}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              borderRadius: '20px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: 600
            }}
          >
            ❌ Desmarcar agendamento
          </button>
          <button
            type="button"
            onClick={() => handleQuickChip('Mudar horário de ')}
            style={{
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#c084fc',
              borderRadius: '20px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: 600
            }}
          >
            📅 Reagendar horário
          </button>
          <button
            type="button"
            onClick={() => handleQuickChip('Buscar ')}
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#60a5fa',
              borderRadius: '20px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: 600
            }}
          >
            🔍 Localizar cliente
          </button>
        </div>

        {/* Área de Conversa */}
        <div
          style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            minHeight: '260px',
            maxHeight: '380px'
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'user' ? 'var(--accent-pink, #ec4899)' : 'var(--bg-tertiary, #27272a)',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '14px',
                maxWidth: '88%',
                fontSize: '0.9rem',
                lineHeight: '1.45',
                whiteSpace: 'pre-wrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              {msg.text}
            </div>
          ))}

          {/* Card de Confirmação Pendente */}
          {pendingAction && (
            <div
              style={{
                background: 'rgba(236, 72, 153, 0.1)',
                border: '1px solid var(--accent-pink, #ec4899)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginTop: '6px'
              }}
            >
              <strong style={{ color: 'var(--accent-pink, #ec4899)', fontSize: '0.9rem' }}>
                {pendingAction.type === 'cancel' ? '⚠️ Confirmar Cancelamento' : '📅 Ajustar Reagendamento'}
              </strong>

              {pendingAction.type === 'reschedule' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>Nova Data:</label>
                    <input
                      type="date"
                      value={pendingAction.newDate}
                      onChange={(e) => setPendingAction({ ...pendingAction, newDate: e.target.value })}
                      style={{
                        width: '100%',
                        background: '#09090b',
                        border: '1px solid #3f3f46',
                        color: '#fff',
                        borderRadius: '6px',
                        padding: '6px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>Novo Horário:</label>
                    <input
                      type="time"
                      value={pendingAction.newTime}
                      onChange={(e) => setPendingAction({ ...pendingAction, newTime: e.target.value })}
                      style={{
                        width: '100%',
                        background: '#09090b',
                        border: '1px solid #3f3f46',
                        color: '#fff',
                        borderRadius: '6px',
                        padding: '6px'
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #52525b',
                    color: '#ccc',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={pendingAction.type === 'cancel' ? confirmCancel : confirmReschedule}
                  disabled={loading}
                  style={{
                    background: pendingAction.type === 'cancel' ? '#ef4444' : '#ec4899',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Processando...' : pendingAction.type === 'cancel' ? 'Confirmar Cancelamento' : 'Salvar Novo Horário'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Form de Envio */}
        <form
          onSubmit={handleSend}
          style={{
            display: 'flex',
            padding: '12px',
            borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))',
            background: 'var(--bg-primary, #09090b)'
          }}
        >
          <input
            type="text"
            placeholder="Digite aqui (ex: 'Cancela o horário da Maria')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              background: 'var(--bg-secondary, #18181b)',
              border: '1px solid var(--border-color, #3f3f46)',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#ffffff',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '10px',
              padding: '0 18px',
              marginLeft: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: loading || !input.trim() ? 0.5 : 1
            }}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}
