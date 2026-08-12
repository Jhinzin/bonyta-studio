import React, { useState } from 'react'
import { sendWhatsAppNotification, buildConfirmationMsg } from '../utils/WhatsAppNotifications'

export default function PixPaymentModal({ appointment, onClose }) {
  const [copied, setCopied] = useState(false)
  const depositValue = appointment?.price ? (Number(appointment.price) * 0.3).toFixed(2) : '30.00'
  const pixKey = import.meta.env.VITE_PIX_KEY || '11999999999'

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleSendProof = () => {
    const msg = buildConfirmationMsg({
      customerName: appointment?.customer_name || 'Cliente',
      serviceName: appointment?.service_name || appointment?.title || 'Serviço Bonyta',
      professionalName: appointment?.professional_name,
      dateFormatted: appointment?.date || 'a combinar',
      timeSlot: appointment?.time || 'a combinar',
      depositAmount: depositValue,
      pixKey: pixKey
    })

    sendWhatsAppNotification(appointment?.customer_phone, msg)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content pix-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💳 Sinal de Agendamento PIX</h2>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="pix-body" style={{ textAlign: 'center', padding: '1rem' }}>
          <div className="pix-badge" style={{
            background: 'rgba(236, 72, 153, 0.15)',
            color: '#ec4899',
            padding: '8px 16px',
            borderRadius: '20px',
            fontWeight: '600',
            display: 'inline-block',
            marginBottom: '1rem'
          }}>
            Garantia de Horário sem No-Show
          </div>

          <p style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            Para garantir a vaga do atendimento de <strong>{appointment?.customer_name || 'Cliente'}</strong>, solicite o pagamento do sinal de 30%:
          </p>

          <div className="pix-amount" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f43f5e', marginBottom: '1rem' }}>
            R$ {depositValue}
          </div>

          <div className="pix-key-box" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px dashed rgba(236, 72, 153, 0.4)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <small style={{ color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Chave PIX (Telefone/CNPJ):</small>
            <strong style={{ fontSize: '1.1rem', letterSpacing: '0.5px' }}>{pixKey}</strong>
            
            <button
              type="button"
              onClick={handleCopyPix}
              style={{
                display: 'block',
                margin: '10px auto 0',
                background: copied ? '#10b981' : '#ec4899',
                color: '#fff',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {copied ? '✓ Chave PIX Copiada!' : '📋 Copiar Chave PIX'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleSendProof}
              style={{
                background: '#25d366',
                color: '#fff',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                flex: '1'
              }}
            >
              📲 Enviar Instruções no WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
