import { buildWhatsAppUrl } from './whatsapp.js'

export const DEFAULT_STUDIO_PHONE = import.meta.env.VITE_WHATSAPP_NUMBER || '5511999999999'

/**
 * Mensagem de confirmação de agendamento com opção de sinal PIX
 */
export const buildConfirmationMsg = ({
  customerName,
  serviceName,
  professionalName,
  dateFormatted,
  timeSlot,
  depositAmount,
  pixKey
}) => {
  return [
    `Olá, ${customerName}! ✨`,
    `Seu agendamento na *Bonyta Studio* está pré-confirmado! 💖`,
    '',
    `💅 *Serviço:* ${serviceName || 'Atendimento Bonyta'}`,
    `👑 *Profissional:* ${professionalName || 'Equipe Bonyta'}`,
    `📅 *Data:* ${dateFormatted}`,
    `⏰ *Horário:* ${timeSlot || 'Horário a definir'}`,
    depositAmount ? `💳 *Sinal de Agendamento:* R$ ${depositAmount}` : '',
    pixKey ? `🔑 *Chave PIX:* ${pixKey}` : '',
    '',
    'Por favor, confirme se está tudo certo ou envie o comprovante do sinal para garantirmos a sua vaga! 🥰',
    '',
    '📍 *Local:* Vila Maria - São Paulo/SP'
  ].filter(Boolean).join('\n')
}

/**
 * Lembrete automático de 24 horas antes do agendamento
 */
export const build24hReminderMsg = ({
  customerName,
  serviceName,
  professionalName,
  dateFormatted,
  timeSlot
}) => {
  return [
    `Passando para lembrar do seu momento Bonyta amanhã! ✨`,
    '',
    `Oi, ${customerName}! 🌸`,
    `Lembrando do seu agendamento:`,
    `💅 *Serviço:* ${serviceName}`,
    `👑 *Profissional:* ${professionalName || 'Equipe Bonyta'}`,
    `📅 *Amanhã:* ${dateFormatted}`,
    `⏰ *Horário:* ${timeSlot}`,
    '',
    'Podemos confirmar sua presença? Responda com *SIM* para confirmar ou nos avise caso precise remarcar! 😘'
  ].join('\n')
}

/**
 * Lembrete de manutenção de procedimento (Retenção 21 a 30 dias)
 */
export const buildMaintenanceReminderMsg = ({
  customerName,
  serviceName
}) => {
  return [
    `Oi, ${customerName}! Saudade de você aqui no estúdio! ✨`,
    '',
    `Já faz um tempinho desde a sua última sessão de *${serviceName || 'procedimento'}*.`,
    'Para manter o resultado impecável, que tal agendarmos sua manutenção essa semana? 💅💖',
    '',
    'Responda esta mensagem ou acesse nosso site para escolher seu novo horário!'
  ].join('\n')
}

/**
 * Envia uma mensagem via WhatsApp (abre em nova aba ou app)
 */
export const sendWhatsAppNotification = (phone, message) => {
  const targetNumber = String(phone || DEFAULT_STUDIO_PHONE).replace(/\D/g, '')
  const url = buildWhatsAppUrl(targetNumber, message)
  window.open(url, '_blank', 'noopener,noreferrer')
}
