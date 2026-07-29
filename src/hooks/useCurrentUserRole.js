import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

const OWNER_EMAILS = new Set(['wandrellclima@gmail.com', 'bonytastudio@gmail.com'])

const ownerFallback = {
  role: 'owner',
  professional_id: null,
  active: true,
  email: ''
}

export function useCurrentUserRole() {
  const [profile, setProfile] = useState(ownerFallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadProfile = useCallback(async () => {
    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    const email = userData?.user?.email || ''

    const { data, error: rpcError } = await supabase.rpc('get_current_app_profile')

    if (rpcError) {
      setError(rpcError)
      setProfile({
        ...ownerFallback,
        email,
        role: OWNER_EMAILS.has(email.toLowerCase()) ? 'owner' : 'professional'
      })
      setLoading(false)
      return
    }

    const currentProfile = data?.[0]
    setError(null)
    setProfile(currentProfile || {
      ...ownerFallback,
      email,
      role: OWNER_EMAILS.has(email.toLowerCase()) ? 'owner' : 'professional'
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const permissions = useMemo(() => {
    const role = profile?.role || 'professional'
    const isOwner = role === 'owner' || role === 'manager'
    const isProfessional = role === 'professional'

    return {
      role,
      isOwner,
      isProfessional,
      professionalId: profile?.professional_id || null,
      canManageBusiness: isOwner,
      canSeeClients: isOwner,
      canSeeServices: isOwner,
      canSeeFullFinance: isOwner,
      canSeeOwnFinance: true,
      canManageTeamSchedule: isOwner,
      canManageTeam: isOwner,
      canSeeSiteRequests: isOwner
    }
  }, [profile])

  return {
    profile,
    loading,
    error,
    reloadProfile: loadProfile,
    ...permissions
  }
}
