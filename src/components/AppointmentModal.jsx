import React, { useEffect, useState } from 'react';

const emptyForm = {
  client_id: '',
  service_id: '',
  professional_id: '',
  date: '',
  time: '',
  duration_minutes: 60,
  observation: '',
  status: 'pendente'
};

const parseSavedItems = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function AppointmentModal({
  open, onClose, onSubmit, onDelete,
  professionals, defaultDate, editingAppointment, theme, clients = [], services = []
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  
  // Lista de produtos mockados (em breve virão do banco)
  const availableProducts = [
    { id: 'p1', name: 'Óleo de Cutícula', price: 25, cost: 7 },
    { id: 'p2', name: 'Sérum Fortalecedor', price: 45, cost: 15 },
    { id: 'p3', name: 'Nail Art Extra', price: 15, cost: 2 }
  ];

  // Estado da Comanda (Itens extras vendidos)
  const [comandaItens, setComandaItens] = useState([]);

  const isLight = theme === 'light';
  const bgMain = isLight ? '#f9f9f9' : '#121212';
  const bgCard = isLight ? '#ffffff' : '#1e1e1e';
  const bgInput = isLight ? '#ffffff' : '#222';
  const textMain = isLight ? '#333' : '#fff';
  const textSec = isLight ? '#666' : '#ccc';
  const borderCol = isLight ? '#ddd' : '#333';

  const inputStyle = { 
    width: '100%', padding: '14px', borderRadius: '8px', border: `1px solid ${borderCol}`, 
    background: bgInput, color: textMain, outline: 'none', fontSize: '0.95rem'
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none', WebkitAppearance: 'none', paddingRight: '40px',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='${isLight ? '%23333' : '%23fff'}' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
    backgroundRepeat: 'no-repeat', backgroundPositionX: 'calc(100% - 12px)', backgroundPositionY: 'center'
  };

  useEffect(() => {
    if (open) {
      if (editingAppointment) {
        setForm({ ...emptyForm, ...editingAppointment });
        const savedItems = editingAppointment.comanda || parseSavedItems(editingAppointment.comanda_json)
        setComandaItens(savedItems);
      } else {
        setForm({
          ...emptyForm,
          date: defaultDate,
          professional_id: professionals[0]?.id || ''
        });
        setComandaItens([]);
      }
    }
  }, [open, defaultDate, professionals, editingAppointment]);

  if (!open) return null;

  // Adiciona um item extra à comanda
  const handleAddItem = (productId) => {
    if (!productId) return;
    const prod = availableProducts.find(p => p.id === productId);
    if (!prod) return;

    setComandaItens([...comandaItens, { ...prod, qty: 1 }]);
  };

  // Remove um item da comanda
  const handleRemoveItem = (index) => {
    setComandaItens(comandaItens.filter((_, i) => i !== index));
  };

  // Calcula o fechamento financeiro total da comanda na hora
  const selectedService = services.find(s => String(s.id) === String(form.service_id));
  const servicePrice = selectedService ? Number(selectedService.price) : 0;
  const serviceCost = selectedService ? Number(selectedService.material_cost) : 0;
  
  const extrasPrice = comandaItens.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const extrasCost = comandaItens.reduce((sum, item) => sum + (item.cost * item.qty), 0);

  const totalGeral = servicePrice + extrasPrice;
  const lucroLiquido = totalGeral - (serviceCost + extrasCost);

  const handleWhatsApp = () => {
    const cli = clients.find(c => String(c.id) === String(form.client_id));
    if (!cli) return alert("Selecione um cliente.");
    const phone = String(cli.phone || '').replace(/\D/g, '');
    if (!phone) return alert("Telefone inválida.");

    const dateFormatted = form.date.split('-').reverse().slice(0,2).join('/');
    const text = `Olá! Confirmando seu horário no Bonyta Studio dia *${dateFormatted}* às *${form.time.slice(0,5)}*. Aguardamos você!`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_id || !form.service_id) return alert("Selecione Cliente e Serviço.");

    setSaving(true);
    try {
      const cli = clients.find(c => String(c.id) === String(form.client_id));
      await onSubmit({
        ...form,
        is_block: false,
        duration_minutes: Number(form.duration_minutes),
        client_name: cli?.name,
        service: selectedService?.name,
        total_price: totalGeral, // Envia o valor já somado com os produtos extras
        total_cost: serviceCost + extrasCost,
        comanda: comandaItens // Envia os itens extras anexados
      });
      onClose();
    } catch (err) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 99999 }}>
      <div className="modal-box" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh', padding: '0', background: bgMain }}>
        
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: `1px solid ${borderCol}` }}>
          <h3 style={{ color: 'var(--primary-color, #e91e63)', fontWeight: 'bold', margin: 0 }}>
            {editingAppointment ? 'Comanda / Detalhes do Horário' : 'Novo Agendamento'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '24px', flex: 1 }}>
            
            {/* Seletor de Status */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: textSec, fontWeight: '600' }}>Status</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['pendente', 'confirmado', 'concluido', 'faltou'].map(s => (
                  <button
                    key={s} type="button" onClick={() => setForm({ ...form, status: s })}
                    style={{
                      flex: 1, padding: '10px 6px', borderRadius: '8px', border: `1px solid ${form.status === s ? 'transparent' : borderCol}`,
                      background: form.status === s ? (s === 'concluido' ? '#10b981' : s === 'confirmado' ? '#3b82f6' : s === 'faltou' ? '#ef4444' : '#f59e0b') : 'transparent',
                      color: form.status === s ? '#fff' : textSec, fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'capitalize', cursor: 'pointer'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Cliente e Serviço Core */}
            <div className="appointment-core-grid" style={{ marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: textSec }}>Cliente</label>
                <select required value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={selectStyle}>
                  <option value="">Selecione...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: textSec }}>Serviço Base</label>
                <select required value={form.service_id} onChange={e => setForm({...form, service_id: e.target.value})} style={selectStyle}>
                  <option value="">Selecione...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} (R$ {s.price})</option>)}
                </select>
              </div>
            </div>

            {/* Data e Hora */}
            <div className="appointment-schedule-grid" style={{ marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: textSec }}>Data</label>
                <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: textSec }}>Horário</label>
                <input type="time" required value={form.time} onChange={e => setForm({...form, time: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: textSec }}>Profissional</label>
                <select value={form.professional_id} onChange={e => setForm({...form, professional_id: e.target.value})} style={selectStyle}>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* =======================================================
                A COMANDA VIVA: ADICIONAR PRODUTOS/EXTRAS À VENDA
                ======================================================= */}
            <div style={{ background: bgCard, padding: '16px', borderRadius: '12px', border: `1px solid ${borderCol}`, marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary-color, #e91e63)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <i className="fa-solid fa-cart-shopping" style={{ marginRight: '6px' }}></i> Comanda: Vendas Extras / Produtos
              </h4>
              
              <select onChange={e => { handleAddItem(e.target.value); e.target.value = ''; }} style={selectStyle}>
                <option value="">+ Adicionar produto ou extra à conta...</option>
                {availableProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (+ R$ {p.price.toFixed(2)})</option>
                ))}
              </select>

              {/* Lista de itens inseridos na comanda */}
              {comandaItens.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {comandaItens.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: bgMain, padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <span style={{ color: textMain }}>{item.name} (x{item.qty})</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 'bold', color: textMain }}>R$ {item.price.toFixed(2)}</span>
                        <button type="button" onClick={() => handleRemoveItem(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RESUMO FINANCEIRO DA COMANDA EM TEMPO REAL */}
            <div style={{ background: 'rgba(233, 30, 99, 0.03)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--primary-color, #e91e63)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div style={{ color: textSec }}>Subtotal do Serviço:</div>
              <div style={{ textAlign: 'right', fontWeight: 'bold', color: textMain }}>R$ {servicePrice.toFixed(2)}</div>
              <div style={{ color: textSec }}>Subtotal de Extras:</div>
              <div style={{ textAlign: 'right', fontWeight: 'bold', color: textMain }}>R$ {extrasPrice.toFixed(2)}</div>
              <div style={{ color: 'var(--primary-color, #e91e63)', fontWeight: 'bold', fontSize: '1rem', paddingTop: '6px', borderTop: `1px solid ${borderCol}` }}>TOTAL GERAL:</div>
              <div style={{ textAlign: 'right', fontWeight: '900', color: 'var(--primary-color, #e91e63)', fontSize: '1.1rem', paddingTop: '6px', borderTop: `1px solid ${borderCol}` }}>R$ {totalGeral.toFixed(2)}</div>
            </div>

          </div>

          {/* Botões de Ação */}
          <div className="modal-actions" style={{ padding: '16px 24px 32px 24px', borderTop: `1px solid ${borderCol}`, background: bgMain, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {editingAppointment && (
              <button type="button" onClick={handleWhatsApp} style={{ width: '100%', padding: '12px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <i className="fa-brands fa-whatsapp"></i> Mandar Lembrete de Horário
              </button>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              {form.id && onDelete && (
                <button type="button" onClick={() => { if(window.confirm("Remover agendamento?")) { onDelete(form.id); onClose(); } }} style={{ flex: 1, background: '#ff4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Excluir</button>
              )}
              <button type="button" className="btn-secondary" onClick={onClose} disabled={saving} style={{ flex: 1, background: 'transparent', color: textMain, borderColor: borderCol, borderRadius: '8px', padding: '12px', cursor: 'pointer' }}>Voltar</button>
              <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 2, background: 'var(--primary-color, #e91e63)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', padding: '12px', cursor: 'pointer' }}>
                {saving ? 'Gravando...' : 'Salvar Comanda'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
