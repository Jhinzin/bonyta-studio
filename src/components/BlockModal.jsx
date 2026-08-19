import React, { useEffect, useState } from 'react';
import { formatDateToISO } from '../utils';

const emptyBlockForm = {
  reason: '',
  time: '',
  duration_minutes: 60,
  date: '',
  professional_id: ''
};

// FIX APLICADO: onDelete e editingBlock agora estão declarados nas props
export default function BlockModal({ 
  open, onClose, onSubmit, onDelete, professionals, defaultDate, theme, editingBlock 
}) {
  const [form, setForm] = useState(emptyBlockForm);
  const [saving, setSaving] = useState(false);

  // Design Tokens
  const isLight = theme === 'light';
  const bgMain = isLight ? '#f9f9f9' : '#121212';
  const bgInput = isLight ? '#ffffff' : '#222';
  const textMain = isLight ? '#333' : '#fff';
  const textSec = isLight ? '#666' : '#ccc';
  const borderCol = isLight ? '#ddd' : '#333';

  const inputStyle = { 
    width: '100%', padding: '14px', borderRadius: '8px', border: `1px solid ${borderCol}`, 
    background: bgInput, color: textMain, outline: 'none', fontSize: '0.95rem'
  };

  // Engine de Preenchimento (Criação vs Edição)
  useEffect(() => {
    if (open) {
      if (editingBlock) {
        setForm({
          id: editingBlock.id,
          reason: editingBlock.service || '',
          time: editingBlock.time || '',
          duration_minutes: editingBlock.duration_minutes || 60,
          date: editingBlock.date || defaultDate,
          professional_id: editingBlock.professional_id || (professionals[0]?.id || '')
        });
      } else {
        setForm({
          ...emptyBlockForm,
          date: defaultDate,
          professional_id: professionals[0]?.id || ''
        });
      }
    }
  }, [open, defaultDate, professionals, editingBlock]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason) {
      alert("Por favor, digite o motivo do bloqueio.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        id: form.id, // Envia o ID se estiver editando para o Supabase atualizar a linha correta
        is_block: true,
        professional_id: form.professional_id,
        time: form.time,
        duration_minutes: Number(form.duration_minutes),
        date: form.date,
        client_name: 'Horário Bloqueado',
        service: form.reason,
        client_id: null,
        service_id: null
      });
      onClose();
    } catch (err) {
      alert(`Erro ao salvar bloqueio: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay active" onClick={onClose} style={{ zIndex: 99999 }}>
      <div 
        className="modal-box" 
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '92vh', padding: '0', margin: '0', borderRadius: '16px', background: bgMain, overflow: 'hidden' }}
      >
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: `1px solid ${borderCol}` }}>
          <h3 style={{ color: 'var(--primary-color, #e91e63)', fontWeight: 'bold' }}>
            <i className="fa-solid fa-lock" style={{ marginRight: '8px' }}></i>
            {editingBlock ? 'Editar Bloqueio' : 'Novo Bloqueio / Compromisso'}
          </h3>
          <button type="button" className="close-modal-btn" onClick={onClose} style={{ color: textMain, background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '24px', flex: 1 }}>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec, fontWeight: '600' }}>
                Motivo / Descrição do Compromisso
              </label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Horário de Almoço, Curso, Consulta Médica..."
                value={form.reason}
                onChange={e => setForm({...form, reason: e.target.value})}
                style={inputStyle}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec, fontWeight: '600' }}>
                Para qual Profissional?
              </label>
              <select 
                value={form.professional_id} 
                onChange={e => setForm({...form, professional_id: e.target.value})}
                style={{
                  ...inputStyle,
                  appearance: 'none', WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='${isLight ? '%23333' : '%23fff'}' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                  backgroundRepeat: 'no-repeat', backgroundPositionX: 'calc(100% - 12px)', backgroundPositionY: 'center'
                }}
              >
                {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec, fontWeight: '600' }}>Data</label>
                <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec, fontWeight: '600' }}>Horário de Início</label>
                <input type="time" required value={form.time} onChange={e => setForm({...form, time: e.target.value})} style={inputStyle} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec, fontWeight: '600' }}>
                Quanto tempo vai durar?
              </label>
              <select 
                value={form.duration_minutes} 
                onChange={e => setForm({...form, duration_minutes: e.target.value})}
                style={{
                  ...inputStyle,
                  appearance: 'none', WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='${isLight ? '%23333' : '%23fff'}' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                  backgroundRepeat: 'no-repeat', backgroundPositionX: 'calc(100% - 12px)', backgroundPositionY: 'center'
                }}
              >
                <option value="30">30 minutos</option>
                <option value="60">1 hora</option>
                <option value="90">1 hora e 30 minutos</option>
                <option value="120">2 horas</option>
                <option value="180">3 horas</option>
                <option value="240">4 horas</option>
                <option value="480">Período Integral (8 horas)</option>
              </select>
            </div>

          </div>

          {/* Botões de Ação Inferiores */}
          <div className="modal-actions" style={{ padding: '16px 24px 32px 24px', borderTop: `1px solid ${borderCol}`, background: bgMain, marginTop: 'auto' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              
              {form.id && onDelete && (
                <button 
                  type="button" 
                  className="btn-danger" 
                  onClick={() => { if(window.confirm("Deseja remover este bloqueio?")) { onDelete(form.id); onClose(); } }}
                  style={{ flex: 1, background: '#ff4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Excluir
                </button>
              )}

              <button type="button" className="btn-secondary" onClick={onClose} disabled={saving} style={{ flex: 1, background: 'transparent', color: textMain, borderColor: borderCol, borderRadius: '8px', cursor: 'pointer' }}>
                Voltar
              </button>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={saving} 
                style={{ flex: 2, background: 'var(--primary-color, #e91e63)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {saving ? 'Gravando...' : (form.id ? 'Salvar Alterações' : 'Confirmar')}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}