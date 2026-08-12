import React, { useState } from 'react'
import { buildWhatsAppUrl } from '../utils/whatsapp'

export default function WaitlistModal({
  open,
  onClose,
  clients,
  services,
  professionals,
  defaultDate,
  theme,
  waitlist = [],
  loading = false,
  error = null,
  onAdd,
  onRemove
}) {
  const [form, setForm] = useState({ client_id: '', service_id: '', professional_id: 'qualquer' })
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const isLight = theme === 'light'
  const bgMain = isLight ? '#f9f9f9' : '#121212'
  const bgCard = isLight ? '#ffffff' : '#222'
  const textMain = isLight ? '#333' : '#fff'
  const textSec = isLight ? '#666' : '#aaa'
  const borderCol = isLight ? '#ddd' : '#333'

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${borderCol}`,
    background: bgCard,
    color: textMain,
    outline: 'none',
    fontSize: '0.9rem',
    marginBottom: '12px'
  }

  const todaysWaitlist = waitlist.filter((item) => item.preferred_date === defaultDate)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.client_id || !form.service_id) return alert('Selecione cliente e serviço.')

    setSaving(true)
    try {
      await onAdd({
        client_id: form.client_id,
        service_id: form.service_id,
        professional_id: form.professional_id === 'qualquer' ? null : form.professional_id,
        preferred_date: defaultDate
      })
      setForm({ client_id: '', service_id: '', professional_id: 'qualquer' })
    } catch (err) {
      alert(`Erro ao salvar lista de espera: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id) => {
    try {
      await onRemove(id)
    } catch (err) {
      alert(`Erro ao remover da lista: ${err.message}`)
    }
  }

  const handleNotify = (item) => {
    const client = clients.find((candidate) => String(candidate.id) === String(item.client_id))
    const service = services.find((candidate) => String(candidate.id) === String(item.service_id))
    if (!client) return

    const phone = String(client.phone || '').replace(/\D/g, '')
    if (!phone) return alert('Cliente sem telefone válido.')

    const firstName = client.name.split(' ')[0]
    const text = `Olá, ${firstName}! Aqui é do Bonyta Studio. Surgiu uma vaga para hoje para fazer *${service?.name || 'seu serviço'}*. Você ainda tem interesse em vir?`
    window.open(buildWhatsAppUrl(phone, text), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="modal-overlay active" style={{ zIndex: 99999 }}>
      <div className="modal-box" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh', padding: 0, background: bgMain }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#3b82f6', fontWeight: 'bold', margin: 0 }}>
            <i className="fa-solid fa-clipboard-list" style={{ marginRight: '8px' }}></i> Lista de Espera
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: textMain, fontSize: '1.2rem', cursor: 'pointer' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ background: bgCard, padding: '16px', borderRadius: '12px', border: `1px solid ${borderCol}`, marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: textMain, fontSize: '0.95rem' }}>Adicionar para {defaultDate.split('-').reverse().join('/')}</h4>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              <select value={form.client_id} onChange={(event) => setForm({ ...form, client_id: event.target.value })} style={inputStyle} required>
                <option value="">1. Selecione a cliente...</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>

              <select value={form.service_id} onChange={(event) => setForm({ ...form, service_id: event.target.value })} style={inputStyle} required>
                <option value="">2. Selecione o serviço...</option>
                {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>

              <select value={form.professional_id} onChange={(event) => setForm({ ...form, professional_id: event.target.value })} style={inputStyle}>
                <option value="qualquer">3. Qualquer profissional</option>
                {professionals.map((professional) => <option key={professional.id} value={professional.id}>Apenas com: {professional.name}</option>)}
              </select>

              <button type="submit" disabled={saving} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : 'Colocar na fila'}
              </button>
            </form>
          </div>

          <h4 style={{ margin: '0 0 12px 0', color: textSec, fontSize: '0.85rem', textTransform: 'uppercase' }}>Aguardando vaga neste dia</h4>

          {error && (
            <div style={{ marginBottom: '12px', padding: '12px', color: '#ff9a9a', background: 'rgba(239,68,68,.14)', borderRadius: '10px', fontSize: '0.85rem' }}>
              Erro ao carregar lista de espera: {error.message}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: textSec, background: bgCard, borderRadius: '12px', border: `1px dashed ${borderCol}` }}>
              Carregando lista de espera...
            </div>
          ) : todaysWaitlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: textSec, background: bgCard, borderRadius: '12px', border: `1px dashed ${borderCol}` }}>
              Ninguém na lista de espera para este dia.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todaysWaitlist.map((item) => {
                const client = clients.find((candidate) => String(candidate.id) === String(item.client_id))
                const service = services.find((candidate) => String(candidate.id) === String(item.service_id))
                const professional = professionals.find((candidate) => String(candidate.id) === String(item.professional_id))

                return (
                  <div key={item.id} style={{ background: bgCard, padding: '16px', borderRadius: '12px', border: `1px solid ${borderCol}` }}>
                    <div style={{ fontWeight: 'bold', color: textMain, fontSize: '0.95rem' }}>{client?.name || 'Cliente removida'}</div>
                    <div style={{ color: 'var(--primary-color, #e91e63)', fontSize: '0.8rem', margin: '4px 0' }}>{service?.name || 'Serviço removido'}</div>
                    <div style={{ color: textSec, fontSize: '0.75rem' }}>
                      <i className="fa-solid fa-user" style={{ marginRight: '4px' }}></i>
                      {professional ? professional.name : 'Qualquer profissional'}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button type="button" onClick={() => handleRemove(item.id)} style={{ flex: 1, padding: '8px', background: 'transparent', border: `1px solid ${borderCol}`, color: textSec, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        Remover
                      </button>
                      <button type="button" onClick={() => handleNotify(item)} style={{ flex: 2, padding: '8px', background: '#25D366', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <i className="fa-brands fa-whatsapp"></i> Avisar vaga
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
