import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { buildWhatsAppUrl } from '../utils/whatsapp'
import './public-booking.css'

const periods = [
  { value: 'manha', label: 'Manhã (08h–12h)' },
  { value: 'tarde', label: 'Tarde (12h–18h)' },
  { value: 'noite', label: 'Noite (18h–21h)' }
]

const highlights = [
  { title: 'Atendimento com hora marcada', text: 'Você solicita o melhor período e a equipe confirma a disponibilidade pelo WhatsApp.' },
  { title: 'Cuidado personalizado', text: 'Preferências, alergias e observações ficam registradas para o próximo atendimento.' },
  { title: 'Catálogo sempre atualizado', text: 'Serviços, duração e valores vêm direto do sistema interno da Bonyta.' }
]

const faqs = [
  {
    question: 'O pedido pelo site já confirma o horário?',
    answer: 'Ainda não. Ele entra na fila da equipe e a confirmação final acontece pelo WhatsApp para evitar horários duplicados.'
  },
  {
    question: 'Preciso pagar pelo site?',
    answer: 'Não. Nenhum pagamento é feito por aqui. A página serve para solicitar o horário e agilizar o atendimento.'
  },
  {
    question: 'Posso escolher profissional?',
    answer: 'Pode. Se preferir, também dá para deixar como qualquer profissional disponível.'
  }
]

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}).format(Number(value || 0))

const todayISO = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10)
}

export default function PublicBookingView() {
  const [services, setServices] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitStatus, setSubmitStatus] = useState('')
  const [form, setForm] = useState({
    serviceId: '',
    professionalId: 'qualquer',
    date: '',
    period: 'tarde',
    name: '',
    phone: '',
    note: ''
  })

  useEffect(() => {
    let active = true

    const loadCatalog = async () => {
      const [servicesResult, professionalsResult] = await Promise.all([
        supabase
          .from('services')
          .select('id,name,duration_minutes,price')
          .eq('active', true)
          .order('name'),
        supabase
          .from('professionals')
          .select('id,name')
          .eq('active', true)
          .order('name')
      ])

      if (!active) return
      setServices(servicesResult.data || [])
      setProfessionals(professionalsResult.data || [])
      setLoading(false)
    }

    loadCatalog()
    return () => { active = false }
  }, [])

  const selectedService = useMemo(
    () => services.find((service) => String(service.id) === String(form.serviceId)),
    [form.serviceId, services]
  )

  const selectService = (serviceId) => {
    setForm((current) => ({ ...current, serviceId: String(serviceId) }))
    document.querySelector('#solicitar-horario')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitStatus('saving')

    const professional = professionals.find((item) => String(item.id) === String(form.professionalId))
    const date = form.date
      ? new Date(`${form.date}T12:00:00`).toLocaleDateString('pt-BR')
      : 'a combinar'
    const period = periods.find((item) => item.value === form.period)?.label || 'a combinar'

    const message = [
      'Olá! Vim pelo site da Bonyta Studio e gostaria de solicitar um horário 💖',
      '',
      `Nome: ${form.name}`,
      `Serviço: ${selectedService?.name || 'Quero orientação'}`,
      `Profissional: ${professional?.name || 'Qualquer profissional disponível'}`,
      `Data preferida: ${date}`,
      `Período: ${period}`,
      `Telefone: ${form.phone}`,
      form.note ? `Observação: ${form.note}` : '',
      '',
      'Pode me confirmar quais horários estão disponíveis?'
    ].filter(Boolean).join('\n')

    const number = String(import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')

    const { error } = await supabase
      .from('booking_requests')
      .insert({
        customer_name: form.name,
        customer_phone: form.phone,
        service_id: form.serviceId || null,
        professional_id: form.professionalId === 'qualquer' ? null : form.professionalId,
        preferred_date: form.date,
        preferred_period: form.period,
        note: form.note || null,
        status: 'new'
      })

    setSubmitStatus(error ? 'fallback' : 'saved')
    if (error) console.warn('Não foi possível salvar a solicitação pública:', error)

    window.open(buildWhatsAppUrl(number, message), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="booking-site">
      <header className="booking-header">
        <a className="booking-brand" href="#inicio" aria-label="Bonyta Studio — início">
          <span className="booking-brand-mark">B</span>
          <span>Bonyta Studio</span>
        </a>
        <nav className="booking-nav" aria-label="Navegação principal">
          <a href="#servicos">Serviços</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="https://www.instagram.com/bonytastudio/" target="_blank" rel="noreferrer">Instagram</a>
        </nav>
        <a className="booking-header-cta" href="#solicitar-horario">Agendar</a>
      </header>

      <main>
        <section className="booking-hero" id="inicio">
          <div className="booking-hero-copy">
            <span className="booking-eyebrow">Vila Maria · Zona Norte · SP</span>
            <h1>Beleza com identidade, cuidado e hora marcada.</h1>
            <p>
              Unhas, cílios e sobrancelhas com atendimento acolhedor, resultado marcante
              e uma experiência pensada para você se sentir ainda mais bonyta.
            </p>
            <div className="booking-hero-actions">
              <a className="booking-primary-button" href="#solicitar-horario">Solicitar horário</a>
              <a className="booking-secondary-button" href="#servicos">Ver catálogo</a>
            </div>
            <div className="booking-trust-row" aria-label="Diferenciais do estúdio">
              <span>Confirmação pelo WhatsApp</span>
              <span>Sem pagamento pelo site</span>
              <span>Preferências registradas</span>
            </div>
          </div>

          <div className="booking-hero-art" aria-hidden="true">
            <div className="hero-card hero-card-main">
              <span>Agenda Bonyta</span>
              <strong>Seu horário com carinho</strong>
              <small>Pedido rápido · confirmação humana</small>
            </div>
            <div className="hero-card hero-card-floating">
              <span>✨</span>
              <strong>Studio</strong>
              <small>beleza com identidade</small>
            </div>
            <span className="hero-orbit hero-orbit-one" />
            <span className="hero-orbit hero-orbit-two" />
          </div>
        </section>

        <section className="booking-highlight-section" id="como-funciona">
          {highlights.map((item, index) => (
            <article key={item.title} className="booking-highlight-card">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </section>

        <section className="booking-section" id="servicos">
          <div className="booking-section-heading">
            <span className="booking-eyebrow">Catálogo Bonyta</span>
            <h2>Escolha o cuidado que combina com seu momento.</h2>
            <p>Valores e duração são atualizados pelo próprio estúdio. Escolha um serviço para levar direto ao pedido de horário.</p>
          </div>

          {loading ? (
            <div className="booking-loading">Carregando serviços...</div>
          ) : services.length > 0 ? (
            <div className="service-card-grid">
              {services.map((service) => (
                <article className="public-service-card" key={service.id}>
                  <div className="service-card-accent" />
                  <span className="service-card-kicker">Experiência Bonyta</span>
                  <h3>{service.name}</h3>
                  <div className="service-card-meta">
                    <span>{service.duration_minutes || 60} min</span>
                    <strong>{formatCurrency(service.price)}</strong>
                  </div>
                  <button type="button" onClick={() => selectService(service.id)}>Quero este</button>
                </article>
              ))}
            </div>
          ) : (
            <div className="booking-empty">
              O catálogo está sendo atualizado. Você ainda pode pedir uma recomendação pelo WhatsApp.
            </div>
          )}
        </section>

        <section className="booking-request-section" id="solicitar-horario">
          <div className="booking-request-copy">
            <span className="booking-eyebrow">Pré-agendamento</span>
            <h2>Conte sua preferência. A equipe confirma o melhor horário.</h2>
            <p>
              Esse pedido entra no sistema da Bonyta e também abre uma mensagem pronta no WhatsApp.
              Assim a equipe responde mais rápido e evita choque de horários.
            </p>
            <ol>
              <li><span>1</span> Escolha serviço, profissional e data.</li>
              <li><span>2</span> Envie o pedido pronto pelo WhatsApp.</li>
              <li><span>3</span> Receba a confirmação da equipe.</li>
            </ol>
          </div>

          <form className="booking-request-form" onSubmit={handleSubmit}>
            <label>Serviço
              <select required value={form.serviceId} onChange={(event) => setForm({ ...form, serviceId: event.target.value })}>
                <option value="">Selecione um serviço</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name} — {formatCurrency(service.price)}</option>
                ))}
              </select>
            </label>

            <label>Profissional
              <select value={form.professionalId} onChange={(event) => setForm({ ...form, professionalId: event.target.value })}>
                <option value="qualquer">Qualquer profissional disponível</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>{professional.name}</option>
                ))}
              </select>
            </label>

            <div className="booking-form-row">
              <label>Data preferida
                <input type="date" required min={todayISO()} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </label>
              <label>Melhor período
                <select value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value })}>
                  {periods.map((period) => (
                    <option key={period.value} value={period.value}>{period.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="booking-form-row">
              <label>Seu nome
                <input type="text" required autoComplete="name" placeholder="Como podemos te chamar?" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label>WhatsApp
                <input type="tel" required autoComplete="tel" placeholder="(11) 99999-9999" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </label>
            </div>

            <label>Observação opcional
              <textarea rows="3" placeholder="Ex: prefiro sexta à tarde, tenho alergia, quero manutenção..." value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
            </label>

            {submitStatus === 'saved' && (
              <div className="booking-form-status success">Pedido salvo no sistema. Agora envie no WhatsApp para acelerar a confirmação.</div>
            )}
            {submitStatus === 'fallback' && (
              <div className="booking-form-status warning">Não consegui registrar no sistema agora, mas você ainda pode enviar pelo WhatsApp.</div>
            )}

            <button className="booking-whatsapp-button" type="submit" disabled={submitStatus === 'saving'}>
              {submitStatus === 'saving' ? 'Preparando pedido...' : 'Enviar pedido pelo WhatsApp'}
            </button>
            <small>Nenhum pagamento é feito pelo site.</small>
          </form>
        </section>

        <section className="booking-faq-section">
          <div className="booking-section-heading">
            <span className="booking-eyebrow">Dúvidas rápidas</span>
            <h2>Antes de pedir seu horário</h2>
          </div>
          <div className="booking-faq-grid">
            {faqs.map((item) => (
              <article key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="booking-location-section">
          <div>
            <span className="booking-eyebrow">Onde estamos</span>
            <h2>Bonyta Studio · Vila Maria</h2>
            <p>O endereço completo e as orientações de chegada são enviados junto com a confirmação do horário.</p>
          </div>
          <a href="https://www.instagram.com/bonytastudio/" target="_blank" rel="noreferrer">Conhecer o Instagram</a>
        </section>
      </main>

      <a className="booking-floating-cta" href="#solicitar-horario">Agendar agora</a>

      <footer className="booking-footer">
        <span>Bonyta Studio</span>
        <span>Revelando a sua melhor versão.</span>
      </footer>
    </div>
  )
}
