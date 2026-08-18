import React, { useState, useMemo } from 'react'
import { parseRawContactsText } from '../utils/contactParser'

export default function ImportClientsModal({ isOpen, onClose, onImport, theme }) {
  const [inputText, setInputText] = useState('')
  const [previewList, setPreviewList] = useState([])
  const [isImporting, setIsImporting] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  const isLight = theme === 'light'
  const bgMain = isLight ? '#f9f9f9' : '#121212'
  const bgCard = isLight ? '#ffffff' : '#2a2a2a'
  const bgInput = isLight ? '#ffffff' : '#222'
  const textMain = isLight ? '#333' : '#fff'
  const textSec = isLight ? '#666' : '#ccc'
  const borderCol = isLight ? '#ddd' : '#333'

  const parsed = useMemo(() => {
    return parseRawContactsText(inputText)
  }, [inputText])

  if (!isOpen) return null

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        setInputText(content)
      }
    }
    reader.readAsText(file)
  }

  const handleExecuteImport = async () => {
    if (parsed.length === 0) {
      alert('Nenhum contato válido encontrado para importar.')
      return
    }

    setIsImporting(true)
    setStatusMsg(`Importando ${parsed.length} clientes...`)

    try {
      await onImport(parsed)
      setStatusMsg(`✅ ${parsed.length} clientes importadas com sucesso!`)
      setTimeout(() => {
        setIsImporting(false)
        setInputText('')
        onClose()
      }, 1200)
    } catch (err) {
      console.error(err)
      setStatusMsg(`❌ Erro ao importar: ${err.message || 'Verifique as permissões no Supabase'}`)
      setIsImporting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ background: bgMain, width: '100%', maxWidth: '650px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: textMain, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-file-import" style={{ color: 'var(--primary-color, #e91e63)' }}></i>
              Importar Clientes em Massa
            </h3>
            <p style={{ color: textSec, fontSize: '0.8rem', marginTop: '4px', margin: 0 }}>
              Cole sua lista de contatos do Minha Agenda, Excel ou WhatsApp
            </p>
          </div>
          <button onClick={onClose} disabled={isImporting} style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${borderCol}`, background: bgCard, color: textMain, cursor: 'pointer' }}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: textMain }}>
                1. Cole o texto copiado ou envie um arquivo .csv:
              </label>
              <label style={{ cursor: 'pointer', background: 'transparent', border: `1px solid ${borderCol}`, borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', color: textSec, fontWeight: 700 }}>
                <i className="fa-solid fa-upload" style={{ marginRight: '5px' }}></i> Arquivo CSV
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <textarea
              rows="6"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Cole aqui o texto copiado, ex:\nAdriana - BS\n(11) 97696-3642\nBeatriz 💖\n(11) 96721-0613`}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${borderCol}`,
                background: bgInput,
                color: textMain,
                outline: 'none',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Preview Section */}
          <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ fontSize: '0.88rem', color: textMain }}>
                2. Pré-visualização ({parsed.length} clientes identificadas)
              </strong>
              {parsed.length > 0 && (
                <span style={{ fontSize: '0.75rem', background: '#10b98120', color: '#10b981', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                  Pronto para importar
                </span>
              )}
            </div>

            {parsed.length === 0 ? (
              <p style={{ color: textSec, fontSize: '0.82rem', margin: 0, fontStyle: 'italic' }}>
                Nenhum contato detectado ainda. Cole sua lista no campo acima.
              </p>
            ) : (
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: `1px solid ${borderCol}`, borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: bgInput, color: textSec, borderBottom: `1px solid ${borderCol}` }}>
                      <th style={{ padding: '8px 10px' }}>#</th>
                      <th style={{ padding: '8px 10px' }}>Nome</th>
                      <th style={{ padding: '8px 10px' }}>WhatsApp/Telefone</th>
                      <th style={{ padding: '8px 10px' }}>Nasc.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.slice(0, 50).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${borderCol}`, color: textMain }}>
                        <td style={{ padding: '6px 10px', color: textSec }}>{idx + 1}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 700 }}>{item.name}</td>
                        <td style={{ padding: '6px 10px', color: item.phone ? '#10b981' : textSec }}>{item.phone || '-'}</td>
                        <td style={{ padding: '6px 10px', color: textSec }}>{item.birth_date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.length > 50 && (
                  <div style={{ padding: '6px 10px', fontSize: '0.75rem', color: textSec, textAlign: 'center', background: bgInput }}>
                    ... e mais {parsed.length - 50} clientes
                  </div>
                )}
              </div>
            )}
          </div>

          {statusMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: statusMsg.includes('❌') ? '#ef444420' : '#10b98120', color: statusMsg.includes('❌') ? '#ef4444' : '#10b981', fontSize: '0.85rem', fontWeight: 800 }}>
              {statusMsg}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{ padding: '14px 20px 24px', borderTop: `1px solid ${borderCol}`, display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            style={{ flex: 1, padding: '13px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: 'transparent', color: textMain, fontWeight: 800, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={parsed.length === 0 || isImporting}
            style={{
              flex: 2,
              padding: '13px',
              borderRadius: '8px',
              border: 'none',
              background: parsed.length === 0 ? borderCol : 'var(--primary-color, #e91e63)',
              color: '#fff',
              fontWeight: 900,
              cursor: parsed.length === 0 || isImporting ? 'not-allowed' : 'pointer'
            }}
          >
            {isImporting ? 'Importando...' : `Importar ${parsed.length} Clientes`}
          </button>
        </div>

      </div>
    </div>
  )
}
