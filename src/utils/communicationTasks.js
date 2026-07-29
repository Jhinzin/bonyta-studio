const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay = (value) => {
  const date = value instanceof Date ? new Date(value) : new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

const appointmentDateTime = (appointment) => {
  if (!appointment?.date) return null
  const time = String(appointment.time || '12:00').slice(0, 5)
  const parsed = new Date(`${appointment.date}T${time}:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()

export const getMaintenanceRule = (serviceName) => {
  const service = normalizeText(serviceName)

  if (/(cilio|lash|volume|sphinx|fox|bloom|amabbi|lux|catwalk|pipoca)/.test(service)) {
    return { category: 'Cílios', days: 20 }
  }

  if (/(unha|nail|fibra|molde|f1|banho de gel|esmaltacao|reconstrucao|postica)/.test(service)) {
    return { category: 'Unhas', days: 21 }
  }

  if (/(sobrancelha|brow|design|henna|lamination|depilacao)/.test(service)) {
    return { category: 'Sobrancelhas', days: 30 }
  }

  return { category: 'Retorno', days: 30 }
}

const hasAppointmentLog = (logs, appointmentId, messageType) => logs.some((log) => (
  String(log.appointment_id || '') === String(appointmentId || '')
  && log.message_type === messageType
  && log.status !== 'failed'
))

const hasClientLogAfter = (logs, clientId, messageType, date) => logs.some((log) => {
  if (String(log.client_id || '') !== String(clientId || '') || log.message_type !== messageType || log.status === 'failed') {
    return false
  }
  const sentAt = new Date(log.sent_at || log.created_at)
  return !Number.isNaN(sentAt.getTime()) && sentAt >= date
})

const clientFor = (clients, appointment) => clients.find((client) => (
  String(client.id) === String(appointment.client_id)
))

const professionalFor = (professionals, appointment) => professionals.find((professional) => (
  String(professional.id) === String(appointment.professional_id)
))

const makeTask = ({ type, dueAt, appointment, client, professional, title, description, priority, maintenanceDays }) => ({
  id: `${type}:${appointment?.id || client?.id}`,
  type,
  messageType: type,
  dueAt,
  appointment,
  client,
  professional,
  title,
  description,
  priority,
  maintenanceDays
})

export const buildCommunicationTasks = ({
  appointments = [],
  clients = [],
  professionals = [],
  messageLogs = [],
  now = new Date()
}) => {
  const currentTime = now.getTime()
  const today = startOfDay(now)
  const tasks = []
  const validAppointments = appointments.filter((appointment) => (
    !appointment.is_block
    && appointment.status !== 'cancelado'
    && appointmentDateTime(appointment)
  ))

  validAppointments.forEach((appointment) => {
    const scheduledAt = appointmentDateTime(appointment)
    const client = clientFor(clients, appointment)
    const professional = professionalFor(professionals, appointment)
    const clientName = client?.name || appointment.client_name || 'Cliente'

    if (scheduledAt.getTime() >= currentTime && appointment.status === 'pendente' && !hasAppointmentLog(messageLogs, appointment.id, 'confirmacao')) {
      tasks.push(makeTask({
        type: 'confirmacao',
        dueAt: now,
        appointment,
        client,
        professional,
        title: `Confirmar com ${clientName}`,
        description: `${appointment.service || 'Atendimento'} ainda está pendente.`,
        priority: 1
      }))
    }

    const reminderAt = new Date(scheduledAt.getTime() - DAY_MS)
    const reminderLimit = new Date(scheduledAt.getTime() + 30 * 60 * 1000)
    if (
      reminderAt.getTime() <= currentTime
      && currentTime <= reminderLimit.getTime()
      && !hasAppointmentLog(messageLogs, appointment.id, 'lembrete')
    ) {
      tasks.push(makeTask({
        type: 'lembrete',
        dueAt: reminderAt,
        appointment,
        client,
        professional,
        title: `Lembrete para ${clientName}`,
        description: `Atendimento em até 24 horas.`,
        priority: 0
      }))
    }
  })

  const latestCompletedByClientCategory = new Map()
  validAppointments
    .filter((appointment) => appointment.status === 'concluido')
    .forEach((appointment) => {
      const scheduledAt = appointmentDateTime(appointment)
      const rule = getMaintenanceRule(appointment.service)
      const key = `${appointment.client_id || appointment.client_name}:${rule.category}`
      const previous = latestCompletedByClientCategory.get(key)
      if (!previous || appointmentDateTime(previous).getTime() < scheduledAt.getTime()) {
        latestCompletedByClientCategory.set(key, appointment)
      }
    })

  latestCompletedByClientCategory.forEach((appointment) => {
    const client = clientFor(clients, appointment)
    const professional = professionalFor(professionals, appointment)
    const scheduledAt = appointmentDateTime(appointment)
    const rule = getMaintenanceRule(appointment.service)
    const dueAt = startOfDay(new Date(scheduledAt.getTime() + rule.days * DAY_MS))
    const hasFutureAppointment = validAppointments.some((candidate) => (
      String(candidate.client_id || '') === String(appointment.client_id || '')
      && appointmentDateTime(candidate).getTime() > currentTime
    ))

    if (
      dueAt.getTime() <= today.getTime()
      && !hasFutureAppointment
      && !hasAppointmentLog(messageLogs, appointment.id, 'manutencao')
    ) {
      const clientName = client?.name || appointment.client_name || 'Cliente'
      tasks.push(makeTask({
        type: 'manutencao',
        dueAt,
        appointment,
        client,
        professional,
        title: `Manutenção de ${clientName}`,
        description: `${rule.category}: retorno sugerido após ${rule.days} dias.`,
        priority: 2,
        maintenanceDays: rule.days
      }))
    }
  })

  const latestCompletedByClient = new Map()
  validAppointments
    .filter((appointment) => appointment.status === 'concluido')
    .forEach((appointment) => {
      const key = String(appointment.client_id || appointment.client_name || appointment.id)
      const previous = latestCompletedByClient.get(key)
      if (!previous || appointmentDateTime(previous).getTime() < appointmentDateTime(appointment).getTime()) {
        latestCompletedByClient.set(key, appointment)
      }
    })

  latestCompletedByClient.forEach((appointment) => {
    const scheduledAt = appointmentDateTime(appointment)
    const dueAt = startOfDay(new Date(scheduledAt.getTime() + 30 * DAY_MS))
    const client = clientFor(clients, appointment)
    const professional = professionalFor(professionals, appointment)
    const clientKey = appointment.client_id || client?.id
    const hasFutureAppointment = validAppointments.some((candidate) => (
      String(candidate.client_id || '') === String(clientKey || '')
      && appointmentDateTime(candidate).getTime() > currentTime
    ))
    const alreadyCoveredByMaintenance = tasks.some((task) => (
      task.type === 'manutencao'
      && String(task.client?.id || task.appointment?.client_id || '') === String(clientKey || '')
    )) || hasClientLogAfter(messageLogs, clientKey, 'manutencao', scheduledAt)

    if (
      dueAt.getTime() <= today.getTime()
      && !hasFutureAppointment
      && !alreadyCoveredByMaintenance
      && !hasClientLogAfter(messageLogs, clientKey, 'reativacao', scheduledAt)
    ) {
      const clientName = client?.name || appointment.client_name || 'Cliente'
      tasks.push(makeTask({
        type: 'reativacao',
        dueAt,
        appointment,
        client,
        professional,
        title: `${clientName} está há 30+ dias sem vir`,
        description: `Último atendimento: ${appointment.service || 'atendimento'}.`,
        priority: 3
      }))
    }
  })

  return tasks.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return a.dueAt.getTime() - b.dueAt.getTime()
  })
}
