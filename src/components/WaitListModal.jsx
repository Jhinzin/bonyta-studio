import React, { useState } from 'react';

export default function WaitlistModal({ 
  open, onClose, clients, services, professionals, defaultDate, theme, 
  waitlist = [], onAdd, onRemove 
}) {
  const [form, setForm] = useState({ client_id: '', service_id: '', professional_id: 'qualquer' });

  if (!open) return null;

  const isLight = theme === 'light';
  const bgMain = isLight ? '#f9f9f9' : '#121212';
  const bgCard = isLight ? '#ffffff' : '#222';
  const textMain = isLight ? '#333' : '#fff';
  const textSec = isLight ? '#666' : '#aaa';
  const borderCol = isLight ? '#ddd' : '#333';

  const inputStyle = { 
    width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${borderCol}`, 
    background: bgCard, color: textMain, outline: 'none', fontSize: '0.9rem', marginBottom: '12px'
  };

  // Filtra quem está esperando para a data selecionada na agenda
  const todaysWaitlist = waitlist.filter(w => w.preferred_date === defaultDate);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.client_id || !form.service_id) return alert("Selecione Cliente e Serviço.");
    
    onAdd({
      client_id: form.client_id,
      service_id: form.service_id,
      professional_id: form.professional_id === 'qualquer' ? null : form.professional_id,
      preferred_date: defaultDate
    });
    setForm({ client_id: '', service_id: '', professional_id: 'qualquer' }); // Limpa o form
  };

  const handleNotify = (item) => {
    const cli = clients.find(c => String(c.id) === String(item.client_id));
    const serv = services.find(s => String(s.id) === String(item.service_id));
    if (!cli) return;

    const phoneMatch = cli.name.match(/\((\d{10,11})\)/) || cli.phone?.match(/\d+/g)?.join('');
    const phone = phoneMatch ? (Array.isArray(phoneMatch) ? phoneMatch[1] : phoneMatch) : '';
    
    if (!phone) return alert("Cliente sem telefone válido.");

    const text = `Olá, ${cli.name.split(' ')[0]}! Aqui é do Bonyta Studio. Surgiu uma vaga para hoje para fazer *${serv?.name}*! Você ainda tem interesse em vir?`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 99999 }}>
      <div className="modal-box" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh', padding: '0', background: bgMain }}>
        
        <div style={{ padding: '20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#3b82f6', fontWeight: 'bold', margin: 0 }}>
            <i className="fa-solid fa-clipboard-list" style={{ marginRight: '8px' }}></i> Lista de Espera
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: textMain, fontSize: '1.2rem', cursor: 'pointer' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          
          {/* SESSÃO 1: ADICIONAR À FILA */}
          <div style={{ background: bgCard, padding: '16px', borderRadius: '12px', border: `1px solid ${borderCol}`, marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: textMain, fontSize: '0.95rem' }}>Adicionar para {defaultDate.split('-').reverse().join('/')}</h4>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={inputStyle} required>
                <option value="">1. Selecione a Cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              
              <select value={form.service_id} onChange={e => setForm({...form, service_id: e.target.value})} style={inputStyle} required>
                <option value="">2. Selecione o Serviço...</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <select value={form.professional_id} onChange={e => setForm({...form, professional_id: e.target.value})} style={inputStyle}>
                <option value="qualquer">3. Qualquer Profissional (Mais Rápido)</option>
                {professionals.map(p => <option key={p.id} value={p.id}>Apenas com: {p.name}</option>)}
              </select>

              <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Colocar na Fila
              </button>
            </form>
          </div>

          {/* SESSÃO 2: QUEM ESTÁ ESPERANDO HOJE */}
          <h4 style={{ margin: '0 0 12px 0', color: textSec, fontSize: '0.85rem', textTransform: 'uppercase' }}>Aguardando Vaga Hoje</h4>
          
          {todaysWaitlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: textSec, background: bgCard, borderRadius: '12px', border: `1px dashed ${borderCol}` }}>
              Ninguém na lista de espera para este dia.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todaysWaitlist.map(item => {
                const cli = clients.find(c => String(c.id) === String(item.client_id));
                const serv = services.find(s => String(s.id) === String(item.service_id));
                const prof = professionals.find(p => String(p.id) === String(item.professional_id));

                return (
                  <div key={item.id} style={{ background: bgCard, padding: '16px', borderRadius: '12px', border: `1px solid ${borderCol}`, position: 'relative' }}>
                    <div style={{ fontWeight: 'bold', color: textMain, fontSize: '0.95rem' }}>{cli?.name}</div>
                    <div style={{ color: 'var(--primary-color, #e91e63)', fontSize: '0.8rem', margin: '4px 0' }}>{serv?.name}</div>
                    <div style={{ color: textSec, fontSize: '0.75rem' }}>
                      <i className="fa-solid fa-user" style={{ marginRight: '4px' }}></i> 
                      {prof ? prof.name : 'Qualquer Profissional'}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button onClick={() => onRemove(item.id)} style={{ flex: 1, padding: '8px', background: 'transparent', border: `1px solid ${borderCol}`, color: textSec, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        Remover
                      </button>
                      <button onClick={() => handleNotify(item)} style={{ flex: 2, padding: '8px', background: '#25D366', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <i className="fa-brands fa-whatsapp"></i> Avisar Vaga
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}