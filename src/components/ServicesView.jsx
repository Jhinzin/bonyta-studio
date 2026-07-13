import React, { useState } from 'react';
import { useServices } from '../hooks/useServices';

export default function ServicesView({ theme }) {
  const { services, isLoading, createService, updateService, deleteService } = useServices();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({ name: '', duration_minutes: 120, price: '', material_cost: '' });

  // CORES DINÂMICAS BASEADAS NO TEMA
  const isLight = theme === 'light';
  const bgMain = isLight ? '#f5f5f5' : '#121212';
  const bgCard = isLight ? '#ffffff' : '#2a2a2a';
  const bgInput = isLight ? '#ffffff' : '#222';
  const textMain = isLight ? '#333' : '#fff';
  const textSec = isLight ? '#666' : '#ccc';
  const borderCol = isLight ? '#ddd' : '#333';

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({ name: service.name, duration_minutes: service.duration_minutes, price: service.price, material_cost: service.material_cost });
    } else {
      setEditingService(null);
      setFormData({ name: '', duration_minutes: 120, price: '', material_cost: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      duration_minutes: parseInt(formData.duration_minutes, 10),
      price: parseFloat(String(formData.price).replace(',', '.')),
      material_cost: parseFloat(String(formData.material_cost).replace(',', '.'))
    };
    if (editingService) await updateService(editingService.id, payload);
    else await createService(payload);
    setIsModalOpen(false);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDuration = (min) => `${Math.floor(min / 60)}h ${min % 60 > 0 ? `${min % 60}m` : ''}`.trim();

  return (
    <div style={{ padding: '20px', paddingBottom: '90px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: textMain }}>Catálogo de Serviços</h2>
        <button onClick={() => handleOpenModal()} style={{ background: 'var(--primary-color, #e91e63)', color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>
          <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i> Novo
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: textSec }}>Carregando...</div>
      ) : services.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: bgCard, borderRadius: '12px', border: `1px solid ${borderCol}` }}>
          <i className="fa-solid fa-sparkles" style={{ fontSize: '3rem', color: textSec, marginBottom: '16px' }}></i>
          <p style={{ color: textSec }}>Nenhum serviço cadastrado.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {services.map(s => (
            <div key={s.id} onClick={() => handleOpenModal(s)} style={{ background: bgCard, padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderLeft: '4px solid var(--primary-color, #e91e63)', borderTop: `1px solid ${borderCol}`, borderRight: `1px solid ${borderCol}`, borderBottom: `1px solid ${borderCol}` }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px', color: textMain }}>{s.name}</h3>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: textSec }}>
                  <span><i className="fa-regular fa-clock"></i> {formatDuration(s.duration_minutes)}</span>
                  <span><i className="fa-solid fa-box-open"></i> CMV: {formatCurrency(s.material_cost)}</span>
                </div>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: textMain }}>{formatCurrency(s.price)}</div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', zIndex: 99999 }}>
          <div style={{ background: bgMain, width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 24px 40px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: textMain }}>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: textMain, fontSize: '1.5rem' }}><i className="fa-solid fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec }}>Nome (Ex: Volume Brasileiro)</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgInput, color: textMain }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec }}>Duração em Minutos</label>
                <input type="number" required value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgInput, color: textMain }} />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec }}>Valor (R$)</label>
                  <input type="number" required step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgInput, color: textMain }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec }}>Custo Material (R$)</label>
                  <input type="number" required step="0.01" value={formData.material_cost} onChange={e => setFormData({...formData, material_cost: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgInput, color: textMain }} />
                </div>
              </div>
              <button type="submit" style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', background: 'var(--primary-color, #e91e63)', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '16px' }}>Salvar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}