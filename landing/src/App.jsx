import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { buildWhatsAppUrl } from './whatsapp'
import AiAssistantWidget from './AiAssistantWidget'
import CatalogModal from '../../src/components/CatalogModal'

const fallbackServices = [
  { id: 'fibra-aplicacao', name: 'Alongamento em Fibra de Vidro', duration_minutes: 150, price: 170, manutencao_price: 130 },
  { id: 'molde-f1-aplicacao', name: 'Alongamento Molde F1', duration_minutes: 150, price: 140, manutencao_price: 100 },
  { id: 'banho-gel', name: 'Banho de Gel', duration_minutes: 90, price: 120, manutencao_price: 90 },
  { id: 'esmalte-gel', name: 'Esmaltação em Gel', duration_minutes: 60, price: 65, manutencao_price: 50 },
  { id: 'cilios-fox', name: 'Cílios - Bonyta Fox', duration_minutes: 120, price: 180, manutencao_price: 140 },
  { id: 'cilios-brasileiro', name: 'Cílios - Volume Brasileiro', duration_minutes: 120, price: 140, manutencao_price: 110 },
  { id: 'design-sobrancelha', name: 'Sobrancelha - Design Personalizado', duration_minutes: 45, price: 40, manutencao_price: null },
  { id: 'henna', name: 'Sobrancelha - Design com Henna', duration_minutes: 60, price: 55, manutencao_price: null },
  { id: 'brow', name: 'Sobrancelha - Brow Lamination', duration_minutes: 90, price: 180, manutencao_price: 120 },
  { id: 'orientacao', name: 'Quero uma recomendação personalizada', duration_minutes: 60, price: 0, manutencao_price: null }
]

const proofCards = [
  {
    number: '01',
    title: 'Agenda Transparente em Tempo Real',
    text: 'A cliente escolhe o procedimento, visualiza a disponibilidade exata do estúdio e reserva sem desencontros.'
  },
  {
    number: '02',
    title: 'Cadastro VIP Automático',
    text: 'Seus dados como WhatsApp, aniversário e preferências ficam salvos para um atendimento cada vez mais exclusivo.'
  },
  {
    number: '03',
    title: 'Biossegurança & Pontualidade',
    text: 'Ambiente climatizado, materiais 100% esterilizados e horários respeitados rigorosamente para o seu conforto.'
  }
]

const statsData = [
  { number: '+1.500', label: 'Olhares Transformados' },
  { number: '99%', label: 'Satisfação de Clientes' },
  { number: '100%', label: 'Materiais Esterilizados' },
  { number: 'VIP', label: 'Atendimento Exclusivo' }
]

const catalogCards = [
  {
    title: 'Extensão de Cílios',
    eyebrow: 'Volume Brasileiro, Fox & Boneca',
    image: '/catalogo-cilios.webp',
    text: 'Técnicas exclusivas para realçar seu olhar com fios ultra macios, curvatura impecável e retenção prolongada.',
    tags: ['Volume Brasileiro R$ 140', 'Bonyta Fox R$ 180', 'Manutenção em dia'],
    match: 'cílios'
  },
  {
    title: 'Sobrancelhas de Luxo',
    eyebrow: 'Design Visagista, Henna & Brow Lamination',
    image: '/catalogo-sobrancelhas.webp',
    text: 'Mapeamento facial visagista respeitando a simetria natural do seu rosto para um olhar marcante e equilibrado.',
    tags: ['Design R$ 40', 'Henna R$ 55', 'Brow Lamination R$ 180'],
    match: 'sobrancelhas'
  },
  {
    title: 'Unhas Bonyta Lux',
    eyebrow: 'Fibra de Vidro, Molde F1 & Gel',
    image: '/studio-graffiti.webp',
    text: 'Do acabamento natural à resistência extrema do alongamento em fibra, com produtos de alta durabilidade e brilho intenso.',
    tags: ['Fibra R$ 170', 'Molde F1 R$ 140', 'Banho de Gel R$ 120'],
    match: 'unhas'
  }
]

const transformations = [
  {
    title: 'Volume Brasileiro Gold',
    category: 'Cílios',
    image: '/catalogo-cilios.webp',
    description: 'Preenchimento denso e leve, sem pesar nos olhos naturais.'
  },
  {
    title: 'Brow Lamination & Design',
    category: 'Sobrancelhas',
    image: '/catalogo-sobrancelhas.webp',
    description: 'Fios alinhados, encorpados e visual elegante e moderno.'
  },
  {
    title: 'Alongamento Fibra Lux',
    category: 'Unhas em Gel',
    image: '/studio-graffiti.webp',
    description: 'Resistência superior com curvatura C impecável e brilho vítreo.'
  }
]

const testimonials = [
  {
    stars: '★★★★★',
    quote: 'O atendimento no Bonyta Studio é sensacional! A extensão de cílios durou muito e ficou súper leve e natural. Não troco por nada!',
    author: 'Mariana Silva',
    service: 'Cliente de Cílios Volume Brasileiro'
  },
  {
    stars: '★★★★★',
    quote: 'Faço a fibra de vidro há meses e minhas unhas nunca estiveram tão fortes e bonitas. O ambiente é acolhedor e super higienizado.',
    author: 'Camila Alencar',
    service: 'Cliente de Alongamento Fibra'
  },
  {
    stars: '★★★★★',
    quote: 'A Brow Lamination mudou completamente o meu olhar! O agendamento pelo site é rápido demais e super prático pelo WhatsApp.',
    author: 'Beatriz Ramos',
    service: 'Cliente de Brow Lamination'
  }
]

const faqs = [
  {
    q: 'Como funciona a garantia do meu horário?',
    a: 'Seu horário entra imediatamente no app interno da Bonyta Studio como pendente. Nossa equipe confirma as informações via WhatsApp em poucos instantes.'
  },
  {
    q: 'Preciso efetuar algum pagamento antecipado no site?',
    a: 'Não! Nenhum pagamento é realizado diretamente pelo site. O pagamento ou combinação de sinal é alinhado direto no WhatsApp do estúdio.'
  },
  {
    q: 'Posso escolher qual profissional vai me atender?',
    a: 'Sim! No formulário de agendamento você pode selecionar sua profissional preferida ou marcar "Qualquer profissional disponível" para ver mais horários livres.'
  },
  {
    q: 'Qual é o tempo de durabilidade da extensão de cílios e das unhas?',
    a: 'As extensões de cílios duram em média de 15 a 25 dias até a primeira manutenção. O alongamento em fibra de vidro necessita de manutenção a cada 20 a 28 dias.'
  }
]

const protocolCards = [
  { title: 'Agendamento Prático', text: 'Sem filas de espera. Escolha o serviço e visualize a agenda em segundos.' },
  { title: 'Regra de Tolerância', text: 'Tolerância máxima de 10 minutos para garantir o tempo total do procedimento.' },
  { title: 'Manutenções em Dia', text: 'Recomendamos agendar suas manutenções com antecedência para preservar o resultado.' }
]

const serviceFilters = [
  { id: 'todos', label: 'Todos os Serviços' },
  { id: 'cilios', label: '✨ Cílios' },
  { id: 'sobrancelha', label: '👁️ Sobrancelhas' },
  { id: 'unhas', label: '💅 Unhas em Gel' },
  { id: 'depilacao', label: '🌸 Depilação' }
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
  if (!number) return 'Sob Consulta'
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
  '💖 *Agendamento Bonyta Studio*',
  '',
  `👤 *Nome:* ${form.name}`,
  `📱 *WhatsApp:* ${form.phone}`,
  form.birthDate ? `🎂 *Nascimento:* ${dateLabel(form.birthDate)}` : '',
  form.email ? `✉️ *E-mail:* ${form.email}` : '',
  `✨ *Serviço:* ${selectedService?.name || result?.service_name || 'Não informado'}`,
  selectedService?.price ? `💳 *Valor Colocação:* ${formatCurrency(selectedService.price)}` : '',
  `👩‍🎨 *Profissional:* ${selectedProfessional?.name || result?.professional_name || 'Primeira disponível'}`,
  `📅 *Data:* ${dateLabel(form.date)}`,
  `⏰ *Horário:* ${String(form.time || result?.appointment_time || '').slice(0, 5)}`,
  form.note ? `📝 *Observação:* ${form.note}` : '',
  '',
  'Olá equipe Bonyta! Fiz este agendamento pelo site. Podem confirmar meu horário?'
].filter(Boolean).join('\n')

export default function App() {
  const [services, setServices] = useState(fallbackServices)
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()))

  const [searchQuery, setSearchQuery] = useState('')
  const [openFaq, setOpenFaq] = useState(null)

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
      price: selectedService?.price ? formatCurrency(selectedService.price) : 'Sob Consulta',
    }
  }, [form.serviceId, form.date, form.time, selectedService, selectedProfessional])

  const filteredServices = useMemo(() => {
    let list = services

    if (serviceFilter !== 'todos') {
      list = list.filter((service) => {
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
    }

    if (searchQuery.trim()) {
      const q = normalize(searchQuery)
      list = list.filter((s) => normalize(s.name).includes(q))
    }

    return list
  }, [services, serviceFilter, searchQuery])

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
        setSlotsError('Envie seu horário desejado pelo WhatsApp para confirmarmos manualmente.')
        return
      }

      setSlotsLoading(true)
      const { data, error } = await supabase.rpc('public_get_available_slots', {
        p_service_id: form.serviceId,
        p_professional_id: form.professionalId === 'qualquer' ? null : form.professionalId,
        p_date: form.date
      })

      if (error) {
        setSlotsError('Não conseguimos carregar os horários agora. Escolha outro dia ou chame no WhatsApp.')
        setSlots([])
      } else {
        setSlots(data || [])
        if (!data?.length) {
          setSlotsError('Nenhum horário livre neste dia. Tente outra data ou selecione "Qualquer profissional".')
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
      setSlotsError('Por favor, aceite os termos de agendamento e autorize o contato via WhatsApp.')
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
      setSlotsError('Escolha um horário livre no calendário antes de finalizar.')
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
      setSlotsError(error.message || 'Este horário não está mais livre. Por favor escolha outro horário.')
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
      if (consentError) console.warn('Consentimento não registrado:', consentError)
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
      {/* Top Header */}
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Bonyta Studio Home">
          <span>B</span>
          <div className="brand-text">
            <strong>Bonyta Studio</strong>
            <small>Lash & Beauty</small>
          </div>
        </a>

        <nav>
          <a href="#transformacoes">Resultados</a>
          <a href="#catalogo">Catálogo</a>
          <a href="#servicos">Procedimentos</a>
          <a href="#agendar">Agendar</a>
          <a href="https://www.instagram.com/bonytastudio/" target="_blank" rel="noreferrer">Instagram</a>
        </nav>

        <div className="topbar-right">
          <div className="live-badge">
            <span className="pulse-dot"></span>
            Horários Abertos
          </div>
          <a className="topbar-cta" href="#agendar">
            ✨ Agendar Horário
          </a>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <span className="eyebrow-tag">
              📍 Vila Maria · Zona Norte · SP
            </span>
            <h1>
              Revelando a sua melhor versão com <span className="gradient-text">elegância e destaque.</span>
            </h1>
            <p className="hero-text">
              Especialistas em Extensão de Cílios, Brow Lamination e Unhas em Gel. Escolha o seu procedimento e encontre o horário perfeito em tempo real na nossa agenda VIP.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#agendar">
                📅 Ver Horários Livres
              </a>
              <a className="secondary-button" href="#catalogo">
                📖 Ver Catálogo
              </a>
            </div>
            <div className="trust-pills">
              <span>✓ Confirmação no WhatsApp</span>
              <span>✓ Profissionais Certificadas</span>
              <span>✓ Ambiente Climatizado</span>
            </div>
          </div>

          <div className="hero-visual">
            <img src="/studio-graffiti.webp" alt="Atendimento de alto padrão no Bonyta Studio em frente ao grafite rosa da casa" />
            <div className="hero-badge">
              <small>Bonyta Studio Experience</small>
              <strong>O rosa no DNA e o luxo nos detalhes.</strong>
            </div>
          </div>
        </section>

        {/* Stats Ribbon */}
        <section className="stats-ribbon" aria-label="Estatísticas da Bonyta Studio">
          {statsData.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <span className="stat-number">{stat.number}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </section>

        {/* Proof Cards / Why Choose Us */}
        <section className="proof-grid" aria-label="Diferenciais da Bonyta Studio">
          {proofCards.map((card) => (
            <article className="proof-card" key={card.title}>
              <span>{card.number}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </section>

        {/* Transformations / Before & After Section */}
        <section className="transformations-section" id="transformacoes">
          <div className="section-heading centered">
            <span className="eyebrow-tag">Transformações Bonyta</span>
            <h2>Resultados que impressionam à primeira vista.</h2>
            <p>Confira a qualidade de retenção, curvatura e naturalidade em cada procedimento realizado em nosso estúdio.</p>
          </div>

          <div className="transformations-grid">
            {transformations.map((item) => (
              <article className="transformation-card" key={item.title}>
                <div className="transformation-media">
                  <span className="transformation-badge">{item.category}</span>
                  <img src={item.image} alt={`Resultado de ${item.title}`} />
                </div>
                <div className="transformation-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <a className="secondary-button" href="#agendar" style={{ width: '100%', justifyContent: 'center' }}>
                    Quero este resultado ➔
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Interactive Catalog Section */}
        <section className="catalog-section" id="catalogo">
          <div className="section-heading">
            <span className="eyebrow-tag">Catálogo Completo</span>
            <h2>Especialidades pensadas para você.</h2>
            <p>
              Técnicas modernas desenvolvidas para realçar sua beleza natural com conforto e alta resistência.
            </p>
            <div className="catalog-header-actions">
              <button
                type="button"
                className="pdf-catalog-btn"
                onClick={() => setShowCatalogModal(true)}
              >
                📕 Abrir Catálogo Maira Stoche em PDF
              </button>
            </div>
          </div>

          <div className="catalog-grid">
            {catalogCards.map((card) => (
              <article className="catalog-card" key={card.title}>
                <div className="catalog-image">
                  <img src={card.image} alt={`Coleção de ${card.title}`} />
                </div>
                <div className="catalog-copy">
                  <p>{card.eyebrow}</p>
                  <h3>{card.title}</h3>
                  <span>{card.text}</span>
                  <div className="tag-row">
                    {card.tags.map((tag) => <em key={tag}>{tag}</em>)}
                  </div>
                  <button type="button" onClick={() => selectCatalogService(card.match)}>
                    Agendar {card.title}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Services & Filter Search Section */}
        <section className="services-section" id="servicos">
          <div className="section-heading">
            <span className="eyebrow-tag">Menu de Procedimentos</span>
            <h2>Escolha o serviço desejado</h2>
            <p>
              Filtre por categoria ou pesquise o procedimento para verificar valores de colocação, manutenção e os horários livres.
            </p>
          </div>

          <div className="filter-bar">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Pesquisar serviço (ex: Cílios Fox, Fibra, Henna)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="service-filters" aria-label="Filtrar por tipo de serviço">
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
          </div>

          {loading ? (
            <div className="empty-card">Buscando lista de procedimentos atualizada...</div>
          ) : filteredServices.length === 0 ? (
            <div className="empty-card">Nenhum procedimento encontrado para o filtro digitado.</div>
          ) : (
            <div className="service-grid">
              {filteredServices.map((service) => (
                <article
                  className={`service-card ${String(service.id) === String(form.serviceId) ? 'selected' : ''}`}
                  key={service.id}
                >
                  <div className="service-accent" />
                  <small>⏱️ {service.duration_minutes || 60} min · Experiência Bonyta</small>
                  <h3>{service.name}</h3>

                  <div className="service-meta-dual">
                    <div>
                      <span>Colocação</span>
                      <strong style={{ color: '#ffffff' }}>{formatCurrency(service.price)}</strong>
                    </div>
                    {service.manutencao_price && (
                      <div style={{ textAlign: 'right' }}>
                        <span>Manutenção</span>
                        <strong style={{ color: 'var(--pink-soft)' }}>{formatCurrency(service.manutencao_price)}</strong>
                      </div>
                    )}
                  </div>

                  <button type="button" onClick={() => selectService(service.id)}>
                    {String(service.id) === String(form.serviceId) ? '✓ SELECIONADO' : 'SELECIONAR & AGENDAR ➔'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Booking Form Section */}
        <section className="booking-section" id="agendar">
          <div className="booking-copy">
            <span className="eyebrow-tag">Agendamento Simplificado</span>
            <h2>Reserve seu horário em 3 passos simples.</h2>
            <p>
              Consulte os horários da nossa equipe e receba a confirmação instantânea no seu WhatsApp.
            </p>

            <ol>
              <li><span>1</span> Escolha o serviço e profissional.</li>
              <li><span>2</span> Clique no dia e horário desejado.</li>
              <li><span>3</span> Preencha seus dados e receba no WhatsApp.</li>
            </ol>

            <div className="protocol-list">
              {protocolCards.map((item) => (
                <div key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="booking-step">
              <span>01</span>
              <strong>Procedimento & Profissional</strong>
            </div>

            <label>Selecione o Serviço
              <select
                required
                value={form.serviceId}
                onChange={(e) => setForm({ ...form, serviceId: e.target.value, time: '' })}
              >
                <option value="">Escolha um serviço da lista</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} — {formatCurrency(service.price)}
                  </option>
                ))}
              </select>
            </label>

            <label>Profissional Preferida
              <select
                value={form.professionalId}
                onChange={(e) => setForm({ ...form, professionalId: e.target.value, time: '' })}
              >
                <option value="qualquer">Qualquer profissional disponível</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="booking-step">
              <span>02</span>
              <strong>Data do Atendimento</strong>
            </div>

            <div className="calendar-card">
              <div className="calendar-header">
                <button
                  type="button"
                  onClick={() => setCalendarMonth((current) => addMonths(current, -1))}
                  aria-label="Mês anterior"
                >‹</button>
                <strong>{monthLabel(calendarMonth)}</strong>
                <button
                  type="button"
                  onClick={() => setCalendarMonth((current) => addMonths(current, 1))}
                  aria-label="Próximo mês"
                >›</button>
              </div>

              <div className="calendar-weekdays">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
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
              <strong>Horários Disponíveis</strong>
            </div>

            <div className="slots-panel">
              {!form.serviceId && <p>Selecione um serviço acima para exibir os horários.</p>}
              {form.serviceId && !form.date && <p>Escolha uma data no calendário para ver os horários livres.</p>}
              {slotsLoading && <p>Buscando horários disponíveis na agenda...</p>}
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
              <strong>Seus Dados de Contato</strong>
            </div>

            <div className="form-row">
              <label>Nome Completo
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Seu nome completo"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>WhatsApp
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
            </div>

            <div className="form-row">
              <label>Data de Nascimento (Opcional)
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                />
              </label>
              <label>E-mail (Opcional)
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="seuemail@exemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
            </div>

            <label>Observação Opcional
              <textarea
                rows="3"
                placeholder="Ex: Primeira vez no estúdio, alergia a esmalte, prefiro manutenção..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </label>

            {bookingSummary && (
              <div className="booking-summary">
                <span>Resumo da Reserva</span>
                <strong>{bookingSummary.service}</strong>
                <p>{bookingSummary.date} às {bookingSummary.time} · {bookingSummary.professional}</p>
                <div>
                  <em>Valor Colocação: {bookingSummary.price}</em>
                </div>
              </div>
            )}

            <label className="policy-check">
              <input
                type="checkbox"
                checked={form.acceptedPolicy}
                onChange={(e) => setForm({ ...form, acceptedPolicy: e.target.checked })}
              />
              <span>Entendo que o horário será confirmado via WhatsApp pela equipe do Bonyta Studio.</span>
            </label>

            <label className="policy-check">
              <input
                type="checkbox"
                checked={form.acceptedWhatsApp}
                onChange={(e) => setForm({ ...form, acceptedWhatsApp: e.target.checked })}
              />
              <span>Autorizo a Bonyta Studio a me enviar confirmação e lembretes deste agendamento pelo WhatsApp.</span>
            </label>

            <label className="policy-check">
              <input
                type="checkbox"
                checked={form.marketingOptIn}
                onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })}
              />
              <span>Desejo receber convites VIP e novidades sobre manutenção. (Opcional)</span>
            </label>

            {submitStatus === 'saved' && (
              <div className="status success">
                ✓ Agendamento pré-registrado com sucesso! Clique abaixo para abrir o WhatsApp e confirmar com nossa equipe.
              </div>
            )}

            {submitStatus === 'fallback' && (
              <div className="status warning">
                Sua solicitação foi preparada. Abrimos o WhatsApp para concluir o agendamento direto com a equipe.
              </div>
            )}

            {lastWhatsAppUrl && (
              <a className="manual-whatsapp" href={lastWhatsAppUrl} target="_blank" rel="noreferrer">
                📲 Reabrir Confirmação no WhatsApp
              </a>
            )}

            <button className="whatsapp-button" type="submit" disabled={submitStatus === 'saving'}>
              {submitStatus === 'saving' ? 'Agendando Horário...' : 'Finalizar Agendamento 💬'}
            </button>
            <small style={{ textAlign: 'center', display: 'block' }}>
              Atendimento exclusivo Bonyta Studio · Vila Maria, São Paulo.
            </small>
          </form>
        </section>

        {/* Testimonials / Reviews Section */}
        <section className="testimonials-section">
          <div className="section-heading centered">
            <span className="eyebrow-tag">Avaliações das Clientes</span>
            <h2>Quem experimenta, ama o resultado.</h2>
            <p>Confira o depoimento de quem confia no olhar e no cuidado do Bonyta Studio.</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <article className="testimonial-card" key={t.author}>
                <div className="testimonial-stars">{t.stars}</div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{t.author[0]}</div>
                  <div className="author-info">
                    <strong>{t.author}</strong>
                    <small>{t.service}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Interactive FAQ Section */}
        <section className="faq-section">
          <div className="section-heading centered">
            <span className="eyebrow-tag">Dúvidas Frequentes</span>
            <h2>Tudo o que você precisa saber</h2>
            <p>Respostas rápidas para as principais dúvidas sobre os nossos procedimentos.</p>
          </div>

          <div className="faq-accordion">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div className={`faq-item ${isOpen ? 'open' : ''}`} key={faq.q}>
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span>{faq.q}</span>
                    <span className="faq-toggle-icon">+</span>
                  </button>
                  {isOpen && <div className="faq-answer">{faq.a}</div>}
                </div>
              )
            })}
          </div>
        </section>

        {/* Location Section */}
        <section className="location-section">
          <div className="location-info">
            <span className="eyebrow-tag">Nossa Localização</span>
            <h2>Bonyta Studio · Vila Maria, SP</h2>
            <p>Atendimento privativo com localização privilegiada na Zona Norte de São Paulo. O endereço detalhado é enviado na confirmação do seu horário.</p>
            <div className="location-address">
              📍 Vila Maria, São Paulo - SP
            </div>
          </div>
          <a
            className="location-cta"
            href="https://www.instagram.com/bonytastudio/"
            target="_blank"
            rel="noreferrer"
          >
            📸 Siga @bonytastudio no Instagram
          </a>
        </section>
      </main>

      {/* Floating Desktop CTA Button */}
      <a className="floating-cta" href="#agendar">
        ✨ Agendar Horário
      </a>

      {/* Mobile Sticky Quick-Action Bar */}
      <div className="mobile-bottom-bar">
        <a className="btn-book" href="#agendar">
          📅 Agendar Agora
        </a>
        <a
          className="btn-whatsapp"
          href={buildWhatsAppUrl(import.meta.env.VITE_WHATSAPP_NUMBER, 'Olá! Gostaria de tirar uma dúvida e agendar um horário no Bonyta Studio.')}
          target="_blank"
          rel="noreferrer"
        >
          💬 WhatsApp
        </a>
      </div>

      {/* Footer */}
      <footer>
        <div>
          <strong style={{ color: 'white', display: 'block', fontSize: '1rem' }}>Bonyta Studio</strong>
          <span>Revelando a sua melhor versão.</span>
        </div>
        <span>© {new Date().getFullYear()} Bonyta Studio. Todos os direitos reservados.</span>
      </footer>

      {/* AI Assistant & Catalog Modal */}
      <AiAssistantWidget />
      {showCatalogModal && <CatalogModal onClose={() => setShowCatalogModal(false)} />}
    </div>
  )
}
