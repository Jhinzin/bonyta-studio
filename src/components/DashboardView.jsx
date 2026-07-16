import React, { useEffect, useMemo, useState } from 'react'
import { formatDateToISO } from '../utils'

const formatCurrency = (value) => (
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
)

const statusConfig = {
  pendente: { label: 'Pendentes', color: '#f59e0b' },
  confirmado: { label: 'Confirmados', color: '#3b82f6' },
  concluido: { label: 'Concluidos', color: '#10b981' },
  faltou: { label: 'Faltas', color: '#ef4444' }
}

const paymentMethodLabel = {
  nao_informado: 'Nao informado',
  pix: 'Pix',
  credito: 'Credito',
  debito: 'Debito',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferencia',
  outro: 'Outro'
}

const paymentStatusLabel = {
  aberto: 'Em aberto',
  sinal: 'Sinal',
  pago: 'Pago'
}

const compensationTypeLabel = {
  studio: 'Estudio',
  commission: 'Porcentagem',
  rent_share: 'Aluguel'
}

const getPaidAmount = (appointment) => {
  if (appointment.amount_paid === null || appointment.amount_paid === undefined) {
    return Number(appointment.payment_status === 'pago' ? appointment.total_price || 0 : 0)
  }
  return Number(appointment.amount_paid || 0)
}

const getOpenAmount = (appointment) => (
  Math.max(Number(appointment.total_price || 0) - getPaidAmount(appointment), 0)
)

const shortDate = (date) => {
  if (!date) return ''
  const [year, month, day] = date.split('-')
  return day && month && year ? `${day}/${month}/${year}` : date
}

export default function DashboardView({ appointments, professionals, products = [], onUpdateProfessional, theme }) {
  const [refDate, setRefDate] = useState(new Date())
  const [periodMode, setPeriodMode] = useState('mes')
  const [dashProfFilter, setDashProfFilter] = useState('todos')
  const [compDrafts, setCompDrafts] = useState({})
  const [savingProfessionalId, setSavingProfessionalId] = useState(null)

  const isLight = theme === 'light'
  const textMain = isLight ? '#333' : '#fff'
  const textSec = isLight ? '#666' : '#aaa'
  const bgMain = isLight ? '#f9f9f9' : '#121212'
  const bgCard = isLight ? '#ffffff' : '#1e1e1e'
  const borderCol = isLight ? '#eee' : '#333'
  const bgInput = isLight ? '#ffffff' : '#151515'

  useEffect(() => {
    setCompDrafts((current) => {
      const next = { ...current }
      professionals.forEach((professional) => {
        if (!next[professional.id]) {
          next[professional.id] = {
            compensation_type: professional.compensation_type || 'studio',
            commission_percent: professional.commission_percent ?? 0,
            monthly_rent_share: professional.monthly_rent_share ?? 0
          }
        }
      })
      return next
    })
  }, [professionals])

  const monthName = refDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const dayName = refDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const currentMonthISO = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`
  const currentDayISO = formatDateToISO(refDate)

  const navigatePeriod = (dir) => {
    setRefDate((current) => {
      const next = new Date(current)
      if (periodMode === 'mes') next.setMonth(next.getMonth() + dir)
      else next.setDate(next.getDate() + dir)
      return next
    })
  }

  const scopedAppointments = useMemo(() => (
    appointments
      .filter((appointment) => !appointment.is_block)
      .filter((appointment) => periodMode === 'mes'
        ? appointment.date?.startsWith(currentMonthISO)
        : appointment.date === currentDayISO)
      .filter((appointment) => dashProfFilter === 'todos' || appointment.professional_id === dashProfFilter)
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
  ), [appointments, currentDayISO, currentMonthISO, dashProfFilter, periodMode])

  const payableAppointments = scopedAppointments.filter((appointment) => appointment.status !== 'faltou')
  const closedAppointments = scopedAppointments.filter((appointment) => appointment.status === 'concluido')

  const faturamentoPrevisto = payableAppointments.reduce((sum, appointment) => sum + Number(appointment.total_price || 0), 0)
  const faturamentoConcluido = closedAppointments.reduce((sum, appointment) => sum + Number(appointment.total_price || 0), 0)
  const custosPrevistos = payableAppointments.reduce((sum, appointment) => sum + Number(appointment.total_cost || 0), 0)
  const custosConcluidos = closedAppointments.reduce((sum, appointment) => sum + Number(appointment.total_cost || 0), 0)
  const totalRecebido = payableAppointments.reduce((sum, appointment) => sum + getPaidAmount(appointment), 0)
  const totalEmAberto = payableAppointments.reduce((sum, appointment) => sum + getOpenAmount(appointment), 0)
  const lucroPrevisto = faturamentoPrevisto - custosPrevistos
  const lucroConcluido = faturamentoConcluido - custosConcluidos
  const lucroRecebido = totalRecebido - custosPrevistos
  const ticketMedio = faturamentoPrevisto / Math.max(payableAppointments.length, 1)
  const marginPercent = faturamentoPrevisto > 0 ? (lucroPrevisto / faturamentoPrevisto) * 100 : 0

  const paymentStatusCounts = payableAppointments.reduce((acc, appointment) => {
    const status = appointment.payment_status || 'aberto'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const statusCounts = scopedAppointments.reduce((acc, appointment) => {
    const status = appointment.status || 'pendente'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const paymentMethods = payableAppointments.reduce((acc, appointment) => {
    const method = appointment.payment_method || 'nao_informado'
    const paid = getPaidAmount(appointment)
    if (!acc[method]) acc[method] = { method, paid: 0, count: 0 }
    acc[method].paid += paid
    if (paid > 0) acc[method].count += 1
    return acc
  }, {})

  const paymentMethodRows = Object.values(paymentMethods)
    .filter((item) => item.paid > 0 || item.method === 'nao_informado')
    .sort((a, b) => b.paid - a.paid)

  const openReceivables = payableAppointments
    .filter((appointment) => getOpenAmount(appointment) > 0)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))

  const professionalFinanceRows = professionals
    .filter((professional) => dashProfFilter === 'todos' || professional.id === dashProfFilter)
    .map((professional) => {
      const profAppointments = payableAppointments.filter((appointment) => appointment.professional_id === professional.id)
      const revenue = profAppointments.reduce((sum, appointment) => sum + Number(appointment.total_price || 0), 0)
      const received = profAppointments.reduce((sum, appointment) => sum + getPaidAmount(appointment), 0)
      const materialCost = profAppointments.reduce((sum, appointment) => sum + Number(appointment.total_cost || 0), 0)
      const compensationType = professional.compensation_type || 'studio'
      const commissionPercent = Number(professional.commission_percent || 0)
      const commissionPayout = compensationType === 'commission' ? revenue * (commissionPercent / 100) : 0
      const rentShare = compensationType === 'rent_share' && periodMode === 'mes'
        ? Number(professional.monthly_rent_share || 0)
        : 0
      const studioResult = compensationType === 'rent_share'
        ? rentShare
        : revenue - materialCost - commissionPayout

      return {
        id: professional.id,
        name: professional.name,
        compensationType,
        commissionPercent,
        monthlyRentShare: Number(professional.monthly_rent_share || 0),
        count: profAppointments.length,
        revenue,
        received,
        materialCost,
        commissionPayout,
        rentShare,
        studioResult
      }
    })

  const totalCommissionPayout = professionalFinanceRows.reduce((sum, item) => sum + item.commissionPayout, 0)
  const totalRentShare = professionalFinanceRows.reduce((sum, item) => sum + item.rentShare, 0)
  const studioResult = professionalFinanceRows.reduce((sum, item) => sum + item.studioResult, 0)

  const ranking = professionals
    .filter((professional) => dashProfFilter === 'todos' || professional.id === dashProfFilter)
    .map((professional) => {
      const profAppointments = payableAppointments.filter((appointment) => appointment.professional_id === professional.id)
      const revenue = profAppointments.reduce((sum, appointment) => sum + Number(appointment.total_price || 0), 0)
      const received = profAppointments.reduce((sum, appointment) => sum + getPaidAmount(appointment), 0)
      const costs = profAppointments.reduce((sum, appointment) => sum + Number(appointment.total_cost || 0), 0)
      return { id: professional.id, name: professional.name, count: profAppointments.length, revenue, received, profit: revenue - costs }
    })
    .sort((a, b) => b.revenue - a.revenue)

  const maxRevenue = Math.max(...ranking.map((item) => item.revenue), 1)
  const periodTitle = periodMode === 'mes' ? monthName : dayName
  const stockCostValue = products.reduce((sum, product) => sum + Number(product.cost || 0) * Number(product.stock_quantity || 0), 0)
  const stockSaleValue = products.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.stock_quantity || 0), 0)
  const lowStockProducts = products
    .filter((product) => Number(product.stock_quantity || 0) <= 2)
    .sort((a, b) => Number(a.stock_quantity || 0) - Number(b.stock_quantity || 0))

  const handleCompDraftChange = (professionalId, patch) => {
    setCompDrafts((current) => ({
      ...current,
      [professionalId]: {
        ...(current[professionalId] || {}),
        ...patch
      }
    }))
  }

  const handleSaveCompensation = async (professionalId) => {
    if (!onUpdateProfessional) return
    const draft = compDrafts[professionalId] || {}
    setSavingProfessionalId(professionalId)
    try {
      await onUpdateProfessional(professionalId, {
        compensation_type: draft.compensation_type || 'studio',
        commission_percent: Number(draft.commission_percent || 0),
        monthly_rent_share: Number(draft.monthly_rent_share || 0)
      })
    } catch (err) {
      alert(`Erro ao salvar regra financeira: ${err.message}`)
    } finally {
      setSavingProfessionalId(null)
    }
  }

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', background: bgMain, height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: textMain, margin: 0 }}>Financas</h2>
        <p style={{ color: textSec, fontSize: '0.82rem', marginTop: '4px' }}>Fechamento de caixa, comandas e pendencias</p>
      </div>

      <div style={{ background: bgCard, padding: '14px', borderRadius: '12px', border: `1px solid ${borderCol}`, marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: bgMain, padding: '4px', borderRadius: '10px' }}>
          {[
            { id: 'dia', label: 'Dia' },
            { id: 'mes', label: 'Mes' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriodMode(item.id)}
              style={{ border: 'none', borderRadius: '8px', padding: '10px', background: periodMode === item.id ? 'var(--primary-color, #e91e63)' : 'transparent', color: periodMode === item.id ? '#fff' : textSec, fontWeight: 900, cursor: 'pointer' }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <select
          value={dashProfFilter}
          onChange={(event) => setDashProfFilter(event.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgInput, color: textMain, outline: 'none', fontWeight: 800 }}
        >
          <option value="todos">Todas as profissionais</option>
          {professionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.name}</option>)}
        </select>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => navigatePeriod(-1)} style={{ background: bgMain, border: `1px solid ${borderCol}`, color: textMain, width: '38px', height: '38px', borderRadius: '8px', cursor: 'pointer' }}><i className="fas fa-chevron-left"></i></button>
          <h3 style={{ margin: 0, textTransform: 'capitalize', color: 'var(--primary-color, #e91e63)', fontSize: '1.02rem', fontWeight: 900, textAlign: 'center' }}>{periodTitle}</h3>
          <button onClick={() => navigatePeriod(1)} style={{ background: bgMain, border: `1px solid ${borderCol}`, color: textMain, width: '38px', height: '38px', borderRadius: '8px', cursor: 'pointer' }}><i className="fas fa-chevron-right"></i></button>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, var(--primary-color, #e91e63) 0%, #ff758c 100%)', borderRadius: '16px', padding: '22px', color: '#fff', boxShadow: '0 4px 15px rgba(233, 30, 99, 0.25)', marginBottom: '12px' }}>
        <div style={{ fontSize: '0.82rem', opacity: 0.9, fontWeight: 800, textTransform: 'uppercase' }}>Lucro previsto</div>
        <div style={{ fontSize: '2.05rem', fontWeight: 950, marginTop: '6px' }}>{formatCurrency(lucroPrevisto)}</div>
        <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '4px' }}>{marginPercent.toFixed(1)}% de margem sobre comandas do periodo</div>
        <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '4px' }}>Lucro concluido: {formatCurrency(lucroConcluido)} · Lucro recebido: {formatCurrency(lucroRecebido)}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Previsto', value: formatCurrency(faturamentoPrevisto), color: '#10b981' },
          { label: 'Resultado estudio', value: formatCurrency(studioResult), color: '#06b6d4' },
          { label: 'Recebido', value: formatCurrency(totalRecebido), color: '#10b981' },
          { label: 'Em aberto', value: formatCurrency(totalEmAberto), color: '#f59e0b' },
          { label: 'Repasse prof.', value: formatCurrency(totalCommissionPayout), color: '#f59e0b' },
          { label: 'Aluguel recebido', value: formatCurrency(totalRentShare), color: '#10b981' },
          { label: 'Custos', value: formatCurrency(custosPrevistos), color: '#ef4444' },
          { label: 'Ticket medio', value: formatCurrency(ticketMedio), color: textMain },
          { label: 'Comandas', value: payableAppointments.length, color: textMain }
        ].map((card) => (
          <div key={card.label} style={{ background: bgCard, borderRadius: '14px', padding: '14px', border: `1px solid ${borderCol}` }}>
            <div style={{ fontSize: '0.75rem', color: textSec, fontWeight: 800, textTransform: 'uppercase' }}>{card.label}</div>
            <div style={{ fontSize: '1.16rem', fontWeight: 900, color: card.color, marginTop: '5px' }}>{card.value}</div>
          </div>
        ))}
      </div>

      <section style={{ background: bgCard, borderRadius: '14px', padding: '14px', border: `1px solid ${borderCol}`, marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 12px', color: textMain, fontSize: '1rem', fontWeight: 900 }}>Status do periodo</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} style={{ border: `1px solid ${borderCol}`, borderLeft: `4px solid ${config.color}`, borderRadius: '10px', padding: '10px' }}>
              <div style={{ color: textSec, fontSize: '0.72rem', fontWeight: 800 }}>{config.label}</div>
              <strong style={{ color: textMain, fontSize: '1.15rem' }}>{statusCounts[status] || 0}</strong>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: bgCard, borderRadius: '14px', padding: '14px', border: `1px solid ${borderCol}`, marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 12px', color: textMain, fontSize: '1rem', fontWeight: 900 }}>Pagamentos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
          {[
            { id: 'aberto', color: '#f59e0b' },
            { id: 'sinal', color: '#3b82f6' },
            { id: 'pago', color: '#10b981' }
          ].map((item) => (
            <div key={item.id} style={{ border: `1px solid ${borderCol}`, borderLeft: `4px solid ${item.color}`, borderRadius: '10px', padding: '10px' }}>
              <div style={{ color: textSec, fontSize: '0.72rem', fontWeight: 800 }}>{paymentStatusLabel[item.id]}</div>
              <strong style={{ color: textMain, fontSize: '1.15rem' }}>{paymentStatusCounts[item.id] || 0}</strong>
            </div>
          ))}
        </div>

        {paymentMethodRows.length === 0 ? (
          <div style={{ color: textSec, fontSize: '0.84rem', textAlign: 'center', padding: '14px' }}>Nenhum recebimento registrado.</div>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {paymentMethodRows.map((item) => (
              <div key={item.method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '10px', border: `1px solid ${borderCol}`, borderRadius: '10px' }}>
                <span style={{ color: textMain, fontWeight: 900 }}>{paymentMethodLabel[item.method] || item.method}</span>
                <span style={{ color: '#10b981', fontWeight: 900 }}>{formatCurrency(item.paid)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ background: bgCard, borderRadius: '14px', padding: '14px', border: `1px solid ${borderCol}`, marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 12px', color: textMain, fontSize: '1rem', fontWeight: 900 }}>A receber</h3>
        {openReceivables.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '22px', color: textSec, border: `1px dashed ${borderCol}`, borderRadius: '12px' }}>Nenhuma pendencia de pagamento neste periodo.</div>
        ) : (
          openReceivables.slice(0, 12).map((appointment) => {
            const professional = professionals.find((item) => item.id === appointment.professional_id)
            return (
              <div key={appointment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '11px 0', borderBottom: `1px solid ${borderCol}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: textMain, fontWeight: 900, fontSize: '0.9rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{appointment.client_name || 'Cliente'}</div>
                  <div style={{ color: textSec, fontSize: '0.76rem', marginTop: '2px' }}>{shortDate(appointment.date)} · {appointment.service}</div>
                  <div style={{ color: textSec, fontSize: '0.72rem', marginTop: '2px' }}>{professional?.name || 'Profissional'} · {paymentStatusLabel[appointment.payment_status] || 'Pagamento'}</div>
                </div>
                <strong style={{ color: '#f59e0b', flexShrink: 0 }}>{formatCurrency(getOpenAmount(appointment))}</strong>
              </div>
            )
          })
        )}
      </section>

      <section style={{ background: bgCard, borderRadius: '14px', padding: '14px', border: `1px solid ${borderCol}`, marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 12px', color: textMain, fontSize: '1rem', fontWeight: 900 }}>Estoque financeiro</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div style={{ border: `1px solid ${borderCol}`, borderRadius: '10px', padding: '10px' }}>
            <div style={{ color: textSec, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>Custo em estoque</div>
            <strong style={{ color: '#ef4444', fontSize: '1.05rem' }}>{formatCurrency(stockCostValue)}</strong>
          </div>
          <div style={{ border: `1px solid ${borderCol}`, borderRadius: '10px', padding: '10px' }}>
            <div style={{ color: textSec, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>Potencial venda</div>
            <strong style={{ color: '#10b981', fontSize: '1.05rem' }}>{formatCurrency(stockSaleValue)}</strong>
          </div>
        </div>

        {lowStockProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '18px', color: textSec, border: `1px dashed ${borderCol}`, borderRadius: '12px' }}>Nenhum produto com estoque baixo.</div>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {lowStockProducts.slice(0, 8).map((product) => (
              <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '10px', border: `1px solid ${borderCol}`, borderLeft: '4px solid #f59e0b', borderRadius: '10px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: textMain, fontWeight: 900, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                  <div style={{ color: textSec, fontSize: '0.74rem', marginTop: '2px' }}>Custo {formatCurrency(product.cost)} · Venda {formatCurrency(product.price)}</div>
                </div>
                <strong style={{ color: '#f59e0b', flexShrink: 0 }}>{product.stock_quantity || 0} un.</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ background: bgCard, borderRadius: '14px', padding: '14px', border: `1px solid ${borderCol}`, marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 6px', color: textMain, fontSize: '1rem', fontWeight: 900 }}>Regras das profissionais</h3>
        <p style={{ color: textSec, fontSize: '0.78rem', margin: '0 0 12px' }}>
          Configure como cada profissional entra no resultado do estudio.
        </p>

        <div style={{ display: 'grid', gap: '12px' }}>
          {professionals.map((professional) => {
            const draft = compDrafts[professional.id] || {
              compensation_type: professional.compensation_type || 'studio',
              commission_percent: professional.commission_percent ?? 0,
              monthly_rent_share: professional.monthly_rent_share ?? 0
            }

            return (
              <div key={professional.id} style={{ border: `1px solid ${borderCol}`, borderRadius: '12px', padding: '12px', display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                  <strong style={{ color: textMain }}>{professional.name}</strong>
                  <span style={{ color: textSec, fontSize: '0.72rem', fontWeight: 800 }}>{compensationTypeLabel[draft.compensation_type] || 'Regra'}</span>
                </div>

                <select
                  value={draft.compensation_type}
                  onChange={(event) => handleCompDraftChange(professional.id, { compensation_type: event.target.value })}
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgInput, color: textMain, outline: 'none', fontWeight: 800 }}
                >
                  <option value="studio">Estudio fica com o faturamento</option>
                  <option value="commission">Porcentagem profissional/estudio</option>
                  <option value="rent_share">Aluguel / divisao de custo mensal</option>
                </select>

                {draft.compensation_type === 'commission' && (
                  <label style={{ color: textSec, fontSize: '0.78rem', fontWeight: 800 }}>
                    % da profissional
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={draft.commission_percent}
                      onChange={(event) => handleCompDraftChange(professional.id, { commission_percent: event.target.value })}
                      style={{ width: '100%', marginTop: '6px', padding: '11px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgInput, color: textMain, outline: 'none' }}
                    />
                  </label>
                )}

                {draft.compensation_type === 'rent_share' && (
                  <label style={{ color: textSec, fontSize: '0.78rem', fontWeight: 800 }}>
                    Valor mensal pago ao estudio
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.monthly_rent_share}
                      onChange={(event) => handleCompDraftChange(professional.id, { monthly_rent_share: event.target.value })}
                      style={{ width: '100%', marginTop: '6px', padding: '11px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgInput, color: textMain, outline: 'none' }}
                    />
                  </label>
                )}

                <button
                  type="button"
                  onClick={() => handleSaveCompensation(professional.id)}
                  disabled={savingProfessionalId === professional.id}
                  style={{ border: 'none', borderRadius: '8px', padding: '11px', background: 'var(--primary-color, #e91e63)', color: '#fff', fontWeight: 900, cursor: 'pointer', opacity: savingProfessionalId === professional.id ? 0.7 : 1 }}
                >
                  {savingProfessionalId === professional.id ? 'Salvando...' : 'Salvar regra'}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section style={{ background: bgCard, borderRadius: '14px', padding: '14px', border: `1px solid ${borderCol}`, marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 12px', color: textMain, fontSize: '1rem', fontWeight: 900 }}>Desempenho por profissional</h3>

        {professionalFinanceRows.length === 0 || faturamentoPrevisto === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: textSec }}>Sem comandas neste periodo.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...professionalFinanceRows].sort((a, b) => b.revenue - a.revenue).map((item) => (
              <div key={item.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: textMain, fontSize: '0.88rem', fontWeight: 900 }}>
                  <span>{item.name}</span>
                  <span>{formatCurrency(item.revenue)}</span>
                </div>
                <div style={{ height: '8px', background: isLight ? '#eee' : '#2f2f2f', borderRadius: '999px', overflow: 'hidden', marginTop: '7px' }}>
                  <div style={{ width: `${Math.max((item.revenue / maxRevenue) * 100, 4)}%`, height: '100%', background: 'var(--primary-color, #e91e63)', borderRadius: '999px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: textSec, fontSize: '0.76rem', marginTop: '5px' }}>
                  <span>{item.count} comandas · recebido {formatCurrency(item.received)}</span>
                  <span>Studio {formatCurrency(item.studioResult)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 style={{ margin: '0 0 12px', color: textMain, fontSize: '1rem', fontWeight: 900 }}>Ultimas comandas</h3>
        {payableAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: textSec, background: bgCard, borderRadius: '12px', border: `1px dashed ${borderCol}` }}>Nenhuma comanda neste periodo.</div>
        ) : (
          payableAppointments.slice(0, 12).map((appointment) => {
            const professional = professionals.find((item) => item.id === appointment.professional_id)
            return (
              <div key={appointment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: bgCard, padding: '13px', borderRadius: '12px', border: `1px solid ${borderCol}`, marginBottom: '10px', gap: '12px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900, color: textMain, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appointment.client_name}</div>
                  <div style={{ fontSize: '0.78rem', color: textSec, marginTop: '2px' }}>{shortDate(appointment.date)} - {appointment.service}</div>
                  <div style={{ fontSize: '0.74rem', color: textSec, marginTop: '2px' }}>{professional?.name || 'Profissional'} · {statusConfig[appointment.status]?.label || appointment.status}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 900, color: '#10b981' }}>{formatCurrency(appointment.total_price)}</div>
                  <div style={{ fontSize: '0.74rem', color: textSec }}>Recebido {formatCurrency(getPaidAmount(appointment))}</div>
                  <div style={{ fontSize: '0.74rem', color: getOpenAmount(appointment) > 0 ? '#f59e0b' : textSec }}>Aberto {formatCurrency(getOpenAmount(appointment))}</div>
                </div>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
