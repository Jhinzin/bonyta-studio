import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

export const WEEKDAYS = [
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' }
]

const makeDefaultRow = (professionalId, weekday) => ({
  professional_id: professionalId,
  weekday,
  starts_at: '08:00',
  ends_at: '18:00',
  break_starts_at: '12:00',
  break_ends_at: '13:00',
  slot_interval_minutes: 30,
  active: weekday !== 0
})

const normalizeTime = (value) => String(value || '').slice(0, 5)

const normalizeRow = (row) => ({
  ...row,
  starts_at: normalizeTime(row.starts_at) || '08:00',
  ends_at: normalizeTime(row.ends_at) || '18:00',
  break_starts_at: normalizeTime(row.break_starts_at),
  break_ends_at: normalizeTime(row.break_ends_at),
  slot_interval_minutes: Number(row.slot_interval_minutes || 30),
  active: row.active !== false
})

export function useWorkingHours(professionals = []) {
  const [savedRows, setSavedRows] = useState([])
  const [draftRows, setDraftRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadWorkingHours = useCallback(async () => {
    if (!professionals.length) {
      setSavedRows([])
      setDraftRows([])
      return
    }

    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('professional_working_hours')
      .select('*')
      .order('professional_id')
      .order('weekday')

    if (fetchError) {
      setError(fetchError)
      setSavedRows([])
      setDraftRows([])
      setLoading(false)
      return
    }

    setError(null)
    setSavedRows((data || []).map(normalizeRow))
    setLoading(false)
  }, [professionals.length])

  const mergedRows = useMemo(() => {
    const byKey = new Map(savedRows.map((row) => [`${row.professional_id}-${row.weekday}`, row]))
    return professionals.flatMap((professional) =>
      WEEKDAYS.map((day) => normalizeRow(
        byKey.get(`${professional.id}-${day.value}`) || makeDefaultRow(professional.id, day.value)
      ))
    )
  }, [professionals, savedRows])

  useEffect(() => {
    setDraftRows(mergedRows)
  }, [mergedRows])

  useEffect(() => {
    loadWorkingHours()
  }, [loadWorkingHours])

  const updateDraftRow = (professionalId, weekday, patch) => {
    setDraftRows((current) => {
      const key = `${professionalId}-${weekday}`
      const next = current.some((row) => `${row.professional_id}-${row.weekday}` === key)
        ? current
        : [...current, makeDefaultRow(professionalId, weekday)]

      return next.map((row) => (
        `${row.professional_id}-${row.weekday}` === key
          ? normalizeRow({ ...row, ...patch })
          : row
      ))
    })
  }

  const saveProfessionalSchedule = async (professionalId) => {
    const rowsToSave = draftRows
      .filter((row) => String(row.professional_id) === String(professionalId))
      .map((row) => ({
        professional_id: row.professional_id,
        weekday: Number(row.weekday),
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        break_starts_at: row.break_starts_at || null,
        break_ends_at: row.break_ends_at || null,
        slot_interval_minutes: Number(row.slot_interval_minutes || 30),
        active: row.active !== false
      }))

    const { error: saveError } = await supabase
      .from('professional_working_hours')
      .upsert(rowsToSave, { onConflict: 'professional_id,weekday' })

    if (saveError) throw saveError
    await loadWorkingHours()
  }

  return {
    workingHours: draftRows,
    loading,
    error,
    updateWorkingHour: updateDraftRow,
    saveProfessionalSchedule,
    reloadWorkingHours: loadWorkingHours
  }
}
