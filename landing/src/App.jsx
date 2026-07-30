import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { buildWhatsAppUrl } from './whatsapp'

const fallbackServices = [
  { id: 'fibra-aplicacao', name: 'Alongamento em Fibra de Vidro - Aplicação', duration_minutes: 150, price: 170 },
  { id: 'fibra-manutencao', name: 'Alongamento em Fibra de Vidro - Manutenção', duration_minutes: 120, price: 130 },
  { id: 'molde-f1-aplicacao', name: 'Alongamento Molde F1 - Aplicação', duration_minutes: 150, price: 140 },
  { id: 'molde-f1-manutencao', name: 'Alongamento Molde F1 - Manutenção', duration_minutes: 120, price: 100 },
  { id: 'banho-gel', name: 'Banho de Gel', duration_minutes: 90, price: 120 },
  { id: 'esmalte-gel', name: 'Esmaltação em Gel', duration_minutes: 60, price: 65 },
  { id: 'cilios-fox', name: 'Cílios - Bonyta Fox - Aplicação', duration_minutes: 120, price: 180 },
  { id: 'cilios-brasileiro', name: 'Cílios - Volume Brasileiro - Aplicação', duration_minutes: 120, price: 140 },
  { id: 'design-sobrancelha', name: 'Sobrancelha - Design Personalizado', duration_minutes: 45, price: 40 },
  { id: 'henna', name: 'Sobrancelha - Design com Henna', duration_minutes: 60, price: 55 },
  { id: 'brow', name: 'Sobrancelha - Brow Lamination', duration_minutes: 90, price: 180 },
  { id: 'orientacao', name: 'Quero uma recomendação', duration_minutes: 60, price: 0 }
]

const proofCards = [
  {
    title: 'Agenda sem confusão',
    text: 'A cliente escolhe serviço, dia e horário usando a disponibilidade real do app.'
  },
  {
    title: 'Cliente já cadastrada',
    text: 'Nome, WhatsApp, nascimento e e-mail entram no cadastro para relacionamento depois.'
  },
  {
    title: 'Equipe avisada',
    text: 'O agendamento aparece no app interno e já nasce com status pendente para conferência.'
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
    tags: ['Fibra R$ 170', 'Molde F1 R$ 140', 'Banho R$ 120', 'Esmaltação R$ 65'],
    match: 'unhas'
  }
]

const faqs = [
  ['O horário fica garantido?', 'O horário entra na agenda da Bonyta como pendente. A equipe confirma pelo WhatsApp.'],
  ['Preciso pagar pelo site?', 'Não. Nenhum pagamento é necessário pelo site (sinal de 30% temporariamente desativado para testes).'],
  ['Posso escolher profissional?', 'Sim. Você pode escolher uma profissional ou deixar como qualquer disponível.']
]

const protocolCards = [
  ['Agendamento Simples', 'O horário é confirmado após verificação da equipe via WhatsApp.'],
  ['Pontualidade', 'Atrasos acima de 10 minutos podem cancelar o atendimento para preservar a agenda.'],
  ['Manutenção', 'Unhas normalmente têm manutenção entre 15 e 28 dias, conforme crescimento e estado.']
]

const serviceFilters = [
  { id: 'todos', label: 'Todos' },
  { id: 'unhas', label: 'Unhas' },
  { id: 'cilios', label: 'Cílios' },
  { id: 'sobrancelha', label: 'Sobrancelhas' },
  { id: 'depilacao', label: 'Depilação' }
]

const isRealUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))

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

const toISODate = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const todayISO = () => toISODate(new Date())

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)

const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1)

const monthLabel = (date) =>
  date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

const dateLabel = (iso) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR') : ''

const buildClientMessage = ({ form, selectedService, selectedProfessional, result }) => [
  'Olá! Fiz um agendamento pelo site da Bonyta Studio 💖',
  '',
  `Nome: ${form.name}`,
  `WhatsApp: ${form.phone}`,
  form.birthDate ? `Nascimento: ${dateLabel(form.birthDate)}` : '',
  form.email ? `E-mail: ${form.email}` : '',
  `Serviço: ${selectedService?.name || result?.service_name || 'Não informado'}`,
  selectedService?.price ? `Valor: ${formatCurrency(selectedService.price)}` : '',
  `Profissional: ${selectedProfessional?.name || result?.professional_name || 'Não informado'}`,
  `Data: ${dateLabel(form.date)}`,
  `Horário: ${String(form.time || result?.appointment_time || '').slice(0, 5)}`,
  form.note ? `Observação: ${form.note}` : '',
  '',
  'Pode confirmar meu horário?'
].filter(Boolean).join('\n')

export default function App() {
  const [services, setServices] = useState(fallbackServices)
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()))
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState('')
  const [submitStatus, setSubmitStatus] = useState('')
  const [bookingResult, setBookingResult] = useState(null)
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState('')
  const [serviceFilter, setServiceFilter] = useState('todos')
  const [form, setForm] = useState({
    serviceId: '',
    professionalId: 'qualquer',
    date: '',
    time: '',
    name: '',
    phone: '',
    birthDate: '',
    email: '',
    note: '',
    acceptedPolicy: false,
    acceptedWhatsApp: false,
    marketingOptIn: false
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

  const selectedProfessional = useMemo(
    () => professionals.find((professional) => String(professional.id) === String(form.professionalId)),
    [professionals, form.professionalId]
  )

  const bookingSummary = useMemo(() => {
    if (!form.serviceId) return null

    return {
      service: selectedService?.name || 'Serviço escolhido',
      professional: selectedProfessional?.name || 'Qualquer profissional disponível',
      date: form.date ? dateLabel(form.date) : 'Data a escolher',
      time: form.time ? String(form.time).slice(0, 5) : 'Horário a escolher',
      price: selectedService?.price ? formatCurrency(selectedService.price) : 'Consultar',
      deposit: selectedService?.price ? formatCurrency(Number(selectedService.price) * 0.3) : 'A combinar'
    }
  }, [form.serviceId, form.date, form.time, selectedService, selectedProfessional])

  const filteredServices = useMemo(() => {
    if (serviceFilter === 'todos') return services

    return services.filter((service) => {
      const name = normalize(service.name)
      if (serviceFilter === 'cilios') return name.includes('cilio')
      if (serviceFilter === 'sobrancelha') return name.includes('sobrancelha') || name.includes('brow') || name.includes('henna')
      if (serviceFilter === 'depilacao') return name.includes('depilacao') || name.includes('buco')
      return name.includes('unha')
        || name.includes('gel')
        || name.includes('alongamento')
        || name.includes('manutencao')
        || name.includes('fibra')
        || name.includes('molde')
        || name.includes('esmaltacao')
        || name.includes('reconstrucao')
        || name.includes('decoracao')
        || name.includes('kids')
        || name.includes('remocao')
        || name.includes('postica')
    })
  }, [services, serviceFilter])

  const calendarDays = useMemo(() => {
    const first = startOfMonth(calendarMonth)
    const gridStart = new Date(first)
    gridStart.setDate(first.getDate() - first.getDay())

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart)
      day.setDate(gridStart.getDate() + index)
      const iso = toISODate(day)
      return {
        iso,
        day: day.getDate(),
        inMonth: day.getMonth() === calendarMonth.getMonth(),
        isPast: iso < todayISO(),
        isSelected: iso === form.date
      }
    })
  }, [calendarMonth, form.date])

  useEffect(() => {
    const loadAvailableSlots = async () => {
      setSlots([])
      setSlotsError('')

      if (!form.serviceId || !form.date) return

      if (!supabase || !isRealUuid(form.serviceId)) {
        setSlotsError('Conecte o Supabase para mostrar horários reais. Por enquanto, envie pelo WhatsApp.')
        return
      }

      setSlotsLoading(true)
      const { data, error } = await supabase.rpc('public_get_available_slots', {
        p_service_id: form.serviceId,
        p_professional_id: form.professionalId === 'qualquer' ? null : form.professionalId,
        p_date: form.date
      })

      if (error) {
        setSlotsError('Não consegui carregar os horários agora. Tente outro dia ou chame no WhatsApp.')
        setSlots([])
      } else {
        setSlots(data || [])
        if (!data?.length) {
          setSlotsError('Nenhum horário livre nesse dia. Escolha outra data ou profissional.')
        }
      }
      setSlotsLoading(false)
    }

    loadAvailableSlots()
  }, [form.serviceId, form.professionalId, form.date])

  const selectService = (serviceId) => {
    setBookingResult(null)
    setSubmitStatus('')
    setLastWhatsAppUrl('')
    setForm((current) => ({ ...current, serviceId: String(serviceId), time: '' }))
    document.querySelector('#agendar')?.scrollIntoView({ behavior: 'smooth' })
  }

  const selectCatalogService = (term) => {
    const service = services.find((item) => normalize(item.name).includes(normalize(term)))
      || services.find((item) => normalize(item.name).includes('recomendacao'))
      || services[0]

    if (service) selectService(service.id)
  }

  const selectSlot = (slot) => {
    setSubmitStatus('')
    setBookingResult(null)
    setLastWhatsAppUrl('')
    setForm((current) => ({
      ...current,
      time: slot.slot_time,
      professionalId: slot.professional_id
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitStatus('saving')
    setBookingResult(null)

    const message = buildClientMessage({ form, selectedService, selectedProfessional })

    if (!form.acceptedPolicy || !form.acceptedWhatsApp) {
      setSubmitStatus('')
      setSlotsError('Confirme a regra de sinal e autorize as mensagens do agendamento antes de finalizar.')
      return
    }

    if (!supabase || !isRealUuid(form.serviceId) || !isRealUuid(form.professionalId)) {
      const whatsappUrl = buildWhatsAppUrl(import.meta.env.VITE_WHATSAPP_NUMBER, message)
      setSubmitStatus('fallback')
      setLastWhatsAppUrl(whatsappUrl)
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
      return
    }

    if (!form.time) {
      setSubmitStatus('')
      setSlotsError('Escolha um horário livre antes de finalizar.')
      return
    }

    const { data, error } = await supabase.rpc('public_create_online_booking', {
      p_service_id: form.serviceId,
      p_professional_id: form.professionalId,
      p_date: form.date,
      p_time: form.time,
      p_customer_name: form.name,
      p_customer_phone: form.phone,
      p_customer_birth_date: form.birthDate || null,
      p_customer_email: form.email || null,
      p_note: form.note || null
    })

    if (error) {
      setSubmitStatus('')
      setSlotsError(error.message || 'Esse horário não está mais disponível. Escolha outro.')
      return
    }

    const result = data?.[0]
    if (result?.appointment_id) {
      const { error: consentError } = await supabase.rpc('public_register_booking_consents', {
        p_appointment_id: result.appointment_id,
        p_customer_phone: form.phone,
        p_transactional: form.acceptedWhatsApp,
        p_marketing: form.marketingOptIn
      })
      if (consentError) console.warn('Consentimento ainda não foi registrado:', consentError)
    }
    const whatsappUrl = buildWhatsAppUrl(
      import.meta.env.VITE_WHATSAPP_NUMBER,
      buildClientMessage({ form, selectedService, selectedProfessional, result })
    )
    setBookingResult(result)
    setSubmitStatus('saved')
    setLastWhatsAppUrl(whatsappUrl)
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
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
        <a className="topbar-cta" href="#agendar">Agendar</a>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <p className="eyebrow">Vila Maria · Zona Norte · SP</p>
            <h1>Beleza com grafite, rosa e agenda real.</h1>
            <p className="hero-text">
              A cliente escolhe o serviço, vê horários livres de verdade e envia os dados.
              O agendamento entra no app da Bonyta para a equipe confirmar.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#agendar">Ver horários disponíveis</a>
              <a className="secondary-button" href="#catalogo">Ver catálogo</a>
            </div>
            <div className="trust-pills">
              <span>Horários reais</span>
              <span>Cadastro automático</span>
              <span>Confirmação pelo WhatsApp</span>
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
              Catálogo com foto, estilo, duração e chamada direta para agendar — inspirado no vídeo,
              mas com a cara real da Bonyta.
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
                  <button type="button" onClick={() => selectCatalogService(card.match)}>Agendar {card.title.toLowerCase()}</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="services-section" id="servicos">
          <div className="section-heading">
            <p className="eyebrow">Serviços conectados</p>
            <h2>Escolha o serviço antes do calendário.</h2>
            <p>
              A duração do serviço é usada para calcular horários livres. Um procedimento de 2h,
              por exemplo, só aparece se couber inteiro na agenda.
            </p>
          </div>

          {loading ? (
            <div className="empty-card">Carregando serviços...</div>
          ) : (
            <>
              <div className="service-filters" aria-label="Filtrar serviços">
                {serviceFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={serviceFilter === filter.id ? 'active' : ''}
                    onClick={() => setServiceFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="service-grid">
                {filteredServices.map((service) => (
                  <article className={`service-card ${String(service.id) === String(form.serviceId) ? 'selected' : ''}`} key={service.id}>
                    <div className="service-accent" />
                    <small>Experiência Bonyta</small>
                    <h3>{service.name}</h3>
                    <div className="service-meta">
                      <span>{service.duration_minutes || 60} min</span>
                      <strong>{formatCurrency(service.price)}</strong>
                    </div>
                    <button type="button" onClick={() => selectService(service.id)}>
                      {String(service.id) === String(form.serviceId) ? 'Selecionado' : 'Quero este'}
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="booking-section" id="agendar">
          <div className="booking-copy">
            <p className="eyebrow">Agendamento online</p>
            <h2>Serviço, data, horário e cadastro.</h2>
            <p>
              Esse é o fluxo que liga a landing ao app de agenda: a cliente escolhe,
              o banco verifica disponibilidade e o horário entra como pendente para a equipe confirmar.
            </p>
            <ol>
              <li><span>1</span> Escolha o serviço.</li>
              <li><span>2</span> Clique no dia e horário livre.</li>
              <li><span>3</span> Envie seus dados e combine o sinal.</li>
            </ol>
            <div className="protocol-list">
              {protocolCards.map(([title, text]) => (
                <div key={title}>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="booking-step">
              <span>01</span>
              <strong>Serviço e profissional</strong>
            </div>

            <label>Serviço
              <select required value={form.serviceId} onChange={(event) => setForm({ ...form, serviceId: event.target.value, time: '' })}>
                <option value="">Selecione um serviço</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name} — {formatCurrency(service.price)}</option>
                ))}
              </select>
            </label>

            <label>Profissional
              <select value={form.professionalId} onChange={(event) => setForm({ ...form, professionalId: event.target.value, time: '' })}>
                <option value="qualquer">Qualquer profissional disponível</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>{professional.name}</option>
                ))}
              </select>
            </label>

            <div className="booking-step">
              <span>02</span>
              <strong>Escolha uma data</strong>
            </div>

            <div className="calendar-card">
              <div className="calendar-header">
                <button type="button" onClick={() => setCalendarMonth((current) => addMonths(current, -1))} aria-label="Mês anterior">‹</button>
                <strong>{monthLabel(calendarMonth)}</strong>
                <button type="button" onClick={() => setCalendarMonth((current) => addMonths(current, 1))} aria-label="Próximo mês">›</button>
              </div>
              <div className="calendar-weekdays">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="calendar-grid">
                {calendarDays.map((day) => (
                  <button
                    key={day.iso}
                    type="button"
                    className={`${day.inMonth ? '' : 'muted'} ${day.isSelected ? 'selected' : ''}`}
                    disabled={day.isPast}
                    onClick={() => setForm({ ...form, date: day.iso, time: '' })}
                  >
                    {day.day}
                  </button>
                ))}
              </div>
            </div>

            <div className="booking-step">
              <span>03</span>
              <strong>Horários disponíveis</strong>
            </div>

            <div className="slots-panel">
              {!form.serviceId && <p>Escolha um serviço para liberar o calendário.</p>}
              {form.serviceId && !form.date && <p>Escolha uma data no calendário.</p>}
              {slotsLoading && <p>Buscando horários livres...</p>}
              {!slotsLoading && slotsError && <p className="slot-error">{slotsError}</p>}
              {!slotsLoading && slots.length > 0 && (
                <div className="slots-grid">
                  {slots.map((slot) => {
                    const selected = form.time === slot.slot_time && form.professionalId === slot.professional_id
                    return (
                      <button
                        type="button"
                        key={`${slot.professional_id}-${slot.slot_time}`}
                        className={selected ? 'selected' : ''}
                        onClick={() => selectSlot(slot)}
                      >
                        <strong>{String(slot.slot_label || slot.slot_time).slice(0, 5)}</strong>
                        <span>{slot.professional_name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="booking-step">
              <span>04</span>
              <strong>Seus dados</strong>
            </div>

            <div className="form-row">
              <label>Seu nome
                <input type="text" required autoComplete="name" placeholder="Como podemos te chamar?" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label>WhatsApp
                <input type="tel" required autoComplete="tel" placeholder="(11) 99999-9999" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </label>
            </div>

            <div className="form-row">
              <label>Data de nascimento
                <input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} />
              </label>
              <label>E-mail
                <input type="email" autoComplete="email" placeholder="seuemail@email.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
            </div>

            <label>Observação opcional
              <textarea rows="3" placeholder="Ex: prefiro manutenção, tenho alergia, é minha primeira vez..." value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
            </label>

            {bookingSummary && (
              <div className="booking-summary">
                <span>Resumo do pedido</span>
                <strong>{bookingSummary.service}</strong>
                <p>{bookingSummary.date} às {bookingSummary.time} · {bookingSummary.professional}</p>
                <div>
                  <em>Valor: {bookingSummary.price}</em>
                </div>
              </div>
            )}

            <label className="policy-check">
              <input
                type="checkbox"
                checked={form.acceptedPolicy}
                onChange={(event) => setForm({ ...form, acceptedPolicy: event.target.checked })}
              />
              <span>Entendo que o horário fica pendente até confirmação da equipe.</span>
            </label>

            <label className="policy-check">
              <input
                type="checkbox"
                checked={form.acceptedWhatsApp}
                onChange={(event) => setForm({ ...form, acceptedWhatsApp: event.target.checked })}
              />
              <span>Autorizo a Bonyta Studio a enviar pelo WhatsApp confirmação, lembretes e informações deste agendamento.</span>
            </label>

            <label className="policy-check">
              <input
                type="checkbox"
                checked={form.marketingOptIn}
                onChange={(event) => setForm({ ...form, marketingOptIn: event.target.checked })}
              />
              <span>Quero receber lembretes de manutenção, novidades e oportunidades da Bonyta. Opcional.</span>
            </label>

            {submitStatus === 'saved' && (
              <div className="status success">
                Agendamento enviado para a Bonyta. Abra o WhatsApp para confirmar com a equipe.
                {bookingResult?.appointment_time ? ` Horário: ${String(bookingResult.appointment_time).slice(0, 5)}.` : ''}
              </div>
            )}
            {submitStatus === 'fallback' && <div className="status warning">Ainda sem conexão completa com a agenda. Abrimos o WhatsApp com sua mensagem pronta.</div>}

            {lastWhatsAppUrl && (
              <a className="manual-whatsapp" href={lastWhatsAppUrl} target="_blank" rel="noreferrer">
                Abrir WhatsApp novamente
              </a>
            )}

            <button className="whatsapp-button" type="submit" disabled={submitStatus === 'saving'}>
              {submitStatus === 'saving' ? 'Salvando agendamento...' : 'Finalizar agendamento'}
            </button>
            <small>O horário entra como pendente até a equipe confirmar pelo WhatsApp.</small>
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
