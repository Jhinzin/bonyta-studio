import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useWaitlist() {
  const [waitlist, setWaitlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadWaitlist = useCallback(async () => {
    setLoading(true)

    const { data, error: fetchError } = await supabase
      .from('waitlist_entries')
      .select('*')
      .eq('status', 'waiting')
      .order('preferred_date', { ascending: true })
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError)
      setWaitlist([])
    } else {
      setError(null)
      setWaitlist(data || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadWaitlist()

    const channel = supabase
      .channel('waitlist-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist_entries' }, () => {
        loadWaitlist()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadWaitlist])

  const addWaitlistEntry = async (payload) => {
    const { error: insertError } = await supabase
      .from('waitlist_entries')
      .insert({ ...payload, status: 'waiting' })

    if (insertError) throw insertError
    await loadWaitlist()
  }

  const removeWaitlistEntry = async (id) => {
    const { error: deleteError } = await supabase
      .from('waitlist_entries')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError
    await loadWaitlist()
  }

  return {
    waitlist,
    loading,
    error,
    addWaitlistEntry,
    removeWaitlistEntry,
    reload: loadWaitlist
  }
}
