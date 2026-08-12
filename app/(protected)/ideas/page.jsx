'use client'

import { useAgentStatus } from '../../../hooks/useAgentStatus.js'
import AppShell from '../../../components/AppShell.jsx'
import { PageSkeleton } from '../../../components/Skeleton.jsx'
import FounderIdeasView from '../../../components/ideas/FounderIdeasView.jsx'
import InvestorShortlistView from '../../../components/ideas/InvestorShortlistView.jsx'

/**
 * Founders post/manage their own ideas here. Investors don't have ideas to
 * post — for them this route shows their AI-ranked startup shortlist
 * instead (see InvestorShortlistView), which is the practical equivalent.
 */
export default function IdeasPage() {
  const {
    loading, ready, userType, statusData, profileData,
    userName, userRole, avatarUrl, pollingError, signOut, refetch,
  } = useAgentStatus()

  if (loading) return <PageSkeleton />

  return (
    <AppShell active="ideas" userType={userType} userName={userName} userRole={userRole} avatarUrl={avatarUrl} onSignOut={signOut} notice={pollingError} profileData={profileData} statusData={statusData}>
      {userType === 'investor' ? (
        <InvestorShortlistView
          ready={ready}
          topIdeas={statusData?.top_ideas}
          meetingRequests={statusData?.meeting_requests}
          onRefetch={refetch}
        />
      ) : (
        <FounderIdeasView />
      )}
    </AppShell>
  )
}
