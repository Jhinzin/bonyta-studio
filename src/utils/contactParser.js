export function cleanPhone(raw) {
  if (!raw) return null
  let digits = String(raw).replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.substring(2)
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return String(raw).trim()
}

export function parseBirthDate(raw) {
  if (!raw) return null
  const trimmed = String(raw).trim()
  const m = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (m) {
    let [_, d, mo, y] = m
    d = d.padStart(2, '0')
    mo = mo.padStart(2, '0')
    if (y.length === 2) {
      const yr = parseInt(y, 10)
      y = yr > 30 ? `19${y}` : `20${y}`
    }
    return `${y}-${mo}-${d}`
  }
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }
  return null
}

export function parseRawContactsText(text) {
  if (!text || typeof text !== 'string') return []

  const lines = text.split('\n')
  const entries = []
  let current = null

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()
    if (!trimmed) continue

    // Skip headers
    if (/^nome\b/i.test(trimmed) && /telef/i.test(trimmed)) continue

    const parts = rawLine.includes('\t')
      ? rawLine.split('\t').map((p) => p.trim())
      : rawLine.includes(';')
      ? rawLine.split(';').map((p) => p.trim())
      : rawLine.includes(',') && !rawLine.startsWith('(')
      ? rawLine.split(',').map((p) => p.trim())
      : [trimmed]

    const col0 = parts[0] || ''
    const isCol0Phone =
      /^\(?\d{2,3}\)?\s*[\d\s\-]+$/.test(col0) ||
      (col0.includes('9') && /^[\(\)\d\s\-\+]+$/.test(col0))

    if (isCol0Phone && current) {
      current.phone = cleanPhone(col0)
      for (let c = 1; c < parts.length; c++) {
        const val = parts[c]
        if (!val) continue
        const bDate = parseBirthDate(val)
        if (bDate) {
          current.birth_date = bDate
        } else if (
          !current.address &&
          (val.toLowerCase().startsWith('r') ||
            val.toLowerCase().startsWith('av') ||
            val.toLowerCase().startsWith('rua'))
        ) {
          current.address = val
        } else {
          current.observation = (current.observation ? current.observation + ' | ' : '') + val
        }
      }
    } else {
      current = {
        name: col0.replace(/^[,\s;]+|[,\s;]+$/g, ''),
        phone: null,
        birth_date: null,
        address: null,
        observation: null
      }
      entries.push(current)

      for (let c = 1; c < parts.length; c++) {
        const val = parts[c]
        if (!val) continue
        const bDate = parseBirthDate(val)
        if (bDate) {
          current.birth_date = bDate
        } else if (!current.phone && /^\+?\(?\d{2,3}\)?\s*[\d\s\-]+$/.test(val)) {
          current.phone = cleanPhone(val)
        } else if (
          !current.address &&
          (val.toLowerCase().startsWith('r') ||
            val.toLowerCase().startsWith('av') ||
            val.toLowerCase().startsWith('rua'))
        ) {
          current.address = val
        } else {
          current.observation = (current.observation ? current.observation + ' | ' : '') + val
        }
      }
    }
  }

  // Filter out empty names & deduplicate
  const seen = new Set()
  return entries.filter((item) => {
    if (!item.name || item.name.length < 2) return false
    if (/^(nome|telefones?|contato|endereço|obs)$/i.test(item.name)) return false
    const key = `${item.name.toLowerCase()}___${item.phone || ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
