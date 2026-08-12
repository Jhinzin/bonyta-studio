import React, { useCallback, useContext, useState, useEffect, useMemo } from 'react';
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
import ToastProvider, { ToastContext } from './components/Toast';
import ConfirmDialog from './components/ConfirmDialog';
import AiStaffAssistantModal from './components/AiStaffAssistantModal';
import ImportDataModal from './components/ImportDataModal';


export default function App() {
  const isPublicBooking = window.location.pathname.startsWith('/agendar')

  useEffect(() => {
    document.title = isPublicBooking
      ? 'Bonyta Studio | Agende seu horário'
      : 'Bonyta Studio - Agenda'
  }, [isPublicBooking])

  if (isPublicBooking) return <PublicBookingView />
  return (
    <ToastProvider>
      <AuthGate><StudioApp /></AuthGate>
    </ToastProvider>
  )
}

function StudioApp() {
  const addToast = useContext(ToastContext)

  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [importDataModalOpen, setImportDataModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('appointment');
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
  const [activeTab, setActiveTab] = useState('agenda')
  const [profModalOpen, setProfModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, label } ou null

  // Atalho de teclado Ctrl+K para abrir a assistente IA
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAiAssistantOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Volta para hoje ao mudar para a aba de Agenda
  useEffect(() => {
    if (activeTab === 'agenda' && !prefill?.date) {
      setSelectedDate(new Date());
      setView('dia');
    }
  }, [activeTab]);

  const {
    professionals, appointments, loading, error,
    createAppointment, updateAppointment, deleteAppointment, createProfessional, updateProfessional
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
    ? (access.professionalId ? professionals.filter((p) => p.id === access.professionalId) : [])
    : access.isOwner ? professionals : []

  const scopedAppointments = access.isProfessional
    ? (access.professionalId ? appointments.filter((a) => a.professional_id === access.professionalId) : [])
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
        nd.setMonth(nd.getMonth() + dir);
      } else if (view === 'semana') {
        nd.setDate(nd.getDate() + (dir * 7));
      } else {
        nd.setDate(nd.getDate() + dir);
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
    if (appointment.is_block) {
      setEditingBlock(appointment);
      setBlockModalOpen(true);
    } else {
      setModalMode('appointment');
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false)
    setEditingAppointment(null)
    setPrefill(null)
  }

  const handleSubmit = async (appointmentData) => {
    try {
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
        total_price: Number(appointmentData.total_price || 0),
        total_cost: Number(appointmentData.total_cost || 0),
        amount_paid: Number(appointmentData.amount_paid || 0),
        payment_method: appointmentData.payment_method || 'nao_informado',
        payment_status: appointmentData.payment_status || 'aberto',
        comanda_json: appointmentData.comanda ? JSON.stringify(appointmentData.comanda) : null
      };

      const recordId = appointmentData.id || editingAppointment?.id

      if (recordId) {
        await updateAppointment(recordId, payload)
        addToast('Agendamento atualizado com sucesso!', 'success')
      } else {
        await createAppointment(payload)
        addToast('Agendamento criado com sucesso!', 'success')
      }

      if (!recordId && appointmentData.booking_request_id) {
        await updateRequestStatus(appointmentData.booking_request_id, 'scheduled')
      }

    } catch (err) {
      console.error('Erro ao salvar no Supabase:', err)
      addToast(`Erro ao salvar: ${err.message}`, 'error')
      throw err
    }
  };

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
    if (existingClient) await updateClient(existingClient.id, clientPayload)

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

  // Exibe dialog de confirmação antes de deletar
  const handleDeleteRequest = () => {
    const label = editingAppointment?.client_name || 'este agendamento'
    setConfirmDelete({ id: editingAppointment?.id, label })
  }

  const handleDeleteConfirmed = async () => {
    if (confirmDelete?.id) {
      await deleteAppointment(confirmDelete.id)
      addToast('Agendamento removido.', 'warning')
      setConfirmDelete(null)
      closeModal()
    }
  }

  // Força seleção de profissional ao mudar para Semana/Mês
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
          color: 'var(--accent-pink)',
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
          color: '#374151',
          onClick: () => setWorkingHoursModalOpen(true)
        },
        access.canManageBusiness && {
          label: 'Importar dados',
          description: 'Colar agendamentos ou clientes',
          icon: 'fa-file-import',
          color: '#7c3aed',
          onClick: () => setImportDataModalOpen(true)
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
      <div className="app-loading">
        <div className="loading-spinner" />
        <div className="loading-label">Carregando seu acesso...</div>
      </div>
    )
  }

  if (!access.isActive) {
    return (
      <div className="app-loading">
        <div className="access-denied-card">
          <div className="access-denied-icon">
            <i className="fa-solid fa-user-lock" />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Acesso ainda não liberado</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.9rem' }}>
            Peça à responsável pela Bonyta para ativar seu perfil e vincular sua profissional.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">

      {/* =========================================
          1. ABA DA AGENDA
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
            onOpenAiAssistant={() => setAiAssistantOpen(true)}
          />

          {view === 'dia' && (
            <WeekDaysStrip selectedDate={selectedDate} onSelect={setSelectedDate} theme={theme} />
          )}

          <main className="views-wrapper">
            {error && (
              <div style={{ padding: 16, color: '#ff4081', fontSize: 12 }}>
                Erro ao carregar dados: {error.message}
              </div>
            )}
            {access.isProfessional && !access.professionalId && (
              <div style={{ margin: 16, padding: 14, borderRadius: 12, background: 'rgba(233, 30, 99, 0.12)', color: '#ff8ab3', fontSize: 13, lineHeight: 1.4 }}>
                Seu login está como profissional, mas ainda não foi vinculado a uma profissional da equipe.
                Peça para a conta administradora abrir "Acessos do App" e escolher sua profissional.
              </div>
            )}

            {loading ? (
              <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div className="loading-spinner" />
                <span className="loading-label">Carregando agenda...</span>
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
          2. ABA DE SERVIÇOS
          ========================================= */}
      {activeTab === 'servicos' && (
        <ServicesView theme={theme} />
      )}

      {/* =========================================
          3. ABA DE CLIENTES
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

      {/* =========================================
          FAB PANEL OVERLAY
          ========================================= */}
      {isFabOpen && (
        <div
          className="fab-panel-overlay"
          onClick={() => setIsFabOpen(false)}
        />
      )}

      {isFabOpen && (
        <section
          className={`fab-panel ${theme === 'light' ? 'fab-panel-light' : ''}`}
          aria-label="Ações rápidas"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>Ações rápidas</strong>
              <p style={{ color: 'var(--text-secondary)', margin: '3px 0 0', fontSize: '0.78rem' }}>
                Escolha o que quer fazer agora.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFabOpen(false)}
              style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer' }}
              aria-label="Fechar ações rápidas"
            >
              <i className="fa-solid fa-times" />
            </button>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {actionGroups.map((group) => (
              <div key={group.title}>
                <div className="action-group-title">{group.title}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: '8px' }}>
                  {group.items.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      className="action-btn"
                      onClick={() => handleActionClick(action)}
                    >
                      <span className="action-btn-icon" style={{ background: action.color }}>
                        <i className={`fa-solid ${action.icon}`} />
                      </span>
                      <span className="action-btn-text">
                        <strong>{action.label}</strong>
                        <small>{action.description}</small>
                      </span>
                      {action.badge > 0 && (
                        <em className="action-btn-badge">{action.badge}</em>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAB Button */}
      <button
        type="button"
        className={`fab-button ${isFabOpen ? 'open' : ''}`}
        onClick={() => setIsFabOpen(!isFabOpen)}
        aria-label={isFabOpen ? 'Fechar ações rápidas' : 'Abrir ações rápidas'}
      >
        <i className="fa-solid fa-plus" />
      </button>

      {/* =========================================
          BOTTOM NAV
          ========================================= */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        allowedTabs={allowedTabs}
        bookingRequestsCount={bookingRequests.length}
      />

      {/* =========================================
          MODAIS
          ========================================= */}
      <AppointmentModal
        open={modalOpen}
        mode={modalMode}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onDelete={editingAppointment ? handleDeleteRequest : null}
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

      <BlockModal
        open={blockModalOpen}
        onClose={handleCloseBlockModal}
        onSubmit={handleSubmit}
        onDelete={async () => {
          if (editingAppointment?.id) {
            await deleteAppointment(editingAppointment.id)
            addToast('Bloqueio removido.', 'warning')
            handleCloseBlockModal()
          }
        }}
        professionals={scopedProfessionals}
        defaultDate={formatDateToISO(selectedDate)}
        theme={theme}
        editingBlock={editingBlock}
      />

      <WaitlistModal
        open={waitlistModalOpen}
        onClose={() => setWaitlistModalOpen(false)}
        clients={clients}
        services={services}
        professionals={scopedProfessionals}
        defaultDate={formatDateToISO(selectedDate)}
        theme={theme}
        waitlist={waitlist}
        loading={waitlistLoading}
        error={waitlistError}
        onAdd={addWaitlistEntry}
        onRemove={removeWaitlistEntry}
      />

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

      <ProfessionalModal
        open={profModalOpen}
        onClose={() => setProfModalOpen(false)}
        onSubmit={async (newProf) => {
          await createProfessional(newProf)
          setProfModalOpen(false);
          addToast('Profissional cadastrada com sucesso!', 'success')
        }}
        theme={theme}
      />

      <AiStaffAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        appointments={scopedAppointments}
        professionals={scopedProfessionals}
        services={services}
        onUpdateAppointment={updateAppointment}
        onDeleteAppointment={deleteAppointment}
        onCreateAppointment={createAppointment}
        addToast={addToast}
      />

      {/* Dialog de Confirmação de Deleção */}
      {confirmDelete && (
        <ConfirmDialog
          title="Excluir agendamento?"
          message={`Você está prestes a remover o agendamento de "${confirmDelete.label}". Esta ação não pode ser desfeita.`}
          confirmLabel="Sim, excluir"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <ImportDataModal
        isOpen={importDataModalOpen}
        onClose={() => setImportDataModalOpen(false)}
        professionals={scopedProfessionals}
        services={services}
        onImportDone={() => {
          setImportDataModalOpen(false)
          addToast('Dados importados com sucesso!', 'success')
        }}
      />
    </div>
  );
}
