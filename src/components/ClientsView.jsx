import React, { useState } from 'react';
import { useClients } from '../hooks/useClients';

export default function ClientsView({ theme }) {
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showMoreFields, setShowMoreFields] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', phone: '', cpf: '', birth_date: '', email: '', address: '', observation: ''
  });

  // LÓGICA DE CORES DINÂMICAS PARA MODO LIGHT/DARK
  const isLight = theme === 'light';
  const bgMain = isLight ? '#f9f9f9' : '#121212';
  const bgCard = isLight ? '#ffffff' : '#2a2a2a';
  const bgInput = isLight ? '#ffffff' : '#222';
  const textMain = isLight ? '#333' : '#fff';
  const textSec = isLight ? '#666' : '#ccc';
  const borderCol = isLight ? '#ddd' : '#333';

  const inputStyle = { width: '100%', padding: '14px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgInput, color: textMain, outline: 'none' };

  const handleOpenModal = (client = null) => {
    setShowMoreFields(false);
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({ name: '', phone: '', cpf: '', birth_date: '', email: '', address: '', observation: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.birth_date) payload.birth_date = null; 

    if (editingClient) await updateClient(editingClient.id, payload);
    else await createClient(payload);
    
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '90px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: textMain }}>Meus Clientes</h2>
        <button 
          onClick={() => handleOpenModal()}
          style={{ background: 'var(--primary-color, #e91e63)', color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i> Novo
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: textSec }}>Carregando...</div>
      ) : clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: bgCard, borderRadius: '12px', border: `1px solid ${borderCol}` }}>
          <i className="fa-solid fa-users" style={{ fontSize: '3rem', color: textSec, marginBottom: '16px' }}></i>
          <p style={{ color: textSec }}>Sua lista de clientes está vazia.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {clients.map(client => (
            <div key={client.id} onClick={() => handleOpenModal(client)} style={{ background: bgCard, padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderLeft: '4px solid #4caf50', borderTop: `1px solid ${borderCol}`, borderRight: `1px solid ${borderCol}`, borderBottom: `1px solid ${borderCol}` }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px', color: textMain }}>{client.name}</h3>
                <div style={{ fontSize: '0.85rem', color: textSec }}>
                  <i className="fa-brands fa-whatsapp"></i> {client.phone || 'Sem telefone'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', zIndex: 99999 }}>
          <div style={{ background: bgMain, width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 24px 40px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: textMain }}>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: textMain, fontSize: '1.5rem', cursor: 'pointer' }}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec }}>Nome *</label>
                <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec }}>WhatsApp / Telefone</label>
                <input type="text" placeholder="(11) 99999-9999" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec }}>Data de Nasc.</label>
                  <input type="date" value={formData.birth_date || ''} onChange={e => setFormData({...formData, birth_date: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec }}>CPF</label>
                  <input type="text" placeholder="000.000.000-00" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})} style={inputStyle} />
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setShowMoreFields(!showMoreFields)}
                style={{ background: 'transparent', border: `1px solid ${borderCol}`, color: textSec, padding: '10px', borderRadius: '8px', cursor: 'pointer', marginTop: '8px' }}
              >
                {showMoreFields ? 'Ocultar campos adicionais ▲' : 'Mais campos (E-mail, Endereço...) ▼'}
              </button>

              {showMoreFields && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: bgCard, padding: '16px', borderRadius: '8px', border: `1px solid ${borderCol}` }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec }}>E-mail</label>
                    <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec }}>Endereço Completo</label>
                    <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec }}>Observações (Alergias, Preferências)</label>
                    <textarea rows="3" value={formData.observation || ''} onChange={e => setFormData({...formData, observation: e.target.value})} style={{ ...inputStyle, resize: 'none' }} />
                  </div>
                </div>
              )}

              <button type="submit" style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', background: 'var(--primary-color, #e91e63)', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '16px', cursor: 'pointer' }}>
                Salvar Cliente
              </button>

              {editingClient && (
                <button type="button" onClick={async () => { if(window.confirm('Excluir cliente?')) { await deleteClient(editingClient.id); setIsModalOpen(false); } }} style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #ff4444', background: 'transparent', color: '#ff4444', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                  Excluir
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}