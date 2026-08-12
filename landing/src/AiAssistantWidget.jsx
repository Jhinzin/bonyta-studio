import React, { useState } from 'react'

const KNOWLEDGE_BASE = [
  { keywords: ['cilio', 'cilios', 'extensao', 'fox', 'brasileiro', 'boneca'], answer: 'Oferecemos extensões de cílios Volume Brasileiro (R$ 140), Bonyta Fox (R$ 180) e Volume Boneca. A aplicação dura cerca de 2 horas e o resultado é incrível! ✨' },
  { keywords: ['unha', 'unhas', 'fibra', 'gel', 'molde', 'f1', 'alongamento'], answer: 'Trabalhamos com Alongamento em Fibra de Vidro (Aplicação R$ 170 / Manutenção R$ 130), Molde F1 (R$ 140) e Esmaltação em Gel (R$ 65)! 💅' },
  { keywords: ['sobrancelha', 'sobrancelhas', 'henna', 'brow', 'lamination', 'design'], answer: 'Nossos serviços de Sobrancelha incluem Design Personalizado (R$ 40), Design com Henna (R$ 55) e Brow Lamination (R$ 180). Perfect match pro seu rosto! 💖' },
  { keywords: ['pix', 'pagamento', 'sinal', 'cartao', 'valor'], answer: 'Você pode pagar no estúdio via PIX, Cartão de Crédito/Débito ou Dinheiro. Para garantir seu agendamento, aceitamos sinal via PIX de 30%.' },
  { keywords: ['horario', 'agendar', 'marcar', 'vaga', 'tempo'], answer: 'Você pode escolher seu serviço e ver os horários disponíveis direto no nosso formulário de agendamento aqui no site!' },
  { keywords: ['onde', 'endereco', 'local', 'bairro', 'estudio'], answer: 'Estamos localizados na Vila Maria, Zona Norte de São Paulo/SP. Enviamos o endereço exato com mapa na confirmação pelo WhatsApp!' }
]

export default function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Olá! Sou a assistente virtual da Bonyta Studio 💖 Como posso ajudar você hoje com nossos serviços, valores ou horários?' }
  ])
  const [input, setInput] = useState('')

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userText = input.trim()
    const userMsg = { sender: 'user', text: userText }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    // Process answer based on Knowledge Base keywords
    setTimeout(() => {
      const lower = userText.toLowerCase()
      const match = KNOWLEDGE_BASE.find((item) => item.keywords.some((kw) => lower.includes(kw)))
      const replyText = match
        ? match.answer
        : 'Posso te ajudar a escolher o procedimento ideal! Caso queira agendar agora, clique em "Ver Horários" no menu ou me chame no WhatsApp 💕'

      setMessages((prev) => [...prev, { sender: 'bot', text: replyText }])
    }, 600)
  }

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
            color: '#fff',
            border: 'none',
            borderRadius: '30px',
            padding: '12px 20px',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(236, 72, 153, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'transform 0.2s'
          }}
        >
          <span>🤖 Assistente Bonyta</span>
        </button>
      )}

      {isOpen && (
        <div style={{
          width: '350px',
          maxHeight: '500px',
          height: '450px',
          background: '#18181b',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
            padding: '14px 16px',
            color: '#fff',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong style={{ display: 'block', fontSize: '1rem' }}>🤖 Assistente Bonyta IA</strong>
              <small style={{ opacity: 0.9 }}>Tire suas dúvidas em tempo real</small>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>

          <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.sender === 'user' ? '#ec4899' : '#27272a',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  maxWidth: '82%',
                  fontSize: '0.88rem',
                  lineHeight: '1.4'
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} style={{ display: 'flex', borderTop: '1px solid #27272a', padding: '8px' }}>
            <input
              type="text"
              placeholder="Digite sua dúvida..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '10px',
                color: '#fff',
                outline: 'none',
                fontSize: '0.88rem'
              }}
            />
            <button
              type="submit"
              style={{
                background: '#ec4899',
                border: 'none',
                color: '#fff',
                borderRadius: '8px',
                padding: '0 14px',
                marginLeft: '6px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ➔
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
