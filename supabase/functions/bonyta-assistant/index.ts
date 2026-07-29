import { createClient } from 'npm:@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org'
const TIME_ZONE = 'America/Sao_Paulo'

type AssistantTask = {
  id: string
  task_type: 'new_booking' | 'appointment_reminder' | 'maintenance' | 'weekly_report'
  client_id: string | null
  appointment_id: string | null
  professional_id: string | null
  due_at: string
  status: string
  payload: Record<string, unknown>
  attempts: number
  client?: { id: string; name: string; phone: string | null } | null
  appointment?: {
    id: string
    client_name: string | null
    service: string | null
    date: string
    time: string | null
    total_price: number | null
  } | null
  professional?: { id: string; name: string } | null
}

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' }
})

const getSecretKey = () => {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (legacy) return legacy

  const rawKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (!rawKeys) return ''

  try {
    const parsed = JSON.parse(rawKeys)
    return parsed.default || Object.values(parsed)[0] || ''
  } catch {
    return ''
  }
}

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const onlyDigits = (value: unknown) => String(value ?? '').replace(/\D/g, '')

const normalizeBrazilPhone = (value: unknown) => {
  const digits = onlyDigits(value)
  if (!digits) return ''
  return digits.startsWith('55') ? digits : `55${digits}`
}

const firstName = (value: unknown) => String(value ?? '').trim().split(/\s+/)[0] || 'cliente'

const formatDate = (date: string) => {
  if (!date) return 'data não informada'
  return new Date(`${date}T12:00:00-03:00`).toLocaleDateString('pt-BR', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  })
}

const formatShortDate = (date: string) => {
  if (!date) return ''
  return new Date(`${date}T12:00:00-03:00`).toLocaleDateString('pt-BR', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit'
  })
}

const formatTime = (time: string | null | undefined) => String(time || '').slice(0, 5) || 'a combinar'

const telegramRequest = async (token: string, method: string, payload: Record<string, unknown>) => {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const result = await response.json()
  if (!response.ok || !result.ok) {
    throw new Error(result.description || `Telegram respondeu com ${response.status}`)
  }
  return result.result
}

const messageTypeForTask = (taskType: AssistantTask['task_type']) => {
  if (taskType === 'new_booking') return 'confirmacao'
  if (taskType === 'appointment_reminder') return 'lembrete'
  if (taskType === 'maintenance') return 'manutencao'
  return taskType
}

const externalWhatsAppMessage = (task: AssistantTask) => {
  const clientName = task.client?.name || task.appointment?.client_name || 'cliente'
  const service = task.appointment?.service || 'atendimento'
  const date = task.appointment?.date || ''
  const time = task.appointment?.time

  if (task.task_type === 'new_booking') {
    return [
      `Olá, ${firstName(clientName)}! Aqui é do Bonyta Studio 💖`,
      '',
      'Recebemos seu agendamento:',
      `• Serviço: ${service}`,
      `• Data: ${formatDate(date)}`,
      `• Horário: ${formatTime(time)}`,
      `• Profissional: ${task.professional?.name || 'equipe Bonyta'}`,
      '',
      'Podemos confirmar seu horário e combinar o sinal?'
    ].join('\n')
  }

  if (task.task_type === 'appointment_reminder') {
    return [
      `Oi, ${firstName(clientName)}! Passando para lembrar do seu horário no Bonyta Studio 💖`,
      '',
      `${service} em ${formatDate(date)} às ${formatTime(time)}.`,
      '',
      'Está tudo certo para o seu atendimento? Se precisar reagendar, chama a gente por aqui.'
    ].join('\n')
  }

  const days = Number(task.payload?.maintenance_days || 20)
  return [
    `Oi, ${firstName(clientName)}! Tudo bem? Aqui é do Bonyta Studio 💖`,
    '',
    `Já faz cerca de ${days} dias do seu atendimento de ${service}.`,
    'Esse costuma ser um bom momento para fazer a manutenção e manter o resultado bonito.',
    '',
    'Quer que eu te envie os horários disponíveis?'
  ].join('\n')
}

const whatsappUrlForTask = (task: AssistantTask) => {
  const phone = normalizeBrazilPhone(task.client?.phone)
  if (!phone) return null
  return `https://wa.me/${phone}?text=${encodeURIComponent(externalWhatsAppMessage(task))}`
}

const taskTelegramText = (task: AssistantTask) => {
  const clientName = task.client?.name || task.appointment?.client_name || 'Cliente'
  const service = task.appointment?.service || 'Atendimento'
  const phone = task.client?.phone || 'não cadastrado'
  const professional = task.professional?.name || 'Equipe Bonyta'

  if (task.task_type === 'new_booking') {
    return [
      '<b>🎉 Novo agendamento!</b>',
      '',
      `👤 <b>Cliente:</b> ${escapeHtml(clientName)}`,
      `💅 <b>Serviço:</b> ${escapeHtml(service)}`,
      `👩‍🎨 <b>Profissional:</b> ${escapeHtml(professional)}`,
      `📅 <b>Data:</b> ${escapeHtml(formatDate(task.appointment?.date || ''))} · ${escapeHtml(formatTime(task.appointment?.time))}`,
      `📱 <b>WhatsApp:</b> ${escapeHtml(phone)}`,
      '',
      'Sua agenda foi atualizada automaticamente.'
    ].join('\n')
  }

  if (task.task_type === 'appointment_reminder') {
    return [
      `<b>⏰ Lembrete: chamar ${escapeHtml(firstName(clientName))}</b>`,
      '',
      `💅 <b>Serviço:</b> ${escapeHtml(service)}`,
      `📅 <b>Atendimento:</b> ${escapeHtml(formatDate(task.appointment?.date || ''))} · ${escapeHtml(formatTime(task.appointment?.time))}`,
      `👩‍🎨 <b>Profissional:</b> ${escapeHtml(professional)}`,
      `📱 <b>WhatsApp:</b> ${escapeHtml(phone)}`,
      '',
      'Abra a mensagem pronta e depois marque a cliente como contatada.'
    ].join('\n')
  }

  const days = Number(task.payload?.maintenance_days || 20)
  return [
    `<b>🔔 Hora de chamar ${escapeHtml(firstName(clientName))} para manutenção!</b>`,
    '',
    `💅 <b>Serviço original:</b> ${escapeHtml(service)}`,
    `📅 <b>Atendimento:</b> ${escapeHtml(formatDate(task.appointment?.date || ''))}`,
    `⏳ <b>Retorno sugerido:</b> ${days} dias`,
    `📱 <b>WhatsApp:</b> ${escapeHtml(phone)}`,
    '',
    'Abra a mensagem pronta e depois marque a cliente como contatada.'
  ].join('\n')
}

const buildWeeklyReport = async (supabaseAdmin: ReturnType<typeof createClient>, task: AssistantTask) => {
  const startDate = String(task.payload?.start_date || '')
  const endDate = String(task.payload?.end_date || '')

  const [appointmentsResult, retentionResult] = await Promise.all([
    supabaseAdmin
      .from('appointments')
      .select('date,time,client_name,service,professional:professionals(name)')
      .eq('is_block', false)
      .neq('status', 'cancelado')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('time'),
    supabaseAdmin
      .from('assistant_tasks')
      .select('due_at,client:clients(name),appointment:appointments(service)')
      .eq('task_type', 'maintenance')
      .in('status', ['pending', 'sent', 'failed'])
      .gte('due_at', `${startDate}T00:00:00-03:00`)
      .lte('due_at', `${endDate}T23:59:59-03:00`)
      .order('due_at')
      .limit(12)
  ])

  if (appointmentsResult.error) throw appointmentsResult.error
  if (retentionResult.error) throw retentionResult.error

  const appointments = appointmentsResult.data || []
  const retention = retentionResult.data || []
  const agendaLines = appointments.length
    ? appointments.map((appointment) => (
      `• ${formatShortDate(appointment.date)} ${formatTime(appointment.time)} — ${escapeHtml(appointment.client_name || 'Cliente')} (${escapeHtml(appointment.service || 'Atendimento')})`
    ))
    : ['• Nenhum atendimento marcado.']
  const retentionLines = retention.length
    ? retention.map((item) => {
      const dueDate = new Date(item.due_at).toLocaleDateString('pt-BR', { timeZone: TIME_ZONE, day: '2-digit', month: '2-digit' })
      return `• ${dueDate} — ${escapeHtml(item.client?.name || 'Cliente')} (${escapeHtml(item.appointment?.service || 'retorno')})`
    })
    : ['• Nenhuma manutenção pendente.']

  return [
    `<b>📋 Relatório · Semana de ${formatShortDate(startDate)} a ${formatShortDate(endDate)}</b>`,
    '',
    `<b>🗓 Agenda de terça a sábado (${appointments.length})</b>`,
    ...agendaLines,
    '',
    `<b>🔔 Radar de retenção (${retention.length})</b>`,
    ...retentionLines,
    '',
    'Boa semana e boas vendas! 💛'
  ].join('\n')
}

const dispatchTasks = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  telegramToken: string,
  chatId: string
) => {
  const { error: refreshError } = await supabaseAdmin.rpc('refresh_bonyta_assistant_tasks')
  if (refreshError) throw refreshError

  const { data, error } = await supabaseAdmin
    .from('assistant_tasks')
    .select(`
      *,
      client:clients(id,name,phone),
      appointment:appointments(id,client_name,service,date,time,total_price),
      professional:professionals(id,name)
    `)
    .in('status', ['pending', 'failed'])
    .lt('attempts', 3)
    .lte('due_at', new Date().toISOString())
    .order('due_at')
    .limit(20)

  if (error) throw error

  const results = []
  for (const task of (data || []) as AssistantTask[]) {
    try {
      const text = task.task_type === 'weekly_report'
        ? await buildWeeklyReport(supabaseAdmin, task)
        : taskTelegramText(task)
      const whatsappUrl = task.task_type === 'weekly_report' ? null : whatsappUrlForTask(task)
      const inlineKeyboard = whatsappUrl
        ? [[
          { text: '📲 Abrir no WhatsApp', url: whatsappUrl },
          { text: '✅ Marcar como contatada', callback_data: `done:${task.id}` }
        ]]
        : undefined

      const telegramMessage = await telegramRequest(telegramToken, 'sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...(inlineKeyboard ? { reply_markup: { inline_keyboard: inlineKeyboard } } : {})
      })

      await supabaseAdmin
        .from('assistant_tasks')
        .update({
          status: task.task_type === 'weekly_report' ? 'completed' : 'sent',
          telegram_message_id: telegramMessage.message_id,
          sent_at: new Date().toISOString(),
          completed_at: task.task_type === 'weekly_report' ? new Date().toISOString() : null,
          attempts: Number(task.attempts || 0) + 1,
          last_error: null,
          payload: { ...(task.payload || {}), telegram_text_html: text }
        })
        .eq('id', task.id)

      results.push({ id: task.id, status: 'sent' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await supabaseAdmin
        .from('assistant_tasks')
        .update({
          status: 'failed',
          attempts: Number(task.attempts || 0) + 1,
          last_error: message
        })
        .eq('id', task.id)
      results.push({ id: task.id, status: 'failed', error: message })
    }
  }

  return results
}

const handleTelegramUpdate = async (
  update: Record<string, any>,
  supabaseAdmin: ReturnType<typeof createClient>,
  telegramToken: string,
  configuredChatId: string
) => {
  const message = update.message
  if (message?.text === '/start') {
    if (String(message.chat?.id) !== String(configuredChatId)) return { ignored: true }
    await telegramRequest(telegramToken, 'sendMessage', {
      chat_id: configuredChatId,
      text: '<b>✨ Bonyta Assistant ativado!</b>\n\nVou avisar sobre novos agendamentos, confirmações, manutenções e a agenda de terça a sábado.',
      parse_mode: 'HTML'
    })
    return { started: true }
  }

  const callback = update.callback_query
  if (!callback?.data?.startsWith('done:')) return { ignored: true }
  if (String(callback.message?.chat?.id) !== String(configuredChatId)) return { ignored: true }

  const taskId = callback.data.slice('done:'.length)
  const { data: task, error } = await supabaseAdmin
    .from('assistant_tasks')
    .select(`
      *,
      client:clients(id,name,phone),
      appointment:appointments(id,client_name,service,date,time,total_price),
      professional:professionals(id,name)
    `)
    .eq('id', taskId)
    .single()

  if (error || !task) throw error || new Error('Tarefa não encontrada.')

  const completedAt = new Date().toISOString()
  const completedBy = callback.from?.first_name || 'equipe'
  const originalText = task.payload?.telegram_text_html || taskTelegramText(task as AssistantTask)

  await supabaseAdmin
    .from('assistant_tasks')
    .update({ status: 'completed', completed_at: completedAt })
    .eq('id', taskId)

  await supabaseAdmin.from('message_logs').insert({
    client_id: task.client_id,
    appointment_id: task.appointment_id,
    professional_id: task.professional_id,
    message_type: messageTypeForTask(task.task_type),
    channel: 'telegram_assistant',
    recipient_name: task.client?.name || task.appointment?.client_name,
    recipient_phone: task.client?.phone,
    message_body: externalWhatsAppMessage(task as AssistantTask),
    status: 'sent',
    sent_at: completedAt
  })

  await Promise.all([
    telegramRequest(telegramToken, 'answerCallbackQuery', {
      callback_query_id: callback.id,
      text: 'Cliente marcada como contatada ✅'
    }),
    telegramRequest(telegramToken, 'editMessageText', {
      chat_id: configuredChatId,
      message_id: callback.message.message_id,
      text: `${originalText}\n\n<b>✅ Cliente contatada por ${escapeHtml(completedBy)}</b>`,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  ])

  return { completed: taskId }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Use POST.' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const secretKey = getSecretKey()
  const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || ''
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID') || ''
  const webhookSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') || ''
  const cronSecret = Deno.env.get('ASSISTANT_CRON_SECRET') || ''

  if (!supabaseUrl || !secretKey || !telegramToken || !chatId) {
    return jsonResponse({ error: 'Configuração incompleta do Bonyta Assistant.' }, 500)
  }

  const body = await request.json().catch(() => ({}))
  const supabaseAdmin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  try {
    if (body.update_id) {
      const providedSecret = request.headers.get('x-telegram-bot-api-secret-token') || ''
      if (!webhookSecret || providedSecret !== webhookSecret) {
        return jsonResponse({ error: 'Webhook inválido.' }, 401)
      }
      const result = await handleTelegramUpdate(body, supabaseAdmin, telegramToken, chatId)
      return jsonResponse({ ok: true, result })
    }

    const providedCronSecret = request.headers.get('x-assistant-secret') || ''
    if (!cronSecret || providedCronSecret !== cronSecret) {
      return jsonResponse({ error: 'Chamada não autorizada.' }, 401)
    }

    if (body.action === 'test') {
      await telegramRequest(telegramToken, 'sendMessage', {
        chat_id: chatId,
        text: '<b>✅ Bonyta Assistant conectado!</b>\n\nAgenda, manutenções e relatório semanal estão prontos para funcionar.',
        parse_mode: 'HTML'
      })
      return jsonResponse({ ok: true, tested: true })
    }

    const result = await dispatchTasks(supabaseAdmin, telegramToken, chatId)
    return jsonResponse({ ok: true, dispatched: result })
  } catch (error) {
    console.error(error)
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500)
  }
})
