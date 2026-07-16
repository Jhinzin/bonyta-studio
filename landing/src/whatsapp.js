export const onlyDigits = (value) => String(value || '').replace(/\D/g, '')

export const normalizeBrazilWhatsApp = (phone) => {
  const digits = onlyDigits(phone)
  if (!digits) return ''
  return digits.startsWith('55') ? digits : `55${digits}`
}

export const buildWhatsAppUrl = (phone, message) => {
  const normalizedPhone = normalizeBrazilWhatsApp(phone)
  const encodedMessage = encodeURIComponent(message)
  return normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`
}
