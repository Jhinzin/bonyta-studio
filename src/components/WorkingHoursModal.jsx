import React, { useEffect, useMemo, useState } from 'react'
import { WEEKDAYS } from '../hooks/useWorkingHours'

export default function WorkingHoursModal({
  open,
  onClose,
  theme,
  professionals = [],
  workingHours = [],
  loading,
  error,
  onChange,
  onSave
}) {
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!selectedProfessionalId || !professionals.some((professional) => professional.id === selectedProfessionalId)) {
      setSelectedProfessionalId(professionals[0]?.id || '')
    }
  }, [open, professionals, selectedProfessionalId])

  const selectedProfessional = professionals.find((professional) => professional.id === selectedProfessionalId)

  const rowsByDay = useMemo(() => {
    const map = new Map()
    workingHours
      .filter((row) => String(row.professional_id) === String(selectedProfessionalId))
      .forEach((row) => map.set(Number(row.weekday), row))
    return map
  }, [selectedProfessionalId, workingHours])

  if (!open) return null

  const isLight = theme === 'light'
  const bgMain = isLight ? '#f9f9f9' : '#121212'
  const bgInput = isLight ? '#ffffff' : '#222'
  const bgCard = isLight ? '#ffffff' : '#181818'
  const textMain = isLight ? '#333' : '#fff'
  const textSec = isLight ? '#666' : '#ccc'
  const borderCol = isLight ? '#ddd' : '#333'

  const inputStyle = {
    width: '100%',
    padding: '11px',
    borderRadius: '8px',
    border: `1px solid ${borderCol}`,
    background: bgInput,
    color: textMain,
    outline: 'none',
    fontSize: '0.9rem'
  }

  const handleSave = async () => {
    if (!selectedProfessionalId) return
    setSaving(true)
    try {
      await onSave(selectedProfessionalId)
      alert('Expediente salvo. A landing já vai usar esses horários.')
    } catch (saveError) {
      alert(`Erro ao salvar expediente: ${saveError.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay active" style={{ zIndex: 99999 }}>
      <div
        className="modal-box"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          maxHeight: '100vh',
          padding: 0,
          margin: 0,
          borderRadius: 0,
          background: bgMain
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--primary-color, #e91e63)', fontWeight: 'bold' }}>
              <i className="fa-solid fa-clock" style={{ marginRight: 8 }} />
              Expediente da equipe
            </h3>
            <p style={{ margin: '6px 0 0', color: textSec, fontSize: '0.82rem' }}>
              A landing usa estes horários para mostrar vagas reais.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: textMain, fontSize: '1.2rem', cursor: 'pointer' }}>
            <i className="fas fa-times" />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{ padding: 14, borderRadius: 12, background: '#3b1010', color: '#fecaca', marginBottom: 16, lineHeight: 1.45 }}>
              Não consegui carregar o expediente. Rode a migration de disponibilidade no Supabase primeiro.
              <br />
              <small>{error.message}</small>
            </div>
          )}

          {!professionals.length ? (
            <div style={{ color: textSec }}>Cadastre uma profissional primeiro.</div>
          ) : (
            <>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: textSec, fontWeight: 700 }}>
                Profissional
              </label>
              <select
                value={selectedProfessionalId}
                onChange={(event) => setSelectedProfessionalId(event.target.value)}
                style={{ ...inputStyle, marginBottom: 18 }}
              >
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>{professional.name}</option>
                ))}
              </select>

              {loading ? (
                <div style={{ color: textSec, padding: 20, textAlign: 'center' }}>Carregando expediente...</div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {WEEKDAYS.map((day) => {
                    const row = rowsByDay.get(day.value) || {}
                    const active = row.active !== false

                    return (
                      <div
                        key={day.value}
                        style={{
                          padding: 14,
                          border: `1px solid ${active ? borderCol : 'rgba(127,127,127,0.2)'}`,
                          borderRadius: 14,
                          background: active ? bgCard : (isLight ? '#f1f1f1' : '#111')
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: active ? 12 : 0 }}>
                          <strong style={{ color: textMain }}>{day.label}</strong>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: textSec, fontSize: '0.82rem' }}>
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={(event) => onChange(selectedProfessionalId, day.value, { active: event.target.checked })}
                            />
                            Atende
                          </label>
                        </div>

                        {active && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <label style={{ color: textSec, fontSize: '0.78rem' }}>
                              Início
                              <input
                                type="time"
                                value={row.starts_at || '08:00'}
                                onChange={(event) => onChange(selectedProfessionalId, day.value, { starts_at: event.target.value })}
                                style={{ ...inputStyle, marginTop: 5 }}
                              />
                            </label>
                            <label style={{ color: textSec, fontSize: '0.78rem' }}>
                              Fim
                              <input
                                type="time"
                                value={row.ends_at || '18:00'}
                                onChange={(event) => onChange(selectedProfessionalId, day.value, { ends_at: event.target.value })}
                                style={{ ...inputStyle, marginTop: 5 }}
                              />
                            </label>
                            <label style={{ color: textSec, fontSize: '0.78rem' }}>
                              Pausa início
                              <input
                                type="time"
                                value={row.break_starts_at || ''}
                                onChange={(event) => onChange(selectedProfessionalId, day.value, { break_starts_at: event.target.value })}
                                style={{ ...inputStyle, marginTop: 5 }}
                              />
                            </label>
                            <label style={{ color: textSec, fontSize: '0.78rem' }}>
                              Pausa fim
                              <input
                                type="time"
                                value={row.break_ends_at || ''}
                                onChange={(event) => onChange(selectedProfessionalId, day.value, { break_ends_at: event.target.value })}
                                style={{ ...inputStyle, marginTop: 5 }}
                              />
                            </label>
                            <label style={{ gridColumn: '1 / -1', color: textSec, fontSize: '0.78rem' }}>
                              Intervalo dos horários exibidos na landing
                              <select
                                value={row.slot_interval_minutes || 30}
                                onChange={(event) => onChange(selectedProfessionalId, day.value, { slot_interval_minutes: Number(event.target.value) })}
                                style={{ ...inputStyle, marginTop: 5 }}
                              >
                                <option value="15">De 15 em 15 minutos</option>
                                <option value="30">De 30 em 30 minutos</option>
                                <option value="60">De 1 em 1 hora</option>
                              </select>
                            </label>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {selectedProfessional && (
                <p style={{ color: textSec, fontSize: '0.78rem', lineHeight: 1.5, marginTop: 16 }}>
                  Dica: bloqueios/compromissos criados na agenda continuam sendo respeitados. Este expediente só define
                  quando {selectedProfessional.name} normalmente atende.
                </p>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, padding: '16px 24px 28px', borderTop: `1px solid ${borderCol}`, background: bgMain }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: 14, borderRadius: 10, border: `1px solid ${borderCol}`, background: 'transparent', color: textMain, cursor: 'pointer' }}
          >
            Voltar
          </button>
          <button
            type="button"
            disabled={saving || loading || !selectedProfessionalId || Boolean(error)}
            onClick={handleSave}
            style={{ flex: 2, padding: 14, borderRadius: 10, border: 'none', background: 'var(--primary-color, #e91e63)', color: '#fff', fontWeight: 900, cursor: 'pointer', opacity: saving || error ? .7 : 1 }}
          >
            {saving ? 'Salvando...' : 'Salvar expediente'}
          </button>
        </div>
      </div>
    </div>
  )
}
