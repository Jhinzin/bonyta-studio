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
  onSave,
  onUpdateProfessional
}) {
  const [form, setForm] = useState({
    email: '',
    role: 'professional',
    professionalId: '',
    active: true,
    compensation_type: 'commission',
    commission_percent: 50,
    monthly_rent_share: 0,
    block_finance: false
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const initialProfId = form.professionalId || professionals[0]?.id || ''
    const foundProf = professionals.find(p => p.id === initialProfId)
    setForm((current) => ({
      ...current,
      professionalId: initialProfId,
      compensation_type: foundProf?.compensation_type || current.compensation_type,
      commission_percent: foundProf?.commission_percent ?? current.commission_percent,
      monthly_rent_share: foundProf?.monthly_rent_share ?? current.monthly_rent_share
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

  const handleProfChange = (profId) => {
    const foundProf = professionals.find(p => p.id === profId)
    setForm(current => ({
      ...current,
      professionalId: profId,
      compensation_type: foundProf?.compensation_type || 'commission',
      commission_percent: foundProf?.commission_percent ?? 50,
      monthly_rent_share: foundProf?.monthly_rent_share ?? 0
    }))
  }

  const handleEdit = (profile) => {
    const foundProf = professionals.find(p => p.id === profile.professional_id)
    setForm({
      email: profile.email || '',
      role: profile.role || 'professional',
      professionalId: profile.professional_id || professionals[0]?.id || '',
      active: profile.active !== false,
      compensation_type: foundProf?.compensation_type || 'commission',
      commission_percent: foundProf?.commission_percent ?? 50,
      monthly_rent_share: foundProf?.monthly_rent_share ?? 0,
      block_finance: false
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

      if (form.role === 'professional' && form.professionalId && onUpdateProfessional) {
        await onUpdateProfessional(form.professionalId, {
          compensation_type: form.compensation_type,
          commission_percent: Number(form.commission_percent || 0),
          monthly_rent_share: Number(form.monthly_rent_share || 0)
        })
      }

      alert('Acesso e permissões financeiras salvos com sucesso!')
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
              <i className="fa-solid fa-user-shield" style={{ marginRight: '8px' }}></i> Acessos & Permissões da Equipe
            </h3>
            <p style={{ color: textSec, fontSize: '0.78rem', marginTop: '4px' }}>
              Defina quem é admin, vincule as profissionais e personalize o acesso ao faturamento.
            </p>
          </div>
          <button onClick={onClose} style={{ width: '38px', height: '38px', borderRadius: '50%', border: `1px solid ${borderCol}`, background: bgCard, color: textMain, cursor: 'pointer' }} aria-label="Fechar">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gap: '16px' }}>
          {error && (
            <div style={{ padding: 14, borderRadius: 12, background: 'rgba(239,68,68,.14)', color: '#fecaca', lineHeight: 1.45 }}>
              Não consegui carregar os acessos.
              <br />
              <small>{error.message}</small>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, padding: 16, borderRadius: 14, border: `1px solid ${borderCol}`, background: bgCard }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, color: textSec, fontSize: '0.8rem', fontWeight: 800 }}>E-mail cadastrado da profissional</label>
              <input
                required
                type="email"
                placeholder="Ex: carol@gmail.com"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                style={inputStyle}
              />
              <small style={{ display: 'block', color: textSec, marginTop: 4, lineHeight: 1.4, fontSize: '0.75rem' }}>
                A profissional pode criar este e-mail na tela inicial em "Criar conta".
              </small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ color: textSec, fontSize: '0.8rem', fontWeight: 800 }}>
                Tipo de Acesso
                <select
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                  style={{ ...inputStyle, marginTop: 6 }}
                >
                  <option value="professional">Profissional da Equipe</option>
                  <option value="manager">Gerente</option>
                  <option value="owner">Dona / Administradora</option>
                </select>
              </label>

              <label style={{ color: textSec, fontSize: '0.8rem', fontWeight: 800 }}>
                Status do Login
                <select
                  value={form.active ? 'active' : 'inactive'}
                  onChange={(event) => setForm({ ...form, active: event.target.value === 'active' })}
                  style={{ ...inputStyle, marginTop: 6 }}
                >
                  <option value="active">Liberado / Ativo</option>
                  <option value="inactive">Bloqueado</option>
                </select>
              </label>
            </div>

            {form.role === 'professional' && (
              <>
                <label style={{ color: textSec, fontSize: '0.8rem', fontWeight: 800 }}>
                  Profissional vinculada
                  <select
                    required
                    value={form.professionalId}
                    onChange={(event) => handleProfChange(event.target.value)}
                    style={{ ...inputStyle, marginTop: 6 }}
                  >
                    <option value="">Selecione uma profissional</option>
                    {professionals.map((professional) => (
                      <option key={professional.id} value={professional.id}>{professional.name}</option>
                    ))}
                  </select>
                </label>

                {/* BLOCO DE CONFIGURAÇÃO FINANCEIRA */}
                <div style={{ padding: '14px', borderRadius: '12px', background: isLight ? '#f0f4f8' : '#14141d', border: `1px solid ${isLight ? '#cce0f5' : '#2d2d42'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <i className="fa-solid fa-hand-holding-dollar" style={{ color: 'var(--primary-color, #e91e63)' }}></i>
                    <strong style={{ color: textMain, fontSize: '0.86rem' }}>Regra de Faturamento & Privacidade</strong>
                  </div>

                  <label style={{ color: textSec, fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                    Como funciona o repasse desta profissional?
                  </label>
                  <select
                    value={form.compensation_type}
                    onChange={(e) => setForm({ ...form, compensation_type: e.target.value })}
                    style={{ ...inputStyle, marginBottom: '10px' }}
                  >
                    <option value="commission">Porcentagem / Comissão (Ex: Carol - Vê apenas a comissão dela)</option>
                    <option value="rent_share">Aluguel de Espaço / Cadeira Fixa (Ex: Mayra - Vê faturamento próprio)</option>
                    <option value="studio">100% Studio / Sem repasse no app</option>
                  </select>

                  {form.compensation_type === 'commission' && (
                    <div>
                      <label style={{ color: textSec, fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                        Porcentagem da Profissional (%)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          placeholder="Ex: 50"
                          value={form.commission_percent}
                          onChange={(e) => setForm({ ...form, commission_percent: e.target.value })}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <span style={{ fontWeight: 800, color: textMain }}>%</span>
                      </div>
                      <small style={{ color: '#10b981', display: 'block', marginTop: '4px', fontSize: '0.74rem' }}>
                        🔒 <strong>Privacidade ativada:</strong> A profissional verá apenas o valor líquido da comissão dela ({form.commission_percent}%), sem ter acesso ao faturamento total da loja ou lucros da empresa.
                      </small>
                    </div>
                  )}

                  {form.compensation_type === 'rent_share' && (
                    <div>
                      <label style={{ color: textSec, fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                        Valor do Aluguel Mensal do Espaço (R$)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: textMain }}>R$</span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          placeholder="Ex: 800"
                          value={form.monthly_rent_share}
                          onChange={(e) => setForm({ ...form, monthly_rent_share: e.target.value })}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                      </div>
                      <small style={{ color: '#3b82f6', display: 'block', marginTop: '4px', fontSize: '0.74rem' }}>
                        📋 A profissional verá todo o faturamento dos atendimentos dela e o desconto do aluguel fixo.
                      </small>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{ border: 'none', borderRadius: 10, padding: 13, background: 'var(--primary-color, #e91e63)', color: '#fff', fontWeight: 900, cursor: 'pointer', opacity: saving ? .7 : 1, marginTop: '4px' }}
            >
              {saving ? 'Salvando...' : 'Salvar Acesso & Permissão'}
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
