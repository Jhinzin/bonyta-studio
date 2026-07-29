export const onlyDigits = (value) => String(value || '').replace(/\D/g, '')

export const normalizeBrazilWhatsApp = (phone) => {
  const digits = onlyDigits(phone)
  if (!digits) return ''
  if (digits.startsWith('55')) return digits
  return `55${digits}`
}

export const buildWhatsAppUrl = (phone, message) => {
  const normalizedPhone = normalizeBrazilWhatsApp(phone)
  const encodedMessage = encodeURIComponent(message)
  return normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`
}

export const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'tudo bem'

export const formatShortDatePt = (date) => {
  if (!date) return 'data combinada'
  const parsed = new Date(`${date}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export const formatLongDatePt = (date) => {
  if (!date) return 'data combinada'
  const parsed = new Date(`${date}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  })
}

export const formatCurrencyPt = (value) => (
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
)

export const appointmentMessageTemplates = {
  confirmacao: ({ clientName, date, time, service, professional, totalPrice, depositAmount }) => (
    `Olá, ${firstName(clientName)}! Aqui é do Bonyta Studio 💖\n\n` +
    `Passando para confirmar seu horário:\n` +
    `• Serviço: ${service || 'atendimento'}\n` +
    `• Data: ${formatLongDatePt(date)}\n` +
    `• Horário: ${String(time || '').slice(0, 5) || 'a combinar'}\n` +
    `• Profissional: ${professional || 'equipe Bonyta'}\n\n` +
    (Number(totalPrice || 0) > 0
      ? `Para reservar, o sinal de 30% fica em ${formatCurrencyPt(depositAmount || Number(totalPrice) * 0.3)} e é abatido no valor final de ${formatCurrencyPt(totalPrice)}.\n\n`
      : '') +
    `Pode confirmar presença pra gente?`
  ),
  lembrete: ({ clientName, date, time, service }) => (
    `Oi, ${firstName(clientName)}! Passando para lembrar do seu horário no Bonyta Studio 💅\n\n` +
    `${service || 'Atendimento'} em ${formatShortDatePt(date)} às ${String(time || '').slice(0, 5) || 'a combinar'}.\n\n` +
    `Estamos te esperando! Se precisar reagendar, chama a gente por aqui.`
  ),
  reagendamento: ({ clientName, service }) => (
    `Oi, ${firstName(clientName)}! Aqui é do Bonyta Studio 💖\n\n` +
    `Sobre seu horário de ${service || 'atendimento'}, precisamos alinhar uma nova opção com você.\n` +
    `Pode nos dizer qual melhor dia e período para reagendar?`
  ),
  posAtendimento: ({ clientName }) => (
    `Oi, ${firstName(clientName)}! Obrigada por vir ao Bonyta Studio hoje 💖\n\n` +
    `A gente amou cuidar de você. Se puder, manda uma foto do resultado e conta como ficou sua experiência.`
  ),
  manutencao: ({ clientName, service, maintenanceDays }) => (
    `Oi, ${firstName(clientName)}! Tudo bem? Aqui é do Bonyta Studio 💖\n\n` +
    `Já faz cerca de ${maintenanceDays || 20} dias do seu atendimento de ${service || 'beleza'}. ` +
    `Esse costuma ser um bom momento para fazer a manutenção e manter o resultado bonito.\n\n` +
    `Quer que eu te envie os horários disponíveis?`
  ),
  reativacao: ({ clientName }) => (
    `Oi, ${firstName(clientName)}! Tudo bem? Aqui é do Bonyta Studio 💖\n\n` +
    `Passamos para dizer que sentimos sua falta por aqui. ` +
    `Quando quiser reservar um momento para você, posso te ajudar a encontrar um horário que fique bom.\n\n` +
    `Quer ver as próximas disponibilidades?`
  )
}
