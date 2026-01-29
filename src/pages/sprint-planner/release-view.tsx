import { useState, useEffect, useRef } from 'react'
import { useSprintPlannerStore, useCurrentRelease, useReleaseSprints } from '@/store/sprint-planner'
import { Plus, ChevronDown, Package, Calendar, Settings } from 'lucide-react'
import { SprintView } from './sprint-view'
import { ReleaseMetrics } from './release-metrics'
import { NewSprintDialog } from './dialogs/new-sprint'
import { ManageReleasesDialog } from './dialogs/manage-releases'
import { calculateReleaseMetrics, formatDate } from '@/lib/calculations'

interface Props {
  onManageTeam: () => void
}

export function ReleaseView({ onManageTeam }: Props) {
  const { 
    team, 
    releases, 
    sprints,
    currentReleaseId, 
    currentSprintId,
    setCurrentRelease, 
    setCurrentSprint,
  } = useSprintPlannerStore()
  
  const currentRelease = useCurrentRelease()
  const releaseSprints = useReleaseSprints(currentReleaseId)
  const [showCreateRelease, setShowCreateRelease] = useState(false)
  const [showReleaseSelector, setShowReleaseSelector] = useState(false)
  const [showNewSprintDialog, setShowNewSprintDialog] = useState(false)
  const [showManageReleases, setShowManageReleases] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const releaseList = Object.values(releases).sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowReleaseSelector(false)
      }
    }

    if (showReleaseSelector) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showReleaseSelector])

  if (team.length === 0) {
    return (
      <div className="empty-state">
        <Package className="empty-state-icon" />
        <h3>Set up your team first</h3>
        <p>Add team members before creating releases and sprints</p>
        <button className="btn btn-primary" onClick={onManageTeam}>
          Set Up Team
        </button>
      </div>
    )
  }

  if (releaseList.length === 0 || showCreateRelease) {
    return (
      <CreateReleaseForm 
        onCreated={() => setShowCreateRelease(false)}
        onCancel={releaseList.length > 0 ? () => setShowCreateRelease(false) : undefined}
      />
    )
  }

  return (
    <div className="release-view">
      <div className="release-header">
        <div className="release-selector-wrapper" ref={dropdownRef}>
          <button 
            className="release-selector-btn"
            onClick={() => setShowReleaseSelector(!showReleaseSelector)}
          >
            <Package />
            <span className="release-selector-name">{currentRelease?.name || 'Select Release'}</span>
            {currentRelease && (
              <span className="release-selector-dates">
                {formatDate(currentRelease.startDate)} - {formatDate(currentRelease.endDate)}
              </span>
            )}
            <ChevronDown className={`chevron ${showReleaseSelector ? 'open' : ''}`} />
          </button>
          
          {showReleaseSelector && (
            <div className="release-dropdown">
              {releaseList.map(release => (
                <button
                  key={release.id}
                  className={`release-dropdown-item ${release.id === currentReleaseId ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentRelease(release.id)
                    setShowReleaseSelector(false)
                  }}
                >
                  <div className="release-dropdown-info">
                    <span className="release-dropdown-name">{release.name}</span>
                    <span className="release-dropdown-dates">
                      {formatDate(release.startDate)} - {formatDate(release.endDate)}
                    </span>
                  </div>
                  <span className="release-dropdown-sprints">
                    {release.sprintIds.length} sprints
                  </span>
                </button>
              ))}
              <button
                className="release-dropdown-item create-new"
                onClick={() => {
                  setShowCreateRelease(true)
                  setShowReleaseSelector(false)
                }}
              >
                <Plus />
                Create New Release
              </button>
            </div>
          )}
        </div>

        <button 
          className="release-settings-btn"
          onClick={() => setShowManageReleases(true)}
          title="Manage all releases"
        >
          <Settings />
        </button>

        {currentRelease && (
          <div className="sprint-tabs-inline">
            {releaseSprints.map((sprint, idx) => (
              <button
                key={sprint.id}
                className={`sprint-tab-pill ${sprint.id === currentSprintId ? 'active' : ''}`}
                onClick={() => setCurrentSprint(sprint.id)}
              >
                <Calendar />
                <span>Sprint {idx + 1}</span>
              </button>
            ))}
            {releaseSprints.length < 5 && (
              <button
                className="sprint-tab-pill add-sprint"
                onClick={() => setShowNewSprintDialog(true)}
              >
                <Plus />
                <span>Add Sprint</span>
              </button>
            )}
          </div>
        )}
      </div>

      {currentRelease && (
        <>
          <ReleaseMetrics 
            release={currentRelease} 
            metrics={calculateReleaseMetrics(currentRelease, sprints)} 
          />
          
          <SprintView 
            releaseId={currentRelease.id}
            onManageTeam={onManageTeam} 
          />
        </>
      )}

      {currentRelease && (
        <NewSprintDialog 
          open={showNewSprintDialog} 
          onClose={() => setShowNewSprintDialog(false)} 
          releaseId={currentRelease.id}
          sprintNumber={releaseSprints.length + 1}
        />
      )}

      <ManageReleasesDialog
        open={showManageReleases}
        onClose={() => setShowManageReleases(false)}
        onCreateNew={() => setShowCreateRelease(true)}
      />
    </div>
  )
}

function CreateReleaseForm({ onCreated, onCancel }: { onCreated: () => void; onCancel?: () => void }) {
  const { createRelease } = useSprintPlannerStore()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !startDate || !endDate) return
    
    createRelease({ name, startDate, endDate })
    onCreated()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="create-release-view">
      <div className="create-release-card">
        <div className="create-release-header">
          <Package className="create-release-icon" />
          <h2>Create New Release</h2>
          <p>Group your sprints into a release cycle</p>
        </div>

        <form onSubmit={handleSubmit} className="create-release-form">
          <div className="form-group">
            <label>Release Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., 2026.Q1 Release, Version 3.0"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                className="input"
                value={startDate}
                min={today}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                className="input"
                value={endDate}
                min={startDate || today}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            {onCancel && (
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!name || !startDate || !endDate}
            >
              Create Release
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
