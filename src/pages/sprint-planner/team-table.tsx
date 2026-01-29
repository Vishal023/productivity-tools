import { useState } from 'react'
import { useSprintPlannerStore, useCurrentSprint } from '@/store/sprint-planner'
import { getInitials, calculateAvailable, calculateActualAvailable, calculatePlannedSp, calculateAdhocSp, calculateCompletedSp, getMemberStatus } from '@/lib/calculations'
import { Trash2, UserPlus, X } from 'lucide-react'
import type { SprintMember, TeamMember } from '@/types'

export function TeamTable() {
  const sprint = useCurrentSprint()
  const { team, updateSprintMember, removeMemberFromSprint, addMemberToSprint } = useSprintPlannerStore()
  const [memberToAdd, setMemberToAdd] = useState<TeamMember | null>(null)

  if (!sprint) return null

  const handleFieldChange = (memberId: string, field: keyof SprintMember, value: string) => {
    updateSprintMember(sprint.id, memberId, { [field]: parseFloat(value) || 0 })
  }

  const membersNotInSprint = team.filter(t => !sprint.members.some(m => m.id === t.id))

  const handleSelectMember = (memberId: string) => {
    const member = team.find(m => m.id === memberId)
    if (member) {
      setMemberToAdd(member)
    }
  }

  // Get team-wide holidays from existing members (if any)
  const teamHolidays = sprint.members.length > 0 ? sprint.members[0].holidays : 0

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Team Capacity</h3>
          {membersNotInSprint.length > 0 && (
            <div className="add-member-dropdown">
              <select 
                className="select"
                value=""
                onChange={e => {
                  if (e.target.value) {
                    handleSelectMember(e.target.value)
                  }
                }}
              >
                <option value="">
                  <UserPlus /> Add member...
                </option>
                {membersNotInSprint.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th style={{ textAlign: 'center' }}>Cap</th>
                <th style={{ textAlign: 'center' }}>Leave</th>
                <th style={{ textAlign: 'center' }}>Holiday</th>
                <th style={{ textAlign: 'center' }}>Non-Jira</th>
                <th style={{ textAlign: 'right' }}>Avail</th>
                <th style={{ textAlign: 'right' }}>Plan</th>
                <th style={{ textAlign: 'right', color: '#ec4899' }}>Adhoc</th>
                <th style={{ textAlign: 'right' }}>Plan %</th>
                <th style={{ textAlign: 'center', color: '#f59e0b' }}>Unplan</th>
                <th style={{ textAlign: 'right' }}>Done</th>
                <th style={{ textAlign: 'right' }}>Actual %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sprint.members.map(member => (
                <MemberRow
                  key={member.id}
                  member={member}
                  sprint={sprint}
                  onFieldChange={handleFieldChange}
                  onRemove={() => removeMemberFromSprint(sprint.id, member.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-legend">
          <span><strong>Plan</strong> = Committed SP (excludes adhoc)</span>
          <span><strong>Plan %</strong> = Plan / Avail</span>
          <span><strong>Actual %</strong> = Done / (Avail - Unplan)</span>
        </div>
      </div>

      {memberToAdd && (
        <AddMemberDialog
          member={memberToAdd}
          teamHolidays={teamHolidays}
          onClose={() => setMemberToAdd(null)}
          onAdd={(capacityInfo) => {
            addMemberToSprint(sprint.id, memberToAdd.id, capacityInfo)
            setMemberToAdd(null)
          }}
        />
      )}
    </>
  )
}

function AddMemberDialog({
  member,
  teamHolidays,
  onClose,
  onAdd
}: {
  member: TeamMember
  teamHolidays: number
  onClose: () => void
  onAdd: (capacityInfo: { leaves: number; holidays: number; nonJira: number }) => void
}) {
  const [leaves, setLeaves] = useState('0')
  const [holidays, setHolidays] = useState(String(teamHolidays))
  const [nonJira, setNonJira] = useState('0')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      leaves: parseFloat(leaves) || 0,
      holidays: parseFloat(holidays) || 0,
      nonJira: parseFloat(nonJira) || 0
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add Member to Sprint</h3>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }} onClick={onClose}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="add-member-profile">
              <div className="avatar">{getInitials(member.name)}</div>
              <div className="add-member-info">
                <span className="add-member-name">{member.name}</span>
                <span className="add-member-cap">{member.defaultCapacity} SP capacity</span>
              </div>
            </div>

            <div className="add-member-fields">
            <div className="add-member-field">
              <label className="label">Planned Leave (SP)</label>
              <input
                type="number"
                className="input input-mono"
                value={leaves}
                onChange={e => setLeaves(e.target.value)}
                min="0"
                step="any"
                autoFocus
              />
            </div>
            <div className="add-member-field">
              <label className="label">Holidays (SP)</label>
              <input
                type="number"
                className="input input-mono"
                value={holidays}
                onChange={e => setHolidays(e.target.value)}
                min="0"
                step="any"
              />
              <p className="input-hint">Team-wide holidays</p>
            </div>
            <div className="add-member-field">
              <label className="label">Non-Jira Work (SP)</label>
              <input
                type="number"
                className="input input-mono"
                value={nonJira}
                onChange={e => setNonJira(e.target.value)}
                min="0"
                step="any"
              />
            </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add to Sprint</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MemberRow({ 
  member, 
  sprint, 
  onFieldChange, 
  onRemove 
}: { 
  member: SprintMember
  sprint: NonNullable<ReturnType<typeof useCurrentSprint>>
  onFieldChange: (memberId: string, field: keyof SprintMember, value: string) => void
  onRemove: () => void
}) {
  const available = calculateAvailable(member, sprint.adhocReserve)
  const actualAvailable = calculateActualAvailable(member, sprint.adhocReserve)
  const plannedSp = calculatePlannedSp(sprint, member.id)
  const adhocSp = calculateAdhocSp(sprint, member.id)
  const completedSp = calculateCompletedSp(sprint, member.id)
  const plannedUtil = available > 0 ? (plannedSp / available) * 100 : 0
  const actualUtil = actualAvailable > 0 ? (completedSp / actualAvailable) * 100 : 0
  const status = getMemberStatus(plannedUtil)

  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    under: { bg: 'rgba(244, 63, 94, 0.06)', color: '#f43f5e', label: 'Under' },
    balanced: { bg: 'rgba(16, 185, 129, 0.06)', color: '#10b981', label: 'OK' },
    over: { bg: 'rgba(236, 72, 153, 0.06)', color: '#ec4899', label: 'Over' }
  }

  const config = statusConfig[status]

  return (
    <tr style={{ background: config.bg }}>
      <td>
        <div className="table-member">
          <div className="avatar avatar-sm">{getInitials(member.name)}</div>
          <div className="table-member-info">
            <span className="table-member-name">{member.name}</span>
            <span className="table-member-status" style={{ color: config.color }}>
              {config.label}
            </span>
          </div>
        </div>
      </td>
      <td style={{ textAlign: 'center' }}>
        <input
          type="number"
          value={member.capacity}
          onChange={e => onFieldChange(member.id, 'capacity', e.target.value)}
          min="0"
          step="any"
          className="table-input"
        />
      </td>
      <td style={{ textAlign: 'center' }}>
        <input
          type="number"
          value={member.leaves}
          onChange={e => onFieldChange(member.id, 'leaves', e.target.value)}
          min="0"
          step="any"
          className="table-input"
        />
      </td>
      <td style={{ textAlign: 'center' }}>
        <input
          type="number"
          value={member.holidays}
          onChange={e => onFieldChange(member.id, 'holidays', e.target.value)}
          min="0"
          step="any"
          className="table-input"
        />
      </td>
      <td style={{ textAlign: 'center' }}>
        <input
          type="number"
          value={member.nonJira}
          onChange={e => onFieldChange(member.id, 'nonJira', e.target.value)}
          min="0"
          step="any"
          className="table-input"
        />
      </td>
      <td style={{ textAlign: 'right' }}>
        <span className="table-value highlight">{available.toFixed(2)}</span>
      </td>
      <td style={{ textAlign: 'right' }}>
        <span className="table-value">{plannedSp.toFixed(2)}</span>
      </td>
      <td style={{ textAlign: 'right' }}>
        <span className="table-value" style={{ color: adhocSp > 0 ? '#ec4899' : 'var(--muted-foreground)' }}>
          {adhocSp.toFixed(2)}
        </span>
      </td>
      <td style={{ textAlign: 'right' }}>
        <UtilBadge value={plannedUtil} type="plan" />
      </td>
      <td style={{ textAlign: 'center' }}>
        <input
          type="number"
          value={member.unplannedLeaves || 0}
          onChange={e => onFieldChange(member.id, 'unplannedLeaves', e.target.value)}
          min="0"
          step="any"
          className="table-input unplanned"
          title="Unplanned leaves (sick, emergency)"
        />
      </td>
      <td style={{ textAlign: 'right' }}>
        <span className="table-value" style={{ color: '#10b981' }}>{completedSp.toFixed(2)}</span>
      </td>
      <td style={{ textAlign: 'right' }}>
        <UtilBadge value={actualUtil} type="actual" />
      </td>
      <td style={{ textAlign: 'center', width: '40px' }}>
        <button 
          className="table-remove-btn"
          onClick={onRemove}
          title="Remove from sprint"
        >
          <Trash2 />
        </button>
      </td>
    </tr>
  )
}

function UtilBadge({ value, type }: { value: number; type: 'plan' | 'actual' }) {
  const getStyle = (v: number): { bg: string; color: string } => {
    if (type === 'actual') {
      if (v >= 100) return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }
      if (v >= 80) return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }
      return { bg: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }
    }
    if (v < 85) return { bg: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }
    if (v <= 100) return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }
    return { bg: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }
  }

  const style = getStyle(value)

  return (
    <span 
      className="util-badge"
      style={{ background: style.bg, color: style.color }}
    >
      {isFinite(value) ? value.toFixed(2) : '0.00'}%
    </span>
  )
}
