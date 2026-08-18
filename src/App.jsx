import React, { useState, useEffect, useMemo } from 'react';
import { useAppointments } from './hooks/useAppointments'
import { useClients } from './hooks/useClients'
import { useProducts } from './hooks/useProducts'
import { useBookingRequests } from './hooks/useBookingRequests'
import { useServices } from './hooks/useServices'
import { useWaitlist } from './hooks/useWaitlist'
import { useWorkingHours } from './hooks/useWorkingHours'
import { useCurrentUserRole } from './hooks/useCurrentUserRole'
import { useUserProfiles } from './hooks/useUserProfiles'
import { useMessageLogs } from './hooks/useMessageLogs'
import { formatDateToISO } from './utils'
import { onlyDigits } from './utils/whatsapp'
import { buildCommunicationTasks } from './utils/communicationTasks'
import Header from './components/Header'
import WeekDaysStrip from './components/WeekDaysStrip'
import DayView from './components/DayView'
import WeekView from './components/WeekView'
import MonthView from './components/MonthView'
import BottomNav from './components/BottomNav'
import AppointmentModal from './components/AppointmentModal'
import ServicesView from './components/ServicesView'
import ClientsView from './components/ClientsView'
import BookingRequestsModal from './components/BookingRequestsModal'
import DailyCenterModal from './components/DailyCenterModal'
import CommunicationCenterModal from './components/CommunicationCenterModal'
import AccessControlModal from './components/AccessControlModal'
import WaitlistModal from './components/WaitlistModal'
import WorkingHoursModal from './components/WorkingHoursModal'
import BlockModal from './components/BlockModal'
import DashboardView from './components/DashboardView'
import ProfessionalModal from './components/ProfessionalModal';
import PublicBookingView from './components/PublicBookingView';
import AuthGate from './components/AuthGate';

export default function App() {
  const isPublicBooking = window.location.pathname.startsWith('/agendar')

  useEffect(() => {
    document.title = isPublicBooking
      ? 'Bonyta Studio | Agende seu horário'
      : 'Bonyta Studio - Agenda'
  }, [isPublicBooking])

  if (isPublicBooking) return <PublicBookingView />
  return <AuthGate><StudioApp /></AuthGate>
}

function StudioApp() {
  const [editingBlock, setEditingBlock] = useState(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false); // <-- NOVO ESTADO
  const [modalMode, setModalMode] = useState('appointment'); // 'appointment' | 'block'
  const [theme, setTheme] = useState('dark')
  const [view, setView] = useState('dia')
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [bookingRequestsModalOpen, setBookingRequestsModalOpen] = useState(false);
  const [dailyCenterModalOpen, setDailyCenterModalOpen] = useState(false);
  const [communicationCenterOpen, setCommunicationCenterOpen] = useState(false);
  const [workingHoursModalOpen, setWorkingHoursModalOpen] = useState(false);
  const [accessControlModalOpen, setAccessControlModalOpen] = useState(false);
  const [profFilter, setProfFilter] = useState('todos')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [prefill, setPrefill] = useState(null)
  const [activeTab, setActiveTab] = useState('agenda')// Pode ser 'agenda', 'comandas', 'clientes', 'servicos'
  const [profModalOpen, setProfModalOpen] = useState(false);
  // ====================================================================
  // COLE ESTAS LINHAS AQUI NO TOPO, JUNTO COM SEUS OUTROS USESTATES!
  // Isso vai dar vida aos seletores de Clientes e Serviços até ligarmos o banco.
  // ====================================================================
  const { clients, createClient, updateClient } = useClients()
  const { services } = useServices()
  const { products } = useProducts()
  const {
    waitlist,
    loading: waitlistLoading,
    error: waitlistError,
    addWaitlistEntry,
    removeWaitlistEntry
  } = useWaitlist()
  const {
    requests: bookingRequests,
    loading: bookingRequestsLoading,
    error: bookingRequestsError,
    updateRequestStatus
  } = useBookingRequests()
  // ====================================================================
  

  // MÁGICA UI/UX: Sempre que voltar para a aba da Agenda, força o retorno para o Dia de Hoje
  useEffect(() => {
    if (activeTab === 'agenda' && !prefill?.date) {
      setSelectedDate(new Date()); // Reseta a data para o dia atual real
      setView('dia');             // Garante que abre na visão diária padronizada
    }
  }, [activeTab, prefill?.date]);

  const {
    professionals, appointments, loading, error,
    createAppointment, createManyAppointments, updateAppointment, deleteAppointment, createProfessional, updateProfessional
  } = useAppointments()
  const access = useCurrentUserRole()
  const {
    logs: messageLogs,
    error: messageLogsError,
    logMessage
  } = useMessageLogs(!access.loading)
  const {
    profiles: userProfiles,
    loading: userProfilesLoading,
    error: userProfilesError,
    saveProfile: saveUserProfile
  } = useUserProfiles(access.canManageTeam)
  const {
    workingHours,
    loading: workingHoursLoading,
    error: workingHoursError,
    updateWorkingHour,
    saveProfessionalSchedule
  } = useWorkingHours(professionals)

  const allowedTabs = access.isProfessional
    ? ['agenda', 'financeiro']
    : access.isOwner
      ? ['agenda', 'clientes', 'servicos', 'financeiro']
      : []
  const scopedProfessionals = access.isProfessional
    ? (access.professionalId ? professionals.filter((professional) => professional.id === access.professionalId) : [])
    : access.isOwner ? professionals : []
  const scopedAppointments = access.isProfessional
    ? (access.professionalId ? appointments.filter((appointment) => appointment.professional_id === access.professionalId) : [])
    : access.isOwner ? appointments : []
  const communicationTasks = useMemo(() => buildCommunicationTasks({
    appointments: scopedAppointments,
    clients,
    professionals: scopedProfessionals,
    messageLogs
  }), [clients, messageLogs, scopedAppointments, scopedProfessionals])

  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab('agenda')
    }
  }, [activeTab, allowedTabs])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

 const navigateDate = (dir) => {
    setSelectedDate(prev => {
      const nd = new Date(prev);
      if (view === 'mes') {
        nd.setMonth(nd.getMonth() + dir); // Pula 1 mês exato
      } else if (view === 'semana') {
        nd.setDate(nd.getDate() + (dir * 7)); // Pula 7 dias exatos
      } else {
        nd.setDate(nd.getDate() + dir); // Pula 1 dia
      }
      return nd;
    });
  };

  const openNewModal = (prefillData = null) => {
    setEditingAppointment(null)
    setPrefill(prefillData)
    setModalOpen(true)
  }

const openEditModal = (appointment) => {
    setEditingAppointment(appointment);
    
    // ROTEADOR DE INTENÇÃO DE INTERFACE
    if (appointment.is_block) {
      setEditingBlock(appointment); // Seta o bloco para o Modal de Bloqueio
      setBlockModalOpen(true);       // Abre o Modal de Bloqueio dedicado
    } else {
      setModalMode('appointment');
      setModalOpen(true);            // Abre o Modal de Cliente padrão
    }
  };

  const closeModal = () => {
    setModalOpen(false)
    setEditingAppointment(null)
    setPrefill(null)
  }

const handleSubmit = async (appointmentData) => {
    try {
      // Prepara os dados exatos unificando o Serviço Base + Itens Extras da Comanda
      const payload = {
        client_id: appointmentData.client_id,
        service_id: appointmentData.service_id,
        professional_id: appointmentData.professional_id,
        date: appointmentData.date,
        time: appointmentData.time,
        duration_minutes: Number(appointmentData.duration_minutes),
        observation: appointmentData.observation || '',
        status: appointmentData.status || 'pendente',
        is_block: appointmentData.is_block || false,
        client_name: appointmentData.client_name,
        service: appointmentData.service,
        
        // Armazena os valores financeiros totais (Serviço + Produtos da Comanda)
        total_price: Number(appointmentData.total_price || 0),
        total_cost: Number(appointmentData.total_cost || 0),
        amount_paid: Number(appointmentData.amount_paid || 0),
        payment_method: appointmentData.payment_method || 'nao_informado',
        payment_status: appointmentData.payment_status || 'aberto',
        
        // Salva a lista de produtos extras como um texto (JSON) para o banco guardar tudo em uma linha só
        comanda_json: appointmentData.comanda ? JSON.stringify(appointmentData.comanda) : null
      };

      const recordId = appointmentData.id || editingAppointment?.id

      if (recordId) {
        await updateAppointment(recordId, payload)
      } else if (appointmentData.recurringDates && appointmentData.recurringDates.length > 0) {
        const allPayloads = [
          payload,
          ...appointmentData.recurringDates.map((recDate) => ({
            ...payload,
            date: recDate
          }))
        ]
        await createManyAppointments(allPayloads)
      } else {
        await createAppointment(payload)
      }

      if (!recordId && appointmentData.booking_request_id) {
        await updateRequestStatus(appointmentData.booking_request_id, 'scheduled')
      }

    } catch (err) {
      console.error('Erro ao salvar no Supabase:', err)
      throw err
    }
  };

  // Certifique-se de limpar os estados de edição ao fechar os modais
  const defaultTimeByPeriod = (period) => {
    if (period === 'manha') return '09:00'
    if (period === 'noite') return '18:00'
    return '14:00'
  }

  const openAppointmentFromBookingRequest = async (request) => {
    const requestPhone = onlyDigits(request.customer_phone)
    const existingClient = clients.find((client) => (
      requestPhone && onlyDigits(client.phone) === requestPhone
    )) || clients.find((client) => (
      String(client.name || '').trim().toLowerCase() === String(request.customer_name || '').trim().toLowerCase()
    ))

    const clientPayload = {
      name: request.customer_name,
      phone: request.customer_phone,
      birth_date: request.customer_birth_date || existingClient?.birth_date || null,
      email: request.customer_email || existingClient?.email || '',
      observation: request.note
        ? `Cliente captada pela pagina publica /agendar. Obs: ${request.note}`
        : 'Cliente captada pela pagina publica /agendar.'
    }

    const client = existingClient || await createClient(clientPayload)

    if (existingClient) {
      await updateClient(existingClient.id, clientPayload)
    }

    const selectedService = services.find((service) => String(service.id) === String(request.service_id))
    const nextDate = new Date(`${request.preferred_date}T12:00:00`)

    setSelectedDate(nextDate)
    setView('dia')
    setActiveTab('agenda')
    setBookingRequestsModalOpen(false)
    setEditingAppointment(null)
    setPrefill({
      booking_request_id: request.id,
      client_id: client.id,
      service_id: request.service_id || '',
      professional_id: request.professional_id || professionals[0]?.id || '',
      date: request.preferred_date,
      time: request.selected_time ? String(request.selected_time).slice(0, 5) : defaultTimeByPeriod(request.preferred_period),
      duration_minutes: selectedService?.duration_minutes || 60,
      observation: request.note ? `Pedido do site: ${request.note}` : 'Pedido vindo pelo site /agendar.'
    })
    setModalOpen(true)
  }

  const handleCloseBlockModal = () => {
    setBlockModalOpen(false);
    setEditingBlock(null);
    setEditingAppointment(null);
  };

  const handleDelete = async () => {
    if (editingAppointment) {
      await deleteAppointment(editingAppointment.id)
      closeModal()
    }
  }

  // Lógica de UX: Força a seleção de um profissional se mudar para Semana/Mês
  useEffect(() => {
    if (access.isProfessional && access.professionalId) {
      setProfFilter(access.professionalId)
      return
    }
    if (view !== 'dia' && profFilter === 'todos' && professionals.length > 0) {
      setProfFilter(professionals[0].id);
    }
  }, [view, profFilter, professionals, access.isProfessional, access.professionalId]);

  const actionGroups = [
    {
      title: 'Agenda',
      items: [
        {
          label: 'Novo agendamento',
          description: 'Criar atendimento na agenda',
          icon: 'fa-calendar-check',
          color: '#10b981',
          onClick: () => {
            setModalMode('appointment')
            openNewModal(access.isProfessional && access.professionalId ? { professional_id: access.professionalId } : null)
          }
        },
        access.canManageBusiness && {
          label: 'Bloqueio / compromisso',
          description: 'Folga, almoço, curso ou evento',
          icon: 'fa-lock',
          color: '#7c4dff',
          onClick: () => setBlockModalOpen(true)
        },
        access.canManageBusiness && {
          label: 'Lista de espera',
          description: 'Clientes aguardando encaixe',
          icon: 'fa-clipboard-list',
          color: '#3b82f6',
          onClick: () => setWaitlistModalOpen(true)
        }
      ].filter(Boolean)
    },
    {
      title: 'Operação',
      items: [
        {
          label: 'Central de mensagens',
          description: 'Confirmações, manutenção e clientes sumidas',
          icon: 'fa-comments',
          color: '#25D366',
          badge: communicationTasks.length,
          onClick: () => setCommunicationCenterOpen(true)
        },
        {
          label: 'Central do dia',
          description: 'Confirmar, lembrar e lançar sinal',
          icon: 'fa-bell',
          color: '#06b6d4',
          onClick: () => setDailyCenterModalOpen(true)
        },
        access.canSeeSiteRequests && {
          label: 'Agenda do site',
          description: 'Pedidos vindos da landing',
          icon: 'fa-inbox',
          color: 'var(--primary-color, #e91e63)',
          badge: bookingRequests.length,
          onClick: () => setBookingRequestsModalOpen(true)
        }
      ].filter(Boolean)
    },
    {
      title: 'Gestão',
      items: [
        access.canManageTeam && {
          label: 'Nova profissional',
          description: 'Cadastrar alguém da equipe',
          icon: 'fa-user-plus',
          color: '#f59e0b',
          onClick: () => setProfModalOpen(true)
        },
        access.canManageTeam && {
          label: 'Acessos do app',
          description: 'Vincular login e permissões',
          icon: 'fa-user-shield',
          color: '#4f46e5',
          onClick: () => setAccessControlModalOpen(true)
        },
        access.canManageTeamSchedule && {
          label: 'Expediente da equipe',
          description: 'Horários usados pela landing',
          icon: 'fa-clock',
          color: '#111827',
          onClick: () => setWorkingHoursModalOpen(true)
        }
      ].filter(Boolean)
    }
  ].filter((group) => group.items.length > 0)

  const handleActionClick = (action) => {
    action.onClick()
    setIsFabOpen(false)
  }

  if (access.loading) {
    return (
      <div className="app-container" style={{ display: 'grid', placeItems: 'center', padding: '24px' }}>
        <div style={{ color: '#fff', fontWeight: 800 }}>Carregando seu acesso...</div>
      </div>
    )
  }

  if (!access.isActive) {
    return (
      <div className="app-container" style={{ display: 'grid', placeItems: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '420px', padding: '24px', border: '1px solid #333', borderRadius: '16px', background: '#17171b', color: '#fff' }}>
          <div style={{ color: 'var(--primary-color, #e91e63)', fontSize: '1.8rem', marginBottom: '12px' }}>
            <i className="fa-solid fa-user-lock"></i>
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem' }}>Acesso ainda não liberado</h2>
          <p style={{ margin: 0, color: '#aaa', lineHeight: 1.5 }}>
            Peça à responsável pela Bonyta para ativar seu perfil e vincular sua profissional.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">

      {/* =========================================
          1. ABA DA AGENDA (Mostra só na aba Agenda)
          ========================================= */}
      {activeTab === 'agenda' && (
        <>
          <Header
            theme={theme} toggleTheme={toggleTheme}
            view={view} setView={setView}
            profFilter={profFilter} setProfFilter={setProfFilter}
            professionals={scopedProfessionals}
            selectedDate={selectedDate}
            onPrev={() => navigateDate(-1)}
            onNext={() => navigateDate(1)}
            allowAllProfessionals={!access.isProfessional}
          />

          {view === 'dia' && (
            <WeekDaysStrip selectedDate={selectedDate} onSelect={setSelectedDate} theme={theme} />
          )}

          <main className="views-wrapper">
            {error && (
              <div style={{ padding: 16, color: '#ff4081', fontSize: 12 }}>
                Erro ao carregar dados do Supabase: {error.message}
              </div>
            )}
            {access.isProfessional && !access.professionalId && (
              <div style={{ margin: 16, padding: 14, borderRadius: 12, background: 'rgba(233, 30, 99, 0.12)', color: '#ff8ab3', fontSize: 13, lineHeight: 1.4 }}>
                Seu login está como profissional, mas ainda não foi vinculado a uma profissional da equipe.
                Peça para a conta administradora abrir “Acessos do App” e escolher sua profissional.
              </div>
            )}

            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                Carregando agenda...
              </div>
            ) : (
              <>
                <section className={`view-container ${view !== 'dia' ? 'hidden' : ''}`}>
                  <DayView
                    professionals={scopedProfessionals}
                    appointments={scopedAppointments}
                    selectedDate={selectedDate}
                    profFilter={profFilter}
                    onSlotClick={(prof, time) =>
                      openNewModal({
                        professional_id: prof.id,
                        time
                      })
                    }
                    onCardClick={openEditModal}
                    onToday={() => setSelectedDate(new Date())}
                  />
                </section>

                <section className={`view-container ${view !== 'semana' ? 'hidden' : ''}`}>
                  <WeekView
                    appointments={scopedAppointments}
                    selectedDate={selectedDate}
                    profFilter={profFilter}
                    professionals={scopedProfessionals}
                  />
                </section>

                <section className={`view-container ${view !== 'mes' ? 'hidden' : ''}`}>
                  <MonthView
                    appointments={scopedAppointments}
                    selectedDate={selectedDate}
                    profFilter={profFilter}
                    theme={theme}
                    onDayClick={(date) => {
                      setSelectedDate(date);
                      setView('dia');
                    }}
                    /* AQUI ESTÃO OS DOIS COMANDOS NOVOS: */
                    onPrev={() => navigateDate(-1)}
                    onNext={() => navigateDate(1)}
                  />
                </section>
              </>
            )}
          </main>
        </>
      )}

      {/* =========================================
          2. ABA DE SERVIÇOS (Mostra só na aba Serviços)
          ========================================= */}
      {activeTab === 'servicos' && (
        <ServicesView theme={theme} />
      )}

  {/* =========================================
          3. ABA DE CLIENTES (Mostra só na aba Clientes)
          ========================================= */}
      {activeTab === 'clientes' && (
        <ClientsView theme={theme} />
      )}

      {/* =========================================
          4. ABA DE FINANCEIRO / DASHBOARD
          ========================================= */}
      {activeTab === 'financeiro' && (
        <DashboardView 
          appointments={scopedAppointments} 
          professionals={scopedProfessionals} 
          products={products}
          onUpdateProfessional={access.canSeeFullFinance ? updateProfessional : null}
          accessMode={access.canSeeFullFinance ? 'owner' : 'professional'}
          currentProfessionalId={access.professionalId}
          theme={theme} 
        />
      )}

      {isFabOpen && (
        <div
          onClick={() => setIsFabOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(0,0,0,0.42)',
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      {isFabOpen && (
        <section
          style={{
            position: 'fixed',
            left: '12px',
            right: '12px',
            bottom: '88px',
            zIndex: 9999,
            maxWidth: '560px',
            margin: '0 auto',
            maxHeight: '72vh',
            overflowY: 'auto',
            borderRadius: '24px',
            border: theme === 'light' ? '1px solid #ddd' : '1px solid rgba(255,255,255,0.12)',
            background: theme === 'light' ? '#ffffff' : '#171717',
            boxShadow: '0 24px 80px rgba(0,0,0,0.38)',
            padding: '16px'
          }}
          aria-label="Ações rápidas"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div>
              <strong style={{ color: theme === 'light' ? '#111' : '#fff', fontSize: '1rem' }}>Ações rápidas</strong>
              <p style={{ color: theme === 'light' ? '#666' : '#aaa', margin: '3px 0 0', fontSize: '0.78rem' }}>Escolha o que quer fazer agora.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFabOpen(false)}
              style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: theme === 'light' ? '#f3f4f6' : '#262626', color: theme === 'light' ? '#111' : '#fff', cursor: 'pointer' }}
              aria-label="Fechar ações rápidas"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {actionGroups.map((group) => (
              <div key={group.title} style={{ display: 'grid', gap: '8px' }}>
                <span style={{ color: 'var(--primary-color, #e91e63)', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {group.title}
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                  {group.items.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => handleActionClick(action)}
                      style={{
                        position: 'relative',
                        display: 'grid',
                        gridTemplateColumns: '38px 1fr',
                        gap: '10px',
                        alignItems: 'center',
                        minHeight: '74px',
                        padding: '10px',
                        borderRadius: '16px',
                        border: theme === 'light' ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.1)',
                        background: theme === 'light' ? '#fafafa' : 'rgba(255,255,255,0.045)',
                        color: theme === 'light' ? '#111' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ width: '38px', height: '38px', display: 'grid', placeItems: 'center', borderRadius: '13px', background: action.color, color: '#fff', boxShadow: '0 10px 22px rgba(0,0,0,0.18)' }}>
                        <i className={`fa-solid ${action.icon}`}></i>
                      </span>
                      <span style={{ display: 'grid', gap: '3px', minWidth: 0 }}>
                        <strong style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{action.label}</strong>
                        <small style={{ color: theme === 'light' ? '#666' : '#aaa', fontSize: '0.7rem', lineHeight: 1.25 }}>{action.description}</small>
                      </span>
                      {action.badge > 0 && (
                        <em style={{ position: 'absolute', top: '8px', right: '8px', minWidth: '19px', height: '19px', padding: '0 6px', borderRadius: '999px', background: '#f59e0b', color: '#fff', fontSize: '0.65rem', fontStyle: 'normal', fontWeight: 900, display: 'grid', placeItems: 'center' }}>
                          {action.badge}
                        </em>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsFabOpen(!isFabOpen)}
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '100px',
          zIndex: 10000,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--primary-color, #e91e63)',
          color: '#fff',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(233, 30, 99, 0.4)',
          transition: 'transform 0.2s ease',
          transform: isFabOpen ? 'rotate(45deg)' : 'rotate(0deg)'
        }}
        aria-label={isFabOpen ? 'Fechar ações rápidas' : 'Abrir ações rápidas'}
      >
        <i className="fa-solid fa-plus"></i>
      </button>
      {/* =========================================
          4. MENU INFERIOR (Fixo no rodapé sempre)
          ========================================= */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme}
        allowedTabs={allowedTabs}
      />

      {/* =========================================
          5. MODAL DE AGENDAMENTO (Oculto até clicar)
          ========================================= */}
      <AppointmentModal
        open={modalOpen}
        mode={modalMode}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onDelete={editingAppointment ? handleDelete : null}
        professionals={scopedProfessionals}
        defaultDate={formatDateToISO(selectedDate)}
        editingAppointment={editingAppointment}
        prefill={prefill}
        theme={theme}
        clients={clients}
        services={services}
        products={products}
        appointments={scopedAppointments}
      />

       {/* =========================================
          6. MODAL DE BLOQUEIO / COMPROMISSO ADMINISTRATIVO
          ========================================= */}
      <BlockModal
        open={blockModalOpen}
        onClose={handleCloseBlockModal}
        onSubmit={handleSubmit}
        onDelete={handleDelete} /* Reutiliza a sua função de deleção do Supabase existente */
        professionals={scopedProfessionals}
        defaultDate={formatDateToISO(selectedDate)}
        theme={theme}
        editingBlock={editingBlock} /* Passa o bloco atual se for edição */
      />

      {/* =========================================
          7. MODAL DE LISTA DE ESPERA
          ========================================= */}
      <WaitlistModal
        open={waitlistModalOpen}
        onClose={() => setWaitlistModalOpen(false)}
        clients={clients} /* Certifique-se de passar o array de clients que você já tem no App.jsx */
        services={services} /* E o array de services */
        professionals={scopedProfessionals}
        defaultDate={formatDateToISO(selectedDate)}
        theme={theme}
        waitlist={waitlist}
        loading={waitlistLoading}
        error={waitlistError}
        onAdd={addWaitlistEntry}
        onRemove={removeWaitlistEntry}
      />

      {/* 8. MODAL DE SOLICITAÇÕES DA LANDING */}
      <BookingRequestsModal
        open={bookingRequestsModalOpen}
        onClose={() => setBookingRequestsModalOpen(false)}
        theme={theme}
        requests={bookingRequests}
        services={services}
        professionals={scopedProfessionals}
        loading={bookingRequestsLoading}
        error={bookingRequestsError}
        messageLogs={messageLogs}
        messageLogsError={messageLogsError}
        onLogMessage={logMessage}
        onUpdateStatus={updateRequestStatus}
        onCreateAppointment={openAppointmentFromBookingRequest}
      />

      <DailyCenterModal
        open={dailyCenterModalOpen}
        onClose={() => setDailyCenterModalOpen(false)}
        theme={theme}
        selectedDate={selectedDate}
        appointments={scopedAppointments}
        clients={clients}
        professionals={scopedProfessionals}
        messageLogs={messageLogs}
        messageLogsError={messageLogsError}
        onLogMessage={logMessage}
        onUpdateAppointment={updateAppointment}
      />

      <CommunicationCenterModal
        open={communicationCenterOpen}
        onClose={() => setCommunicationCenterOpen(false)}
        theme={theme}
        tasks={communicationTasks}
        onLogMessage={logMessage}
      />

      <WorkingHoursModal
        open={workingHoursModalOpen}
        onClose={() => setWorkingHoursModalOpen(false)}
        theme={theme}
        professionals={professionals}
        workingHours={workingHours}
        loading={workingHoursLoading}
        error={workingHoursError}
        onChange={updateWorkingHour}
        onSave={saveProfessionalSchedule}
      />

      <AccessControlModal
        open={accessControlModalOpen}
        onClose={() => setAccessControlModalOpen(false)}
        theme={theme}
        professionals={professionals}
        profiles={userProfiles}
        loading={userProfilesLoading}
        error={userProfilesError}
        onSave={saveUserProfile}
      />

     {/* 9. MODAL DE NOVA PROFISSIONAL */}
      <ProfessionalModal
        open={profModalOpen}
        onClose={() => setProfModalOpen(false)}
        onSubmit={async (newProf) => {
          await createProfessional(newProf)
          setProfModalOpen(false);
        }}
        theme={theme}
      />
    </div>
  );
}
