import React, { useMemo, useState } from 'react'
import { useClients } from '../hooks/useClients'
import { buildWhatsAppUrl, firstName } from '../utils/whatsapp'

const emptyClient = {
  name: '',
  phone: '',
  cpf: '',
  birth_date: '',
  email: '',
  address: '',
  observation: ''
}

const onlyDigits = (value) => String(value || '').replace(/\D/g, '')

const formatDate = (value) => {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

const nextBirthdayLabel = (birthDate) => {
  if (!birthDate) return null

  const [year, month, day] = birthDate.split('-').map(Number)
  if (!year || !month || !day) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const nextBirthday = new Date(today.getFullYear(), month - 1, day)
  if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1)

  const diffDays = Math.round((nextBirthday - today) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Aniversario hoje'
  if (diffDays <= 30) return `Aniversario em ${diffDays} dias`
  return null
}

export default function ClientsView({ theme }) {
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [showMoreFields, setShowMoreFields] = useState(false)
  const [query, setQuery] = useState('')
  const [formData, setFormData] = useState(emptyClient)

  const isLight = theme === 'light'
  const bgMain = isLight ? '#f9f9f9' : '#121212'
  const bgCard = isLight ? '#ffffff' : '#2a2a2a'
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

  const filteredClients = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return clients

    return clients.filter((client) => {
      const haystack = `${client.name || ''} ${client.phone || ''} ${client.observation || ''}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [clients, query])

  const clientsWithNotes = clients.filter((client) => client.observation).length
  const clientsWithPhone = clients.filter((client) => client.phone).length

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client)
      setFormData({ ...emptyClient, ...client, birth_date: client.birth_date || '' })
      setShowMoreFields(Boolean(client.email || client.address || client.cpf))
    } else {
      setEditingClient(null)
      setFormData(emptyClient)
      setShowMoreFields(false)
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const payload = { ...formData }
    if (!payload.birth_date) payload.birth_date = null

    if (editingClient) await updateClient(editingClient.id, payload)
    else await createClient(payload)

    setIsModalOpen(false)
  }

  const openWhatsApp = (event, client) => {
    event.stopPropagation()
    const phone = onlyDigits(client.phone)
    if (!phone) return alert('Cliente sem WhatsApp cadastrado.')

    const text = `Olá, ${firstName(client.name)}! Aqui é do Bonyta Studio 💖`
    window.open(buildWhatsAppUrl(phone, text), '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: textMain, margin: 0 }}>Clientes</h2>
          <p style={{ color: textSec, fontSize: '0.82rem', marginTop: '4px' }}>{clients.length} cadastradas</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          style={{ background: 'var(--primary-color, #e91e63)', color: '#fff', padding: '11px 14px', borderRadius: '8px', border: 'none', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i> Nova
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
        <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '10px', padding: '10px' }}>
          <div style={{ color: textSec, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Total</div>
          <strong style={{ color: textMain, fontSize: '1.1rem' }}>{clients.length}</strong>
        </div>
        <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '10px', padding: '10px' }}>
          <div style={{ color: textSec, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>WhatsApp</div>
          <strong style={{ color: textMain, fontSize: '1.1rem' }}>{clientsWithPhone}</strong>
        </div>
        <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '10px', padding: '10px' }}>
          <div style={{ color: textSec, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Com alerta</div>
          <strong style={{ color: textMain, fontSize: '1.1rem' }}>{clientsWithNotes}</strong>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: textSec }}></i>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome, telefone ou observacao..."
          style={{ ...inputStyle, paddingLeft: '40px' }}
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: textSec }}>Carregando...</div>
      ) : filteredClients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: bgCard, borderRadius: '12px', border: `1px dashed ${borderCol}` }}>
          <i className="fa-solid fa-users" style={{ fontSize: '2.4rem', color: textSec, marginBottom: '14px' }}></i>
          <p style={{ color: textSec }}>{clients.length === 0 ? 'Sua lista de clientes esta vazia.' : 'Nenhuma cliente encontrada.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filteredClients.map((client) => {
            const birthday = nextBirthdayLabel(client.birth_date)
            const hasObservation = Boolean(client.observation)

            return (
              <button
                type="button"
                key={client.id}
                onClick={() => handleOpenModal(client)}
                style={{ background: bgCard, padding: '14px', borderRadius: '12px', cursor: 'pointer', border: `1px solid ${borderCol}`, borderLeft: hasObservation ? '4px solid #f59e0b' : '4px solid #4caf50', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.04rem', fontWeight: 900, margin: 0, color: textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</h3>
                    <div style={{ fontSize: '0.82rem', color: textSec, marginTop: '4px' }}>
                      <i className="fa-brands fa-whatsapp" style={{ marginRight: '6px', color: client.phone ? '#25D366' : textSec }}></i>
                      {client.phone || 'Sem telefone'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => openWhatsApp(event, client)}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', border: 'none', background: client.phone ? '#25D366' : borderCol, color: '#fff', cursor: client.phone ? 'pointer' : 'not-allowed', flexShrink: 0 }}
                    aria-label="Abrir WhatsApp"
                  >
                    <i className="fa-brands fa-whatsapp"></i>
                  </button>
                </div>

                {(birthday || client.birth_date) && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ color: birthday ? '#fff' : textSec, background: birthday ? 'var(--primary-color, #e91e63)' : bgInput, border: `1px solid ${birthday ? 'transparent' : borderCol}`, borderRadius: '999px', padding: '5px 9px', fontSize: '0.72rem', fontWeight: 800 }}>
                      <i className="fa-solid fa-cake-candles" style={{ marginRight: '5px' }}></i>
                      {birthday || formatDate(client.birth_date)}
                    </span>
                  </div>
                )}

                {hasObservation && (
                  <div style={{ background: isLight ? '#fff7ed' : 'rgba(245,158,11,0.12)', color: isLight ? '#7c2d12' : '#ffd08a', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '8px', padding: '9px', fontSize: '0.8rem', lineHeight: 1.35 }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '6px' }}></i>
                    {client.observation}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', zIndex: 99999 }}>
          <div style={{ background: bgMain, width: '100%', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: textMain, margin: 0 }}>{editingClient ? 'Ficha da cliente' : 'Nova cliente'}</h3>
                <p style={{ color: textSec, fontSize: '0.78rem', marginTop: '4px' }}>Dados, preferencias e alertas do atendimento</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ width: '38px', height: '38px', borderRadius: '50%', border: `1px solid ${borderCol}`, background: bgCard, color: textMain, cursor: 'pointer' }}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec }}>Nome *</label>
                    <input type="text" required value={formData.name || ''} onChange={(event) => setFormData({ ...formData, name: event.target.value })} style={inputStyle} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec }}>WhatsApp / telefone</label>
                    <input type="tel" placeholder="(11) 99999-9999" value={formData.phone || ''} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} style={inputStyle} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec }}>Aniversario</label>
                      <input type="date" value={formData.birth_date || ''} onChange={(event) => setFormData({ ...formData, birth_date: event.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec }}>CPF</label>
                      <input type="text" placeholder="000.000.000-00" value={formData.cpf || ''} onChange={(event) => setFormData({ ...formData, cpf: event.target.value })} style={inputStyle} />
                    </div>
                  </div>
                </section>

                <section style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '12px', padding: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec, fontWeight: 800 }}>Anamnese, preferencias e alertas</label>
                  <textarea
                    rows="5"
                    value={formData.observation || ''}
                    onChange={(event) => setFormData({ ...formData, observation: event.target.value })}
                    placeholder="Ex: alergia a produto, unha sensivel, prefere formato amendoado, nao usar cabine forte, sinal pago..."
                    style={{ ...inputStyle, resize: 'none', lineHeight: 1.4 }}
                  />
                </section>

                <button
                  type="button"
                  onClick={() => setShowMoreFields(!showMoreFields)}
                  style={{ background: 'transparent', border: `1px solid ${borderCol}`, color: textSec, padding: '11px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}
                >
                  {showMoreFields ? 'Ocultar dados extras' : 'Mostrar email e endereco'}
                </button>

                {showMoreFields && (
                  <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: bgCard, padding: '14px', borderRadius: '12px', border: `1px solid ${borderCol}` }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec }}>E-mail</label>
                      <input type="email" value={formData.email || ''} onChange={(event) => setFormData({ ...formData, email: event.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec }}>Endereco</label>
                      <input type="text" value={formData.address || ''} onChange={(event) => setFormData({ ...formData, address: event.target.value })} style={inputStyle} />
                    </div>
                  </section>
                )}
              </div>

              <div style={{ padding: '14px 20px 28px', borderTop: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', background: 'var(--primary-color, #e91e63)', color: '#fff', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' }}>
                  Salvar cliente
                </button>

                {editingClient && (
                  <button type="button" onClick={async () => { if (window.confirm('Excluir cliente?')) { await deleteClient(editingClient.id); setIsModalOpen(false) } }} style={{ width: '100%', padding: '13px', borderRadius: '8px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer' }}>
                    Excluir cliente
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
