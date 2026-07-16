import React from 'react'
import { buildWhatsAppUrl, firstName, formatShortDatePt } from '../utils/whatsapp'

const periodLabel = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite'
}

export default function BookingRequestsModal({
  open,
  onClose,
  theme,
  requests = [],
  services = [],
  professionals = [],
  loading = false,
  error = null,
  onUpdateStatus,
  onCreateAppointment
}) {
  if (!open) return null

  const isLight = theme === 'light'
  const bgMain = isLight ? '#f9f9f9' : '#121212'
  const bgCard = isLight ? '#ffffff' : '#222'
  const textMain = isLight ? '#333' : '#fff'
  const textSec = isLight ? '#666' : '#aaa'
  const borderCol = isLight ? '#ddd' : '#333'

  const handleWhatsApp = async (request) => {
    const service = services.find((item) => String(item.id) === String(request.service_id))
    const professional = professionals.find((item) => String(item.id) === String(request.professional_id))
    const message = (
      `Olá, ${firstName(request.customer_name)}! Aqui é do Bonyta Studio 💖\n\n` +
      `Recebemos sua solicitação pelo site para ${service?.name || 'atendimento'} ` +
      `em ${formatShortDatePt(request.preferred_date)} no período da ${periodLabel[request.preferred_period]?.toLowerCase() || 'preferência informada'}.\n\n` +
      `${professional ? `Você pediu com ${professional.name}. ` : ''}` +
      `Vou te passar as opções disponíveis para confirmar o melhor horário.`
    )

    window.open(buildWhatsAppUrl(request.customer_phone, message), '_blank', 'noopener,noreferrer')
    await onUpdateStatus?.(request.id, 'contacted')
  }

  return (
    <div className="modal-overlay active" style={{ zIndex: 99999 }}>
      <div className="modal-box" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh', padding: 0, background: bgMain }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <h3 style={{ color: 'var(--primary-color, #e91e63)', fontWeight: 900, margin: 0 }}>
              <i className="fa-solid fa-inbox" style={{ marginRight: '8px' }}></i> Solicitações do site
            </h3>
            <p style={{ color: textSec, fontSize: '0.78rem', marginTop: '4px' }}>Pedidos recebidos pela página /agendar</p>
          </div>
          <button onClick={onClose} style={{ width: '38px', height: '38px', borderRadius: '50%', border: `1px solid ${borderCol}`, background: bgCard, color: textMain, cursor: 'pointer' }} aria-label="Fechar">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {error && (
            <div style={{ padding: '12px', color: '#ff9a9a', background: 'rgba(239,68,68,.14)', borderRadius: '10px', fontSize: '0.85rem' }}>
              Erro ao carregar solicitações: {error.message}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '34px', color: textSec, background: bgCard, borderRadius: '12px', border: `1px dashed ${borderCol}` }}>
              Carregando solicitações...
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '34px', color: textSec, background: bgCard, borderRadius: '12px', border: `1px dashed ${borderCol}` }}>
              Nenhuma solicitação nova do site.
            </div>
          ) : (
            requests.map((request) => {
              const service = services.find((item) => String(item.id) === String(request.service_id))
              const professional = professionals.find((item) => String(item.id) === String(request.professional_id))
              const contacted = request.status === 'contacted'

              return (
                <article key={request.id} style={{ background: bgCard, border: `1px solid ${borderCol}`, borderLeft: contacted ? '4px solid #3b82f6' : '4px solid var(--primary-color, #e91e63)', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ color: textMain, margin: 0, fontSize: '1rem', fontWeight: 900 }}>{request.customer_name}</h4>
                      <p style={{ color: textSec, marginTop: '3px', fontSize: '0.8rem' }}>{request.customer_phone}</p>
                    </div>
                    <span style={{ height: 'fit-content', borderRadius: '999px', padding: '5px 9px', background: contacted ? 'rgba(59,130,246,.16)' : 'rgba(233,30,99,.16)', color: contacted ? '#7db1ff' : 'var(--primary-color, #e91e63)', fontSize: '0.68rem', fontWeight: 900 }}>
                      {contacted ? 'Contatada' : 'Nova'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gap: '5px', color: textSec, fontSize: '0.82rem' }}>
                    <span><strong style={{ color: textMain }}>Serviço:</strong> {service?.name || 'Não encontrado'}</span>
                    <span><strong style={{ color: textMain }}>Preferência:</strong> {formatShortDatePt(request.preferred_date)} · {periodLabel[request.preferred_period] || request.preferred_period}</span>
                    <span><strong style={{ color: textMain }}>Profissional:</strong> {professional?.name || 'Qualquer disponível'}</span>
                    {request.note && <span><strong style={{ color: textMain }}>Obs:</strong> {request.note}</span>}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button type="button" onClick={() => handleWhatsApp(request)} style={{ flex: 2, padding: '10px', background: '#25D366', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '0.82rem' }}>
                      <i className="fa-brands fa-whatsapp" style={{ marginRight: '6px' }}></i> Chamar
                    </button>
                    <button type="button" onClick={() => onCreateAppointment?.(request)} style={{ flex: 1, padding: '10px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '0.82rem' }}>
                      Criar
                    </button>
                    <button type="button" onClick={() => onUpdateStatus?.(request.id, 'archived')} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${borderCol}`, color: textSec, borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '0.82rem' }}>
                      Arquivar
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
