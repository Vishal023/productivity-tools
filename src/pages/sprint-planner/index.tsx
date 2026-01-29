import { useState, useEffect } from 'react'
import { useSprintPlannerStore } from '@/store/sprint-planner'
import { TeamView } from './team-view'
import { ReleaseView } from './release-view'
import { Users, Package } from 'lucide-react'
import type { SprintPlannerTab } from '@/types'

type Tab = 'team' | 'releases'

export function SprintPlannerPage() {
  const { team, teamName } = useSprintPlannerStore()
  const needsSetup = team.length === 0 && !teamName
  const [activeTab, setActiveTab] = useState<Tab>(needsSetup ? 'team' : 'releases')

  useEffect(() => {
    if (needsSetup) {
      setActiveTab('team')
    }
  }, [needsSetup])

  return (
    <div className="sprint-planner">
      <div className="sprint-planner-header">
        <div className="sprint-tabs">
          <button
            className={`sprint-tab ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            <Users />
            My Team
            {team.length > 0 && <span className="tab-badge">{team.length}</span>}
          </button>
          <button
            className={`sprint-tab ${activeTab === 'releases' ? 'active' : ''}`}
            onClick={() => setActiveTab('releases')}
          >
            <Package />
            Releases
          </button>
        </div>
      </div>

      <div className="sprint-planner-content">
        {activeTab === 'team' ? (
          <TeamView onContinue={() => setActiveTab('releases')} />
        ) : (
          <ReleaseView onManageTeam={() => setActiveTab('team')} />
        )}
      </div>
    </div>
  )
}
