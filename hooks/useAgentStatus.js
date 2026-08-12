'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext.jsx'
import { useMeetingRequestsRealtime } from './useMeetingRequestsRealtime.js'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

/**
 * Shared "check onboarding, then poll /api/{founder|investor}/status" logic —
 * extracted from Dashboard.jsx so MatchesPage/ProfilePage don't reimplement it.
 */
export function useAgentStatus() {
  const { user, accessToken, signOut } = useAuth()
  const router = useRouter()

  const [profileData, setProfileData] = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [statusData, setStatusData] = useState(null)
  const [pollingError, setPollingError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function checkProfile() {
      try {
        const res = await fetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.status === 401) {
          await signOut()
          router.push('/login')
          return
        }
        if (!res.ok) {
          if (!cancelled) setPollingError('Connecting to live backend...')
          return
        }
        const data = await res.json()
        if (cancelled) return
        if (data.onboarded) {
          setProfileData(data)
          setProfileLoaded(true)
        } else {
          router.push('/onboarding')
        }
      } catch (err) {
        if (!cancelled) setPollingError('Connecting to live backend...')
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    }
    if (accessToken) checkProfile()
    else setLoadingProfile(false)
    return () => { cancelled = true }
  }, [accessToken, router, signOut])

  const userTypeForPoll = profileData?.user_type || 'founder'

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/${userTypeForPoll}/status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) setStatusData(await res.json())
    } catch (err) {
      // transient — next poll tick will retry
    }
  }, [userTypeForPoll, accessToken])

  useEffect(() => {
    if (!profileLoaded || !profileData) return
    pollStatus()
    // Dynamic polling interval: poll fast (4s) while pipeline is working, relax to 12s when ready
    const isReady = Boolean(statusData?.ready)
    const intervalMs = isReady ? 12000 : 4000
    const pollInterval = setInterval(pollStatus, intervalMs)
    return () => clearInterval(pollInterval)
  }, [profileLoaded, profileData, pollStatus, statusData?.ready])

  // Push-triggered instant refetch on top of the 4s poll above (which stays
  // as the safety net) — a confirmed meeting / raised hand / requested
  // meeting shows up the moment the other side acts, not up to 4s later.
  useMeetingRequestsRealtime(pollStatus, Boolean(profileLoaded && profileData))

  const userType = profileData?.user_type || 'founder'
  const founderProfile = statusData?.founder_profile || (userType === 'founder' ? profileData?.profile : null) || {}
  const investorProfile = statusData?.investor_profile || (userType === 'investor' ? profileData?.profile : null) || {}
  const githubInsights = founderProfile?.github_insights || {}
  const userName = user?.user_metadata?.full_name || founderProfile?.name || investorProfile?.name || user?.email?.split('@')[0] || 'User'
  const avatarUrl = githubInsights.avatar_url || null
  const userRole = userType === 'investor' ? (investorProfile?.designation || 'Investor') : (founderProfile?.role || founderProfile?.specialization || 'Founder')

  return {
    loading: loadingProfile,
    ready: Boolean(statusData?.ready),
    userType,
    profileData,
    statusData,
    founderProfile,
    investorProfile,
    githubInsights,
    userName,
    userRole,
    avatarUrl,
    pollingError,
    signOut,
    refetch: pollStatus,
  }
}
