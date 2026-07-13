import React, { useState } from 'react';

export default function ProfessionalModal({ open, onClose, onSubmit, theme }) {
  const [form, setForm] = useState({ name: '', role: 'Nail Designer', color: '#e91e63' });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const isLight = theme === 'light';
  const bgMain = isLight ? '#f9f9f9' : '#121212';
  const bgInput = isLight ? '#ffffff' : '#222';
  const textMain = isLight ? '#333' : '#fff';
  const textSec = isLight ? '#666' : '#ccc';
  const borderCol = isLight ? '#ddd' : '#333';

  const inputStyle = { 
    width: '100%', padding: '14px', borderRadius: '8px', border: `1px solid ${borderCol}`, 
    background: bgInput, color: textMain, outline: 'none', fontSize: '0.95rem', marginBottom: '16px'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        name: form.name,
        specialty: form.role,
        style_class: 'pink'
      });
      setForm({ name: '', role: 'Nail Designer', color: '#e91e63' });
      onClose();
    } catch (err) {
      alert("Erro ao adicionar profissional.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 99999 }}>
      <div className="modal-box" style={{ background: bgMain, padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: 'var(--primary-color, #e91e63)', fontWeight: 'bold' }}>
            <i className="fa-solid fa-user-plus" style={{ marginRight: '8px' }}></i> Nova Profissional
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: textMain, fontSize: '1.2rem', cursor: 'pointer' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec, fontWeight: '600' }}>Nome Completo</label>
          <input 
            type="text" required placeholder="Ex: Carol Silva"
            value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            style={inputStyle}
          />

          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec, fontWeight: '600' }}>Especialidade</label>
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={inputStyle}>
            <option value="Nail Designer">Nail Designer</option>
            <option value="Lash Designer">Lash Designer</option>
            <option value="Sobrancelha">Sobrancelha</option>
            <option value="Esteticista">Esteticista</option>
            <option value="Cabeleireira">Cabeleireira</option>
          </select>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', background: 'transparent', border: `1px solid ${borderCol}`, color: textMain, borderRadius: '8px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: '14px', background: 'var(--primary-color, #e91e63)', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {saving ? 'Adicionando...' : 'Adicionar à Equipe'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
