export function generateRecurringDates({
  startDate,
  frequency,
  durationMonths = 4,
  count = null,
  customDays = 15
}) {
  if (!startDate || !frequency || frequency === 'none') return []
  const [y, m, d] = startDate.split('-').map(Number)
  const base = new Date(y, m - 1, d)

  const dates = []

  let maxDate = new Date(base)
  if (durationMonths) {
    maxDate.setMonth(maxDate.getMonth() + Number(durationMonths))
  }

  let current = new Date(base)
  let stepDays = 0

  if (frequency === 'daily') stepDays = 1
  else if (frequency === 'weekly') stepDays = 7
  else if (frequency === 'biweekly') stepDays = 15
  else if (frequency === 'every_3_weeks') stepDays = 21
  else if (frequency === 'custom') stepDays = Number(customDays) || 15

  const targetCount = count ? Number(count) : 999

  while (dates.length < targetCount) {
    if (frequency === 'monthly') {
      current.setMonth(current.getMonth() + 1)
    } else {
      current.setDate(current.getDate() + stepDays)
    }

    if (!count && current > maxDate) break

    const cy = current.getFullYear()
    const cm = String(current.getMonth() + 1).padStart(2, '0')
    const cd = String(current.getDate()).padStart(2, '0')
    dates.push(`${cy}-${cm}-${cd}`)

    if (dates.length >= 100) break // Safety ceiling
  }

  return dates
}

export function formatShortDate(iso) {
  if (!iso || typeof iso !== 'string') return ''
  const parts = iso.split('-')
  if (parts.length < 3) return String(iso)
  return `${parts[2]}/${parts[1]}`
}
