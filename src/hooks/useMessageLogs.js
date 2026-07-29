import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useMessageLogs(enabled = true) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadLogs = useCallback(async () => {
    if (!enabled) {
      setLogs([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error: fetchError } = await supabase
      .from('message_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(250)

    if (fetchError) {
      setError(fetchError)
      setLogs([])
    } else {
      setError(null)
      setLogs(data || [])
    }

    setLoading(false)
  }, [enabled])

  useEffect(() => {
    loadLogs()

    if (!enabled) return undefined

    const channel = supabase
      .channel('message-logs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_logs' }, () => {
        loadLogs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, loadLogs])

  const logMessage = async (payload) => {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const { error: insertError } = await supabase
      .from('message_logs')
      .insert([{
        ...payload,
        channel: payload.channel || 'whatsapp',
        status: payload.status || 'sent',
        sent_by: userData.user?.id
      }])

    if (insertError) throw insertError
    await loadLogs()
  }

  return {
    logs,
    loading,
    error,
    logMessage,
    reload: loadLogs
  }
}
