import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useUserProfiles(enabled = false) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadProfiles = useCallback(async () => {
    if (!enabled) {
      setProfiles([])
      return
    }

    setLoading(true)
    const { data, error: loadError } = await supabase.rpc('list_app_user_profiles')

    if (loadError) {
      setError(loadError)
      setProfiles([])
    } else {
      setError(null)
      setProfiles(data || [])
    }

    setLoading(false)
  }, [enabled])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  const saveProfile = async ({ email, role, professionalId, active }) => {
    const { error: saveError } = await supabase.rpc('upsert_app_user_profile_by_email', {
      p_email: email,
      p_role: role,
      p_professional_id: role === 'professional' ? professionalId || null : null,
      p_active: active !== false
    })

    if (saveError) throw saveError
    await loadProfiles()
  }

  return {
    profiles,
    loading,
    error,
    saveProfile,
    reloadProfiles: loadProfiles
  }
}
