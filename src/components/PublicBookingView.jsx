import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import './public-booking.css'

const periods = [
  { value: 'manha', label: 'Manhã (08h–12h)' },
  { value: 'tarde', label: 'Tarde (12h–18h)' },
  { value: 'noite', label: 'Noite (18h–21h)' }
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
  const [form, setForm] = useState({
    serviceId: '', professionalId: 'qualquer', date: '',
    period: 'tarde', name: '', phone: ''
  })

  useEffect(() => {
    let active = true

    const loadCatalog = async () => {
      const [servicesResult, professionalsResult] = await Promise.all([
        supabase.from('services').select('id,name,duration_minutes,price').order('name'),
        supabase.from('professionals').select('id,name').eq('active', true).order('name')
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
    () => services.find(service => String(service.id) === String(form.serviceId)),
    [form.serviceId, services]
  )

  const selectService = (serviceId) => {
    setForm(current => ({ ...current, serviceId: String(serviceId) }))
    document.querySelector('#solicitar-horario')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const professional = professionals.find(item => String(item.id) === String(form.professionalId))
    const date = form.date
      ? new Date(`${form.date}T12:00:00`).toLocaleDateString('pt-BR')
      : 'a combinar'
    const period = periods.find(item => item.value === form.period)?.label || 'a combinar'
    const message = [
      'Olá! Vim pelo site do Bonyta Studio e gostaria de solicitar um horário 💖', '',
      `Nome: ${form.name}`,
      `Serviço: ${selectedService?.name || 'Quero orientação'}`,
      `Profissional: ${professional?.name || 'Qualquer profissional disponível'}`,
      `Data preferida: ${date}`,
      `Período: ${period}`,
      `Telefone: ${form.phone}`, '',
      'Pode me confirmar quais horários estão disponíveis?'
    ].join('\n')
    const number = String(import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')
    const destination = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(destination, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="booking-site">
      <header className="booking-header">
        <a className="booking-brand" href="#inicio" aria-label="Bonyta Studio — início">
          <span className="booking-brand-mark">B</span><span>Bonyta Studio</span>
        </a>
        <a className="booking-header-cta" href="#solicitar-horario">Agendar</a>
      </header>

      <main>
        <section className="booking-hero" id="inicio">
          <div className="booking-hero-copy">
            <span className="booking-eyebrow">Vila Maria • Zona Norte • SP</span>
            <h1>Sua melhor versão começa com um momento só seu.</h1>
            <p>Unhas, cílios e sobrancelhas com atendimento cuidadoso, resultado marcante e a personalidade Bonyta.</p>
            <div className="booking-hero-actions">
              <a className="booking-primary-button" href="#servicos">Ver serviços</a>
              <a className="booking-secondary-button" href="#solicitar-horario">Solicitar horário</a>
            </div>
            <div className="booking-trust-row" aria-label="Diferenciais do estúdio">
              <span>Atendimento personalizado</span><span>Profissionais especialistas</span><span>Confirmação pelo WhatsApp</span>
            </div>
          </div>
          <div className="booking-hero-art" aria-hidden="true">
            <span className="hero-orbit hero-orbit-one" /><span className="hero-orbit hero-orbit-two" />
            <div className="hero-monogram">Bonyta</div><div className="hero-note">Beleza com identidade</div>
          </div>
        </section>

        <section className="booking-section" id="servicos">
          <div className="booking-section-heading">
            <span className="booking-eyebrow">Nosso catálogo</span>
            <h2>Escolha como você quer se sentir ainda mais bonyta.</h2>
            <p>Valores, duração e opções são atualizados pelo próprio estúdio.</p>
          </div>
          {loading ? <div className="booking-loading">Carregando serviços...</div> : services.length > 0 ? (
            <div className="service-card-grid">
              {services.map(service => (
                <article className="public-service-card" key={service.id}>
                  <div className="service-card-accent" /><span className="service-card-kicker">Experiência Bonyta</span>
                  <h3>{service.name}</h3>
                  <div className="service-card-meta"><span>{service.duration_minutes || 60} min</span><strong>{formatCurrency(service.price)}</strong></div>
                  <button type="button" onClick={() => selectService(service.id)}>Quero este</button>
                </article>
              ))}
            </div>
          ) : <div className="booking-empty">O catálogo está sendo atualizado. Você ainda pode pedir uma recomendação pelo WhatsApp.</div>}
        </section>

        <section className="booking-request-section" id="solicitar-horario">
          <div className="booking-request-copy">
            <span className="booking-eyebrow">Agendamento sem complicação</span>
            <h2>Conte sua preferência. A gente confirma o melhor horário.</h2>
            <p>Por enquanto, a confirmação é feita pessoalmente pela equipe no WhatsApp. Assim evitamos horário duplicado e você não precisa criar conta.</p>
            <ol>
              <li><span>1</span> Escolha serviço, profissional e data.</li>
              <li><span>2</span> Envie o pedido pronto pelo WhatsApp.</li>
              <li><span>3</span> Receba a confirmação do estúdio.</li>
            </ol>
          </div>

          <form className="booking-request-form" onSubmit={handleSubmit}>
            <label>Serviço
              <select required value={form.serviceId} onChange={event => setForm({ ...form, serviceId: event.target.value })}>
                <option value="">Selecione um serviço</option>
                {services.map(service => <option key={service.id} value={service.id}>{service.name} — {formatCurrency(service.price)}</option>)}
              </select>
            </label>
            <label>Profissional
              <select value={form.professionalId} onChange={event => setForm({ ...form, professionalId: event.target.value })}>
                <option value="qualquer">Qualquer profissional disponível</option>
                {professionals.map(professional => <option key={professional.id} value={professional.id}>{professional.name}</option>)}
              </select>
            </label>
            <div className="booking-form-row">
              <label>Data preferida
                <input type="date" required min={todayISO()} value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} />
              </label>
              <label>Melhor período
                <select value={form.period} onChange={event => setForm({ ...form, period: event.target.value })}>
                  {periods.map(period => <option key={period.value} value={period.value}>{period.label}</option>)}
                </select>
              </label>
            </div>
            <div className="booking-form-row">
              <label>Seu nome
                <input type="text" required autoComplete="name" placeholder="Como podemos te chamar?" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
              </label>
              <label>WhatsApp
                <input type="tel" required autoComplete="tel" placeholder="(11) 99999-9999" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} />
              </label>
            </div>
            <button className="booking-whatsapp-button" type="submit">Enviar pedido pelo WhatsApp</button>
            <small>Nenhum pagamento é feito pelo site.</small>
          </form>
        </section>

        <section className="booking-location-section">
          <div><span className="booking-eyebrow">Onde estamos</span><h2>Bonyta Studio • Vila Maria</h2><p>O endereço completo e as orientações de chegada são enviados junto com a confirmação.</p></div>
          <a href="https://www.instagram.com/bonytastudio/" target="_blank" rel="noreferrer">Conhecer o Instagram</a>
        </section>
      </main>
      <footer className="booking-footer"><span>Bonyta Studio</span><span>Revelando a sua melhor versão.</span></footer>
    </div>
  )
}
