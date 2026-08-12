import React, { useState } from 'react'

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Excluir', confirmColor = '#ef4444' }) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-icon">
          <i className="fa-solid fa-triangle-exclamation" />
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-dialog-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              background: loading ? '#666' : confirmColor,
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            {loading ? (
              <><i className="fa-solid fa-spinner fa-spin" /> Aguarde...</>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
