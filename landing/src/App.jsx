import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { buildWhatsAppUrl } from './whatsapp'

const fallbackServices = [
  { id: 'bonyta-lux', name: 'Bonyta Lux', duration_minutes: 150, price: 80 },
  { id: 'manutencao-unhas', name: 'Manutenção de unhas', duration_minutes: 120, price: 0 },
  { id: 'banho-gel', name: 'Banho de Gel', duration_minutes: 120, price: 0 },
  { id: 'alongamento', name: 'Alongamento', duration_minutes: 150, price: 0 },
  { id: 'cilios', name: 'Cílios', duration_minutes: 120, price: 0 },
  { id: 'sobrancelhas', name: 'Sobrancelhas', duration_minutes: 60, price: 0 },
  { id: 'orientacao', name: 'Quero uma recomendação', duration_minutes: 60, price: 0 }
]

const periods = [
  { value: 'manha', label: 'Manhã (08h–12h)' },
  { value: 'tarde', label: 'Tarde (12h–18h)' },
  { value: 'noite', label: 'Noite (18h–21h)' }
]

const proofCards = [
  {
    title: 'Agenda sem confusão',
    text: 'Você escolhe o serviço, informa sua preferência e a equipe confirma pelo WhatsApp antes de marcar.'
  },
  {
    title: 'Catálogo no mesmo lugar',
    text: 'Unhas, cílios e sobrancelhas aparecem com a identidade visual real da Bonyta, sem cara de sistema genérico.'
  },
  {
    title: 'Atendimento com contexto',
    text: 'Seu pedido pode chegar no app interno e no WhatsApp com serviço, data, profissional e observações.'
  }
]

const catalogCards = [
  {
    title: 'Cílios',
    eyebrow: 'Volume, boneca e fox',
    image: '/catalogo-cilios.webp',
    text: 'Modelos de extensão para um olhar mais marcante, delicado ou dramático.',
    tags: ['Volume brasileiro', 'Fox', 'Boneca', 'Manutenção'],
    match: 'cílios'
  },
  {
    title: 'Sobrancelhas',
    eyebrow: 'Design, henna e brow',
    image: '/catalogo-sobrancelhas.webp',
    text: 'Design personalizado para equilibrar o olhar respeitando a simetria natural do rosto.',
    tags: ['Design R$ 40', 'Henna R$ 55', 'Brow R$ 180', 'Depilação'],
    match: 'sobrancelhas'
  },
  {
    title: 'Unhas',
    eyebrow: 'Gel, manutenção e arte',
    image: '/studio-graffiti.webp',
    text: 'Do básico bem feito ao visual Bonyta Lux, com agenda pensada para encaixar manutenção e novos alongamentos.',
    tags: ['Bonyta Lux', 'Banho de Gel', 'Manutenção', 'Nail art'],
    match: 'unhas'
  }
]

const faqs = [
  ['O horário fica confirmado automaticamente?', 'Ainda não. A equipe confirma pelo WhatsApp para evitar choque de agenda.'],
  ['Preciso pagar pelo site?', 'Não. A landing só facilita o pedido de horário; pagamento continua combinado com o estúdio.'],
  ['Posso escolher profissional?', 'Sim. Você pode selecionar uma profissional ou deixar como “qualquer disponível”.']
]

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const formatCurrency = (value) => {
  const number = Number(value || 0)
  if (!number) return 'Consultar'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number)
}

const todayISO = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10)
}

export default function App() {
  const [services, setServices] = useState(fallbackServices)
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(Boolean(supabase))
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
    if (!supabase) return

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

      if (!servicesResult.error && servicesResult.data?.length) {
        setServices(servicesResult.data)
      }
      if (!professionalsResult.error) {
        setProfessionals(professionalsResult.data || [])
      }
      setLoading(false)
    }

    loadCatalog()
    return () => { active = false }
  }, [])

  const selectedService = useMemo(
    () => services.find((service) => String(service.id) === String(form.serviceId)),
    [services, form.serviceId]
  )

  const selectService = (serviceId) => {
    setForm((current) => ({ ...current, serviceId: String(serviceId) }))
    document.querySelector('#agendar')?.scrollIntoView({ behavior: 'smooth' })
  }

  const selectCatalogService = (term) => {
    const service = services.find((item) => normalize(item.name).includes(normalize(term)))
      || services.find((item) => normalize(item.name).includes('recomendacao'))
      || services[0]

    if (service) selectService(service.id)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitStatus('saving')

    const professional = professionals.find((item) => String(item.id) === String(form.professionalId))
    const dateLabel = form.date
      ? new Date(`${form.date}T12:00:00`).toLocaleDateString('pt-BR')
      : 'a combinar'
    const periodLabel = periods.find((item) => item.value === form.period)?.label || 'a combinar'

    const message = [
      'Olá! Vim pelo site da Bonyta Studio e gostaria de solicitar um horário 💖',
      '',
      `Nome: ${form.name}`,
      `Serviço: ${selectedService?.name || 'Quero orientação'}`,
      `Profissional: ${professional?.name || 'Qualquer profissional disponível'}`,
      `Data preferida: ${dateLabel}`,
      `Período: ${periodLabel}`,
      `Telefone: ${form.phone}`,
      form.note ? `Observação: ${form.note}` : '',
      '',
      'Pode me confirmar quais horários estão disponíveis?'
    ].filter(Boolean).join('\n')

    if (supabase) {
      const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const { error } = await supabase
        .from('booking_requests')
        .insert({
          customer_name: form.name,
          customer_phone: form.phone,
          service_id: isRealUuid.test(form.serviceId) ? form.serviceId : null,
          professional_id: form.professionalId === 'qualquer' || !isRealUuid.test(form.professionalId) ? null : form.professionalId,
          preferred_date: form.date,
          preferred_period: form.period,
          note: form.note || null,
          status: 'new'
        })

      setSubmitStatus(error ? 'fallback' : 'saved')
    } else {
      setSubmitStatus('fallback')
    }

    window.open(buildWhatsAppUrl(import.meta.env.VITE_WHATSAPP_NUMBER, message), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Bonyta Studio">
          <span>B</span>
          <strong>Bonyta Studio</strong>
        </a>
        <nav>
          <a href="#catalogo">Catálogo</a>
          <a href="#servicos">Serviços</a>
          <a href="#agendar">Agendar</a>
          <a href="https://www.instagram.com/bonytastudio/" target="_blank" rel="noreferrer">Instagram</a>
        </nav>
        <a className="topbar-cta" href="#agendar">Pedir horário</a>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <p className="eyebrow">Vila Maria · Zona Norte · SP</p>
            <h1>Beleza com grafite, rosa e presença.</h1>
            <p className="hero-text">
              A Bonyta é um estúdio de unhas, cílios e sobrancelhas com identidade própria:
              delicado no cuidado, marcante no visual e agora com uma landing conectada ao agendamento.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#agendar">Agendar pelo WhatsApp</a>
              <a className="secondary-button" href="#catalogo">Ver catálogo</a>
            </div>
            <div className="trust-pills">
              <span>Confirmação humana</span>
              <span>Sem pagamento pelo site</span>
              <span>Pedido salvo para a equipe</span>
            </div>
          </div>

          <div className="hero-visual">
            <img src="/studio-graffiti.webp" alt="Profissional da Bonyta Studio atendendo cliente em frente ao grafite rosa do estúdio" />
            <div className="hero-badge">
              <small>Grafite Bonyta</small>
              <strong>rosa no DNA, preto no novo visual</strong>
            </div>
          </div>
        </section>

        <section className="proof-grid" aria-label="Destaques da Bonyta">
          {proofCards.map((card, index) => (
            <article key={card.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
            </article>
          ))}
        </section>

        <section className="catalog-section" id="catalogo">
          <div className="section-heading">
            <p className="eyebrow">Catálogo Bonyta</p>
            <h2>O visual do estúdio dentro da página.</h2>
            <p>
              Usei o grafite da parede, o rosa dos catálogos e uma base preta para deixar a landing
              com cara de Bonyta, não de template comprado.
            </p>
          </div>

          <div className="catalog-grid">
            {catalogCards.map((card) => (
              <article className="catalog-card" key={card.title}>
                <div className="catalog-image">
                  <img src={card.image} alt={`Catálogo de ${card.title} da Bonyta Studio`} />
                </div>
                <div className="catalog-copy">
                  <p>{card.eyebrow}</p>
                  <h3>{card.title}</h3>
                  <span>{card.text}</span>
                  <div className="tag-row">
                    {card.tags.map((tag) => <em key={tag}>{tag}</em>)}
                  </div>
                  <button type="button" onClick={() => selectCatalogService(card.match)}>Quero {card.title.toLowerCase()}</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="services-section" id="servicos">
          <div className="section-heading">
            <p className="eyebrow">Serviços conectados</p>
            <h2>O catálogo pode puxar direto do app interno.</h2>
            <p>
              Quando o Supabase estiver configurado na Vercel, os serviços ativos cadastrados no app
              aparecem aqui automaticamente. Se faltar conexão, a página continua abrindo WhatsApp.
            </p>
          </div>

          {loading ? (
            <div className="empty-card">Carregando serviços...</div>
          ) : (
            <div className="service-grid">
              {services.map((service) => (
                <article className="service-card" key={service.id}>
                  <div className="service-accent" />
                  <small>Experiência Bonyta</small>
                  <h3>{service.name}</h3>
                  <div className="service-meta">
                    <span>{service.duration_minutes || 60} min</span>
                    <strong>{formatCurrency(service.price)}</strong>
                  </div>
                  <button type="button" onClick={() => selectService(service.id)}>Quero este</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="booking-section" id="agendar">
          <div className="booking-copy">
            <p className="eyebrow">Pré-agendamento</p>
            <h2>Você pede. A Bonyta confirma sem bagunçar a agenda.</h2>
            <p>
              A cliente envia a preferência pela landing, o pedido pode cair no app da Bonyta
              e o WhatsApp já abre com a mensagem montada.
            </p>
            <ol>
              <li><span>1</span> Escolha serviço, profissional e data.</li>
              <li><span>2</span> Envie o pedido pronto no WhatsApp.</li>
              <li><span>3</span> A equipe confirma o melhor horário.</li>
            </ol>
          </div>

          <form className="booking-form" onSubmit={handleSubmit}>
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

            <div className="form-row">
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

            <div className="form-row">
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

            {submitStatus === 'saved' && <div className="status success">Pedido salvo. Agora envie no WhatsApp para acelerar a confirmação.</div>}
            {submitStatus === 'fallback' && <div className="status warning">Mesmo sem salvar no sistema agora, seu WhatsApp será aberto com a mensagem pronta.</div>}

            <button className="whatsapp-button" type="submit" disabled={submitStatus === 'saving'}>
              {submitStatus === 'saving' ? 'Preparando pedido...' : 'Enviar pedido pelo WhatsApp'}
            </button>
            <small>Nenhum pagamento é feito pelo site.</small>
          </form>
        </section>

        <section className="faq-section">
          <div className="section-heading">
            <p className="eyebrow">Dúvidas rápidas</p>
            <h2>Antes de pedir seu horário</h2>
          </div>
          <div className="faq-grid">
            {faqs.map(([question, answer]) => (
              <article key={question}>
                <h3>{question}</h3>
                <p>{answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="location-section">
          <div>
            <p className="eyebrow">Onde estamos</p>
            <h2>Bonyta Studio · Vila Maria</h2>
            <p>O endereço completo e as orientações de chegada são enviados junto com a confirmação.</p>
          </div>
          <a href="https://www.instagram.com/bonytastudio/" target="_blank" rel="noreferrer">Ver Instagram</a>
        </section>
      </main>

      <a className="floating-cta" href="#agendar">Agendar agora</a>

      <footer>
        <span>Bonyta Studio</span>
        <span>Revelando a sua melhor versão.</span>
      </footer>
    </div>
  )
}
