import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

// Tenta inferir data no formato YYYY-MM-DD a partir de texto "12/08/2026", "12/08", etc.
function parseDate(raw) {
  if (!raw) return null
  const clean = raw.trim()

  // Formato ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean

  // Formato BR DD/MM/YYYY ou DD/MM
  const parts = clean.split('/')
  if (parts.length >= 2) {
    const day   = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year  = parts[2] ? parts[2] : new Date().getFullYear().toString()
    return `${year}-${month}-${day}`
  }

  return null
}

// Tenta extrair hora HH:MM de texto "14h", "14:30", "14h30"
function parseTime(raw) {
  if (!raw) return null
  const clean = raw.trim().replace('h', ':').replace('::', ':')
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?$/)
  if (match) {
    const h = match[1].padStart(2, '0')
    const m = (match[2] || '00').padStart(2, '0')
    return `${h}:${m}`
  }
  return null
}

// Analisa linhas de texto e tenta extrair campos de cliente/agendamento
function parseLines(text, professionals, services) {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  const results = []

  for (const line of lines) {
    // Ignora linhas que são apenas separadores ou comentários
    if (/^[-=*#]/.test(line)) continue

    // Tenta separar por delimitadores comuns: vírgula, ponto e vírgula, tab, pipe
    const parts = line.split(/[,;|\t]/).map((p) => p.trim())

    if (parts.length >= 2) {
      // Formato: Nome, Serviço, Data, Hora, Profissional, Telefone, Observação
      const [
        rawName   = '',
        rawService = '',
        rawDate   = '',
        rawTime   = '',
        rawProf   = '',
        rawPhone  = '',
        ...rest
      ] = parts

      const parsedDate = parseDate(rawDate)
      const parsedTime = parseTime(rawTime) || '09:00'

      // Tenta encontrar a profissional pelo nome
      const profMatch = professionals.find((p) =>
        p.name.toLowerCase().includes(rawProf.toLowerCase()) ||
        rawProf.toLowerCase().includes(p.name.toLowerCase())
      )

      // Tenta encontrar serviço pelo nome
      const serviceMatch = services.find((s) =>
        s.name.toLowerCase().includes(rawService.toLowerCase()) ||
        rawService.toLowerCase().includes(s.name.toLowerCase())
      )

      if (rawName && parsedDate) {
        results.push({
          client_name:     rawName,
          service:         serviceMatch?.name || rawService,
          service_id:      serviceMatch?.id   || null,
          date:            parsedDate,
          time:            parsedTime,
          professional_id: profMatch?.id      || professionals[0]?.id || null,
          professional_name: profMatch?.name  || rawProf || professionals[0]?.name || '',
          phone:           rawPhone.replace(/\D/g, '') || null,
          observation:     rest.join(', ') || null,
          total_price:     serviceMatch?.price || 0,
          status:          'pendente',
          _raw:            line,
          _error:          null
        })
      } else {
        results.push({
          _raw:   line,
          _error: !rawName ? 'Nome em branco' : 'Data inválida ou não encontrada'
        })
      }
    } else {
      // Linha com menos de 2 campos — pode ser só um nome de cliente
      results.push({ _raw: line, _error: 'Formato incompleto (mín: Nome, Serviço, Data)' })
    }
  }

  return results
}

export default function ImportDataModal({ isOpen, onClose, professionals = [], services = [], onImportDone }) {
  const [tab, setTab]         = useState('agendamentos') // 'agendamentos' | 'clientes'
  const [rawText, setRawText] = useState('')
  const [preview, setPreview] = useState([])
  const [status, setStatus]   = useState('idle') // 'idle' | 'previewing' | 'importing' | 'done' | 'error'
  const [importLog, setImportLog] = useState([])

  if (!isOpen) return null

  const handlePreview = () => {
    const parsed = parseLines(rawText, professionals, services)
    setPreview(parsed)
    setStatus('previewing')
  }

  const handleImport = async () => {
    const valid = preview.filter((r) => !r._error)
    if (valid.length === 0) return

    setStatus('importing')
    const log = []

    for (const item of valid) {
      try {
        if (tab === 'agendamentos') {
          // 1. Upsert do cliente (pelo nome — simples por ora)
          let clientId = null
          if (item.phone) {
            const { data: existing } = await supabase
              .from('clients')
              .select('id')
              .ilike('name', item.client_name)
              .maybeSingle()

            if (existing) {
              clientId = existing.id
            } else {
              const { data: newClient } = await supabase
                .from('clients')
                .insert({ name: item.client_name, phone: item.phone })
                .select('id')
                .single()
              clientId = newClient?.id
            }
          }

          // 2. Insere o agendamento
          const { error } = await supabase.from('appointments').insert({
            client_name:     item.client_name,
            client_id:       clientId,
            service:         item.service,
            service_id:      item.service_id,
            date:            item.date,
            time:            item.time,
            professional_id: item.professional_id,
            observation:     item.observation,
            total_price:     item.total_price,
            status:          item.status,
            duration_minutes: 60
          })

          if (error) {
            log.push({ line: item._raw, ok: false, msg: error.message })
          } else {
            log.push({ line: item._raw, ok: true, msg: 'Importado ✓' })
          }
        } else {
          // Importar clientes (sem agendamento)
          const { error } = await supabase.from('clients').upsert(
            { name: item.client_name, phone: item.phone },
            { onConflict: 'id', ignoreDuplicates: false }
          )
          log.push({ line: item._raw, ok: !error, msg: error ? error.message : 'Cliente salvo ✓' })
        }
      } catch (err) {
        log.push({ line: item._raw, ok: false, msg: err.message })
      }
    }

    setImportLog(log)
    setStatus('done')
    onImportDone?.()
  }

  const handleReset = () => {
    setRawText('')
    setPreview([])
    setImportLog([])
    setStatus('idle')
  }

  const validCount   = preview.filter((r) => !r._error).length
  const invalidCount = preview.filter((r) =>  r._error).length

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 600,
          width: '96%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 16,
          background: 'var(--bg-secondary, #0f0f14)',
          border: '1px solid var(--border-color, #1f1f2e)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #d4145a, #7c3aed)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fff',
          flexShrink: 0
        }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>📥 Importar Dados</h3>
            <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>Cole sua lista de agendamentos ou clientes</span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, #1f1f2e)', flexShrink: 0 }}>
          {[
            { id: 'agendamentos', label: '📅 Agendamentos' },
            { id: 'clientes',     label: '👤 Clientes' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); handleReset() }}
              style={{
                flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer',
                background: 'transparent', fontWeight: 700, fontSize: '0.88rem',
                color: tab === t.id ? 'var(--accent-pink, #d4145a)' : 'var(--text-secondary, #8e8e9a)',
                borderBottom: tab === t.id ? '2px solid var(--accent-pink, #d4145a)' : '2px solid transparent'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Corpo com scroll */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Instrução */}
          <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: '0.82rem', color: '#c4b5fd' }}>
            {tab === 'agendamentos' ? (
              <>
                <strong>Formato esperado por linha:</strong><br />
                <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>
                  Nome da Cliente, Serviço, Data (DD/MM), Hora, Profissional, Telefone, Obs
                </code>
                <br /><small style={{ opacity: 0.8 }}>Exemplos: vírgula, ponto e vírgula, tab ou pipe ( | ) como separador.</small>
              </>
            ) : (
              <>
                <strong>Formato esperado por linha:</strong><br />
                <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>
                  Nome da Cliente, Telefone
                </code>
              </>
            )}
          </div>

          {/* Textarea */}
          {status === 'idle' || status === 'previewing' ? (
            <>
              <textarea
                placeholder={
                  tab === 'agendamentos'
                    ? 'Maria Silva, Extensão de Cílios, 20/08, 14h, Bea, 11999999999\nJoana Souza, Design de Sobrancelha, 21/08/2026, 10:00, Carol'
                    : 'Maria Silva, 11999999999\nJoana Souza, 11988888888'
                }
                value={rawText}
                onChange={(e) => { setRawText(e.target.value); setStatus('idle') }}
                rows={8}
                style={{
                  width: '100%', resize: 'vertical',
                  background: 'var(--bg-primary, #07070a)',
                  border: '1px solid var(--border-color, #1f1f2e)',
                  borderRadius: 10, padding: '12px 14px',
                  color: 'var(--text-primary, #fff)',
                  fontSize: '0.85rem', fontFamily: 'monospace',
                  outline: 'none'
                }}
              />

              <button
                type="button"
                onClick={handlePreview}
                disabled={!rawText.trim()}
                style={{
                  padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #d4145a, #7c3aed)',
                  color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                  opacity: rawText.trim() ? 1 : 0.5
                }}
              >
                🔍 Pré-visualizar ({rawText.trim().split('\n').filter(l => l.trim()).length} linhas)
              </button>
            </>
          ) : null}

          {/* Pré-visualização */}
          {(status === 'previewing') && preview.length > 0 && (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <span style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                  ✓ {validCount} válidos
                </span>
                {invalidCount > 0 && (
                  <span style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                    ✗ {invalidCount} com erro
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                {preview.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem',
                      background: item._error ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                      border: `1px solid ${item._error ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                      color: item._error ? '#fca5a5' : 'var(--text-primary, #fff)'
                    }}
                  >
                    {item._error ? (
                      <span>⚠️ <strong>{item._raw}</strong> — {item._error}</span>
                    ) : (
                      <span>
                        ✓ <strong>{item.client_name}</strong> · {item.service} · {item.date} {item.time} · {item.professional_name}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {validCount > 0 && (
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button
                    type="button" onClick={handleReset}
                    style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--border-color, #1f1f2e)', background: 'transparent', color: 'var(--text-secondary, #8e8e9a)', cursor: 'pointer', fontWeight: 700 }}
                  >
                    ← Editar lista
                  </button>
                  <button
                    type="button" onClick={handleImport}
                    style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#d4145a', color: '#fff', cursor: 'pointer', fontWeight: 800 }}
                  >
                    📥 Importar {validCount} registro{validCount > 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Importando */}
          {status === 'importing' && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary, #8e8e9a)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #1f1f2e', borderTopColor: '#d4145a', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              Importando dados...
            </div>
          )}

          {/* Resultado */}
          {status === 'done' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>
                  {importLog.every(l => l.ok) ? '🎉' : '⚠️'}
                </div>
                <strong style={{ color: 'var(--text-primary, #fff)' }}>
                  {importLog.filter(l => l.ok).length} de {importLog.length} registros importados
                </strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {importLog.map((entry, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: entry.ok ? '#6ee7b7' : '#fca5a5' }}>
                    {entry.ok ? '✓' : '✗'} {entry.line} <small style={{ opacity: 0.7 }}>— {entry.msg}</small>
                  </div>
                ))}
              </div>
              <button
                type="button" onClick={onClose}
                style={{ width: '100%', marginTop: 16, padding: '12px', borderRadius: 10, border: 'none', background: '#d4145a', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
              >
                Fechar e ver a agenda
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
