import React from 'react'

export default function CatalogModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content catalog-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '900px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="modal-header" style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📖</span> Catálogo Oficial — Maira Stoche Bonyta Studio
          </h2>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="catalog-content" style={{ flex: '1', overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(168, 85, 247, 0.1))',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#ec4899', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
              Catálogo Especial de Procedimentos & Cuidados
            </h3>
            <p style={{ color: '#d1d5db', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 1rem' }}>
              Explore nossa linha exclusiva de extensões de cílios, design de sobrancelhas e tratamentos de beleza personalizados pela especialista <strong>Maira Stoche</strong>.
            </p>

            <a
              href="/Catálogo By Maira Stoche 1025.pdf"
              target="_blank"
              rel="noopener noreferrer"
              download
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 'bold',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
              }}
            >
              📥 Baixar Catálogo Completo (PDF)
            </a>
          </div>

          <div style={{ width: '100%', height: '600px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <iframe
              src="/Catálogo By Maira Stoche 1025.pdf#toolbar=0"
              title="Catálogo Maira Stoche"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
