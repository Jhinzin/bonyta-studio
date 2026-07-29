import React, { useEffect, useState } from 'react'

const roleLabels = {
  owner: 'Dona/Admin total',
  manager: 'Gerente',
  professional: 'Profissional'
}

export default function AccessControlModal({
  open,
  onClose,
  theme,
  professionals = [],
  profiles = [],
  loading,
  error,
  onSave
}) {
  const [form, setForm] = useState({
    email: '',
    role: 'professional',
    professionalId: '',
    active: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm((current) => ({
      ...current,
      professionalId: current.professionalId || professionals[0]?.id || ''
    }))
  }, [open, professionals])

  if (!open) return null

  const isLight = theme === 'light'
  const bgMain = isLight ? '#f9f9f9' : '#121212'
  const bgCard = isLight ? '#ffffff' : '#1e1e1e'
  const bgInput = isLight ? '#ffffff' : '#222'
  const textMain = isLight ? '#333' : '#fff'
  const textSec = isLight ? '#666' : '#aaa'
  const borderCol = isLight ? '#ddd' : '#333'

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '9px',
    border: `1px solid ${borderCol}`,
    background: bgInput,
    color: textMain,
    outline: 'none',
    fontSize: '0.9rem'
  }

  const handleEdit = (profile) => {
    setForm({
      email: profile.email || '',
      role: profile.role || 'professional',
      professionalId: profile.professional_id || professionals[0]?.id || '',
      active: profile.active !== false
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await onSave({
        email: form.email,
        role: form.role,
        professionalId: form.professionalId,
        active: form.active
      })
      setForm({
        email: '',
        role: 'professional',
        professionalId: professionals[0]?.id || '',
        active: true
      })
      alert('Acesso salvo.')
    } catch (saveError) {
      alert(saveError.message || 'Erro ao salvar acesso.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay active" style={{ zIndex: 99999 }}>
      <div className="modal-box" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh', padding: 0, background: bgMain }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <h3 style={{ color: 'var(--primary-color, #e91e63)', fontWeight: 900, margin: 0 }}>
              <i className="fa-solid fa-user-shield" style={{ marginRight: '8px' }}></i> Acessos do app
            </h3>
            <p style={{ color: textSec, fontSize: '0.78rem', marginTop: '4px' }}>
              Defina quem é admin e qual login pertence a cada profissional.
            </p>
          </div>
          <button onClick={onClose} style={{ width: '38px', height: '38px', borderRadius: '50%', border: `1px solid ${borderCol}`, background: bgCard, color: textMain, cursor: 'pointer' }} aria-label="Fechar">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gap: '16px' }}>
          {error && (
            <div style={{ padding: 14, borderRadius: 12, background: 'rgba(239,68,68,.14)', color: '#fecaca', lineHeight: 1.45 }}>
              Não consegui carregar os acessos. Rode a migration de perfis no Supabase.
              <br />
              <small>{error.message}</small>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, padding: 14, borderRadius: 14, border: `1px solid ${borderCol}`, background: bgCard }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, color: textSec, fontSize: '0.8rem', fontWeight: 800 }}>E-mail do login</label>
              <input
                required
                type="email"
                placeholder="funcionaria@email.com"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                style={inputStyle}
              />
              <small style={{ display: 'block', color: textSec, marginTop: 6, lineHeight: 1.4 }}>
                Primeiro crie esse usuário em Authentication &gt; Users no Supabase.
              </small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ color: textSec, fontSize: '0.8rem', fontWeight: 800 }}>
                Perfil
                <select
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                  style={{ ...inputStyle, marginTop: 6 }}
                >
                  <option value="professional">Profissional</option>
                  <option value="manager">Gerente</option>
                  <option value="owner">Dona/Admin total</option>
                </select>
              </label>

              <label style={{ color: textSec, fontSize: '0.8rem', fontWeight: 800 }}>
                Status
                <select
                  value={form.active ? 'active' : 'inactive'}
                  onChange={(event) => setForm({ ...form, active: event.target.value === 'active' })}
                  style={{ ...inputStyle, marginTop: 6 }}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Bloqueado</option>
                </select>
              </label>
            </div>

            {form.role === 'professional' && (
              <label style={{ color: textSec, fontSize: '0.8rem', fontWeight: 800 }}>
                Profissional vinculada
                <select
                  required
                  value={form.professionalId}
                  onChange={(event) => setForm({ ...form, professionalId: event.target.value })}
                  style={{ ...inputStyle, marginTop: 6 }}
                >
                  <option value="">Selecione</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>{professional.name}</option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{ border: 'none', borderRadius: 10, padding: 13, background: 'var(--primary-color, #e91e63)', color: '#fff', fontWeight: 900, cursor: 'pointer', opacity: saving ? .7 : 1 }}
            >
              {saving ? 'Salvando...' : 'Salvar acesso'}
            </button>
          </form>

          <section style={{ display: 'grid', gap: 10 }}>
            <h4 style={{ margin: 0, color: textMain, fontSize: '1rem' }}>Usuários configurados</h4>

            {loading ? (
              <div style={{ padding: 20, color: textSec, border: `1px dashed ${borderCol}`, borderRadius: 12, textAlign: 'center' }}>Carregando acessos...</div>
            ) : profiles.length === 0 ? (
              <div style={{ padding: 20, color: textSec, border: `1px dashed ${borderCol}`, borderRadius: 12, textAlign: 'center' }}>Nenhum acesso configurado ainda.</div>
            ) : (
              profiles.map((profile) => (
                <article key={profile.user_id} style={{ padding: 13, borderRadius: 12, border: `1px solid ${borderCol}`, background: bgCard, display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ color: textMain, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email}</strong>
                      <span style={{ color: textSec, fontSize: '0.78rem' }}>
                        {roleLabels[profile.role] || profile.role}
                        {profile.professional_name ? ` · ${profile.professional_name}` : ''}
                      </span>
                    </div>
                    <span style={{ height: 'fit-content', padding: '4px 8px', borderRadius: 999, color: profile.active ? '#10b981' : '#ef4444', background: profile.active ? 'rgba(16,185,129,.14)' : 'rgba(239,68,68,.14)', fontSize: '0.7rem', fontWeight: 900 }}>
                      {profile.active ? 'Ativo' : 'Bloqueado'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEdit(profile)}
                    style={{ justifySelf: 'start', border: `1px solid ${borderCol}`, borderRadius: 8, padding: '8px 11px', background: 'transparent', color: textMain, cursor: 'pointer', fontWeight: 800 }}
                  >
                    Editar
                  </button>
                </article>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
