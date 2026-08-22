'use client'

import { useAgentStatus } from '../../../hooks/useAgentStatus.js'
import AppShell from '../../../components/AppShell.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import FounderMatchesView from '../../../components/matches/FounderMatchesView.jsx'
import InvestorMatchesView from '../../../components/matches/InvestorMatchesView.jsx'
import { PageSkeleton } from '../../../components/Skeleton.jsx'
import { GearIcon } from '../../../components/icons.jsx'

export default function MatchesPage() {
  const {
    loading, ready, userType, statusData, founderProfile, profileData,
    userName, userRole, avatarUrl, pollingError, signOut, refetch,
  } = useAgentStatus()

  if (loading) return <PageSkeleton />

  return (
    <AppShell active="matches" userType={userType} userName={userName} userRole={userRole} avatarUrl={avatarUrl} onSignOut={signOut} notice={pollingError} profileData={profileData} statusData={statusData}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-page md:text-page-lg text-slate-900 dark:text-slate-100 tracking-tight">Matches</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {userType === 'investor'
              ? 'Your single exclusive top-ranked startup match — not a browsable list.'
              : 'Your single exclusive top-ranked investor match — request a meeting once your MVP is live.'}
          </p>
        </div>
      </div>

      {!ready ? (
        <EmptyState
          icon={<GearIcon className="w-6 h-6" />}
          title="Finding your match..."
          subtitle="This usually takes a few seconds while we rank candidates and verify MVP readiness."
          pulse
          className="h-64"
        />
      ) : userType === 'investor' ? (
        <InvestorMatchesView
          currentMatch={statusData?.current_match}
          meetingRequests={statusData?.meeting_requests}
          onRefetch={refetch}
        />
      ) : (
        <FounderMatchesView
          mvpUrlValid={Boolean(statusData?.mvp_url_valid)}
          currentMatch={statusData?.current_match}
          meetingRequests={statusData?.meeting_requests}
          founderDomain={founderProfile?.specialization}
          myIdeaId={statusData?.my_idea?.id}
          onRefetch={refetch}
        />
      )}
    </AppShell>
  )
}
