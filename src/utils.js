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
