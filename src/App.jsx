import React, { useState, useEffect } from 'react';
import { useAppointments } from './hooks/useAppointments'
import { useClients } from './hooks/useClients'
import { useProducts } from './hooks/useProducts'
import { useBookingRequests } from './hooks/useBookingRequests'
import { useServices } from './hooks/useServices'
import { useWaitlist } from './hooks/useWaitlist'
import { formatDateToISO } from './utils'
import { onlyDigits } from './utils/whatsapp'
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
import WaitlistModal from './components/WaitlistModal'
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
  const { clients, createClient } = useClients()
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
    createAppointment, updateAppointment, deleteAppointment, createProfessional, updateProfessional
  } = useAppointments()

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

    const client = existingClient || await createClient({
      name: request.customer_name,
      phone: request.customer_phone,
      observation: 'Cliente captada pela pagina publica /agendar.'
    })

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
      time: defaultTimeByPeriod(request.preferred_period),
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
    if (view !== 'dia' && profFilter === 'todos' && professionals.length > 0) {
      setProfFilter(professionals[0].id);
    }
  }, [view, profFilter, professionals]);

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
            professionals={professionals}
            selectedDate={selectedDate}
            onPrev={() => navigateDate(-1)}
            onNext={() => navigateDate(1)}
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

            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                Carregando agenda...
              </div>
            ) : (
              <>
                <section className={`view-container ${view !== 'dia' ? 'hidden' : ''}`}>
                  <DayView
                    professionals={professionals}
                    appointments={appointments}
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
                    appointments={appointments}
                    selectedDate={selectedDate}
                    profFilter={profFilter}
                    professionals={professionals}
                  />
                </section>

                <section className={`view-container ${view !== 'mes' ? 'hidden' : ''}`}>
                  <MonthView
                    appointments={appointments}
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
          appointments={appointments} 
          professionals={professionals} 
          products={products}
          onUpdateProfessional={updateProfessional}
          theme={theme} 
        />
      )}

        {/* ==========================================
          NOVO: SPEED DIAL (FAB EXPANSÍVEL) ALINHADO
          ========================================== */}
      <div style={{ position: 'fixed', bottom: '100px', right: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', zIndex: 9999 }}>
        {isFabOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px', alignItems: 'flex-end' }}>
            
            {/* Solicitações vindas da landing pública */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: theme === 'light' ? '#fff' : '#333', color: theme === 'light' ? '#333' : '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                Solicitações do Site {bookingRequests.length > 0 ? `(${bookingRequests.length})` : ''}
              </span>
              <div style={{ width: '60px', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => { setBookingRequestsModalOpen(true); setIsFabOpen(false); }}
                  style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--primary-color, #e91e63)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', position: 'relative' }}
                >
                  <i className="fa-solid fa-inbox"></i>
                  {bookingRequests.length > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-5px', minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '999px', background: '#f59e0b', color: '#fff', fontSize: '0.65rem', fontWeight: 900, display: 'grid', placeItems: 'center' }}>
                      {bookingRequests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>


            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: theme === 'light' ? '#fff' : '#333', color: theme === 'light' ? '#333' : '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                Central do Dia
              </span>
              <div style={{ width: '60px', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => { setDailyCenterModalOpen(true); setIsFabOpen(false); }}
                  style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#06b6d4', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
                >
                  <i className="fa-solid fa-bell"></i>
                </button>
              </div>
            </div>

            {/* NOVO: Adicionar Profissional */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: theme === 'light' ? '#fff' : '#333', color: theme === 'light' ? '#333' : '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                Nova Profissional
              </span>
              <div style={{ width: '60px', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => { setProfModalOpen(true); setIsFabOpen(false); }}
                  style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
                >
                  <i className="fa-solid fa-user-plus"></i>
                </button>
              </div>
            </div>

            {/* Lista de Espera */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: theme === 'light' ? '#fff' : '#333', color: theme === 'light' ? '#333' : '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                Lista de Espera
              </span>
              {/* MÁGICA DO ALINHAMENTO: Wrapper de 60px centralizado */}
              <div style={{ width: '60px', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => { setWaitlistModalOpen(true); setIsFabOpen(false); }}
                  style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
                >
                  <i className="fa-solid fa-clipboard-list"></i>
                </button>
              </div>
            </div>

            {/* Novo Compromisso/Bloqueio */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: theme === 'light' ? '#fff' : '#333', color: theme === 'light' ? '#333' : '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                Novo Compromisso/Bloqueio
              </span>
              <div style={{ width: '60px', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => { setBlockModalOpen(true); setIsFabOpen(false); }}
                  style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#7c4dff', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
                >
                  <i className="fa-solid fa-lock"></i>
                </button>
              </div>
            </div>

            {/* Novo Agendamento */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: theme === 'light' ? '#fff' : '#333', color: theme === 'light' ? '#333' : '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                Novo Agendamento
              </span>
              <div style={{ width: '60px', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => { setModalMode('appointment'); openNewModal(); setIsFabOpen(false); }}
                  style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
                >
                  <i className="fa-solid fa-calendar-check"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botão Rosa Principal */}
        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          style={{ 
            width: '60px', height: '60px', borderRadius: '50%', 
            background: 'var(--primary-color, #e91e63)', color: '#fff', 
            border: 'none', fontSize: '1.5rem', cursor: 'pointer', 
            boxShadow: '0 4px 12px rgba(233, 30, 99, 0.4)',
            transition: 'transform 0.2s ease',
            transform: isFabOpen ? 'rotate(45deg)' : 'rotate(0deg)'
          }}
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>
      {/* =========================================
          4. MENU INFERIOR (Fixo no rodapé sempre)
          ========================================= */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme}
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
        professionals={professionals}
        defaultDate={formatDateToISO(selectedDate)}
        editingAppointment={editingAppointment}
        prefill={prefill}
        theme={theme}
        clients={clients}
        services={services}
        products={products}
        appointments={appointments}
      />

       {/* =========================================
          6. MODAL DE BLOQUEIO / COMPROMISSO ADMINISTRATIVO
          ========================================= */}
      <BlockModal
        open={blockModalOpen}
        onClose={handleCloseBlockModal}
        onSubmit={handleSubmit}
        onDelete={handleDelete} /* Reutiliza a sua função de deleção do Supabase existente */
        professionals={professionals}
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
        professionals={professionals}
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
        professionals={professionals}
        loading={bookingRequestsLoading}
        error={bookingRequestsError}
        onUpdateStatus={updateRequestStatus}
        onCreateAppointment={openAppointmentFromBookingRequest}
      />

      <DailyCenterModal
        open={dailyCenterModalOpen}
        onClose={() => setDailyCenterModalOpen(false)}
        theme={theme}
        selectedDate={selectedDate}
        appointments={appointments}
        clients={clients}
        professionals={professionals}
        onUpdateAppointment={updateAppointment}
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
