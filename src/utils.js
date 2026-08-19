export const formatDateToISO = (date) => {
  const offset = date.getTimezoneOffset()
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000)
  return adjustedDate.toISOString().split('T')[0]
}

export const SHORT_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export const TIMELINE_CONFIG = {
  startHour: 8,
  endHour: 23,
  hourHeight: 90
}

export const addMinutesToTime = (time, minutesToAdd) => {
  if (!time) return '--:--'
  const [hours, minutes] = String(time).split(':').map(Number)
  const totalMinutes = (hours || 0) * 60 + (minutes || 0) + Number(minutesToAdd || 0)
  const nextHours = Math.floor(totalMinutes / 60) % 24
  const nextMinutes = totalMinutes % 60
  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`
}
