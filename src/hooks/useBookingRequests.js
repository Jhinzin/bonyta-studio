import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useBookingRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadRequests = useCallback(async () => {
    setLoading(true)

    const { data, error: fetchError } = await supabase
      .from('booking_requests')
      .select('*')
      .in('status', ['new', 'contacted'])
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError)
      setRequests([])
    } else {
      setError(null)
      setRequests(data || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadRequests()

    const channel = supabase
      .channel('booking-requests-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_requests' }, () => {
        loadRequests()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadRequests])

  const updateRequestStatus = async (id, status) => {
    const { error: updateError } = await supabase
      .from('booking_requests')
      .update({ status })
      .eq('id', id)

    if (updateError) throw updateError
    await loadRequests()
  }

  return {
    requests,
    loading,
    error,
    updateRequestStatus,
    reload: loadRequests
  }
}
