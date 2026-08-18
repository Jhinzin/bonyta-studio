import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useAppointments() {
  const [professionals, setProfessionals] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [profsRes, appsRes] = await Promise.all([
      supabase.from('professionals').select('*').eq('active', true).order('name'),
      supabase.from('appointments').select('*').order('date').order('time')
    ])

    if (profsRes.error) setError(profsRes.error)
    else if (appsRes.error) setError(appsRes.error)
    else setError(null)

    setProfessionals(profsRes.data || [])
    setAppointments(appsRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAll()

    // Realtime: qualquer criação/edição/exclusão em "appointments" atualiza
    // a tela automaticamente, mesmo se outra pessoa estiver usando o app
    // em outro celular ao mesmo tempo.
    const channel = supabase
      .channel('appointments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        loadAll()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadAll])

  const createAppointment = async (payload) => {
    const { error: insertError } = await supabase.from('appointments').insert(payload)
    if (insertError) throw insertError
  }

  const createManyAppointments = async (payloads) => {
    const chunkSize = 50
    for (let i = 0; i < payloads.length; i += chunkSize) {
      const chunk = payloads.slice(i, i + chunkSize)
      const { error: insertError } = await supabase.from('appointments').insert(chunk)
      if (insertError) throw insertError
    }
  }

  const updateAppointment = async (id, payload) => {
    const { error: updateError } = await supabase.from('appointments').update(payload).eq('id', id)
    if (updateError) throw updateError
  }

  const deleteAppointment = async (id) => {
    const { error: deleteError } = await supabase.from('appointments').delete().eq('id', id)
    if (deleteError) throw deleteError
  }

  const createProfessional = async (payload) => {
    const { error: insertError } = await supabase
      .from('professionals')
      .insert({ ...payload, active: true })
    if (insertError) throw insertError
    await loadAll()
  }

  const updateProfessional = async (id, payload) => {
    const { error: updateError } = await supabase
      .from('professionals')
      .update(payload)
      .eq('id', id)
    if (updateError) throw updateError
    await loadAll()
  }

  return {
    professionals,
    appointments,
    loading,
    error,
    createAppointment,
    createManyAppointments,
    updateAppointment,
    deleteAppointment,
    createProfessional,
    updateProfessional,
    reload: loadAll
  }
}
