import React, { useState } from 'react';

export default function ProfessionalModal({ open, onClose, onSubmit, theme }) {
  const [form, setForm] = useState({
    name: '',
    role: 'Nail Designer',
    color: '#e91e63',
    compensation_type: 'studio',
    commission_percent: 0,
    monthly_rent_share: 0
  });
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
        style_class: 'pink',
        compensation_type: form.compensation_type,
        commission_percent: Number(form.commission_percent || 0),
        monthly_rent_share: Number(form.monthly_rent_share || 0)
      });
      setForm({ name: '', role: 'Nail Designer', color: '#e91e63', compensation_type: 'studio', commission_percent: 0, monthly_rent_share: 0 });
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

          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec, fontWeight: '600' }}>Acerto financeiro</label>
          <select value={form.compensation_type} onChange={e => setForm({...form, compensation_type: e.target.value})} style={inputStyle}>
            <option value="studio">Fixo do estudio / sem repasse</option>
            <option value="commission">Porcentagem</option>
            <option value="rent_share">Aluguel / divisao de custo</option>
          </select>

          {form.compensation_type === 'commission' && (
            <>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec, fontWeight: '600' }}>% da profissional</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.commission_percent}
                onChange={e => setForm({...form, commission_percent: e.target.value})}
                style={inputStyle}
              />
            </>
          )}

          {form.compensation_type === 'rent_share' && (
            <>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec, fontWeight: '600' }}>Valor mensal pago ao estudio</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.monthly_rent_share}
                onChange={e => setForm({...form, monthly_rent_share: e.target.value})}
                style={inputStyle}
              />
            </>
          )}

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
