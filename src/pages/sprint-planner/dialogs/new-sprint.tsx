import { useState, useEffect } from 'react'
import { useSprintPlannerStore, useCurrentRelease } from '@/store/sprint-planner'
import { AlertDialog } from '@/components/confirm-dialog'
import { X, ChevronRight, ChevronLeft, Calendar, Users } from 'lucide-react'
import { getInitials } from '@/lib/calculations'
import type { SprintMember } from '@/types'

interface NewSprintDialogProps {
  open: boolean
  onClose: () => void
  releaseId: string
  sprintNumber: number
}

type Step = 'details' | 'capacity'

interface MemberCapacity {
  id: string
  name: string
  leaves: number
  nonJira: number
}

export function NewSprintDialog({ open, onClose, releaseId, sprintNumber }: NewSprintDialogProps) {
  const { team, createSprint } = useSprintPlannerStore()
  const release = useCurrentRelease()
  
  const defaultName = release ? `${release.name} - Sprint ${sprintNumber}` : `Sprint ${sprintNumber}`
  
  const [step, setStep] = useState<Step>('details')
  const [name, setName] = useState(defaultName)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [capacity, setCapacity] = useState('10')
  const [adhoc, setAdhoc] = useState('15')
  const [holidays, setHolidays] = useState('0')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set(team.map(m => m.id)))
  const [memberCapacities, setMemberCapacities] = useState<MemberCapacity[]>([])
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (open) {
      const newName = release ? `${release.name} - Sprint ${sprintNumber}` : `Sprint ${sprintNumber}`
      setName(newName)
      setSelectedMembers(new Set(team.map(m => m.id)))
      setStep('details')
      setMemberCapacities([])
      setHolidays('0')
    }
  }, [open, release, sprintNumber, team])

  if (!open) return null

  const handleDetailsNext = () => {
    if (selectedMembers.size === 0) {
      setShowAlert(true)
      return
    }
    
    // Initialize member capacities for selected members
    const capacities = Array.from(selectedMembers).map(id => {
      const tm = team.find(m => m.id === id)!
      return {
        id,
        name: tm.name,
        leaves: 0,
        nonJira: 0
      }
    })
    setMemberCapacities(capacities)
    setStep('capacity')
  }

  const handleCreate = () => {
    const defaultCap = parseFloat(capacity) || 10
    const teamHolidays = parseFloat(holidays) || 0
    
    const members: SprintMember[] = memberCapacities.map(mc => {
      const tm = team.find(m => m.id === mc.id)!
      return {
        id: mc.id,
        name: tm.name,
        capacity: tm.defaultCapacity || defaultCap,
        leaves: mc.leaves,
        unplannedLeaves: 0,
        holidays: teamHolidays,
        nonJira: mc.nonJira
      }
    })

    createSprint({
      releaseId,
      name,
      startDate,
      endDate,
      defaultCapacity: defaultCap,
      adhocReserve: parseFloat(adhoc) || 15,
      members
    })

    onClose()
    setName('')
  }

  const toggleMember = (id: string) => {
    const next = new Set(selectedMembers)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedMembers(next)
  }

  const selectAll = () => setSelectedMembers(new Set(team.map(m => m.id)))
  const selectNone = () => setSelectedMembers(new Set())

  const updateMemberCapacity = (id: string, field: 'leaves' | 'nonJira', value: number) => {
    setMemberCapacities(prev => 
      prev.map(mc => mc.id === id ? { ...mc, [field]: value } : mc)
    )
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-header-content">
              <h3 className="modal-title">
                {step === 'details' ? 'Create Sprint' : 'Set Capacity'}
              </h3>
              <div className="modal-steps">
                <span className={`modal-step ${step === 'details' ? 'active' : 'completed'}`}>
                  <Calendar /> Details
                </span>
                <ChevronRight className="modal-step-arrow" />
                <span className={`modal-step ${step === 'capacity' ? 'active' : ''}`}>
                  <Users /> Capacity
                </span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }} onClick={onClose}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {step === 'details' ? (
            <DetailsStep
              name={name}
              setName={setName}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              capacity={capacity}
              setCapacity={setCapacity}
              adhoc={adhoc}
              setAdhoc={setAdhoc}
              team={team}
              selectedMembers={selectedMembers}
              toggleMember={toggleMember}
              selectAll={selectAll}
              selectNone={selectNone}
              onNext={handleDetailsNext}
              onCancel={onClose}
            />
          ) : (
            <CapacityStep
              memberCapacities={memberCapacities}
              holidays={holidays}
              setHolidays={setHolidays}
              updateMemberCapacity={updateMemberCapacity}
              onBack={() => setStep('details')}
              onCreate={handleCreate}
            />
          )}
        </div>
      </div>

      <AlertDialog
        open={showAlert}
        onClose={() => setShowAlert(false)}
        title="No Members Selected"
        message="Please select at least one team member to participate in this sprint."
        variant="warning"
      />
    </>
  )
}

function DetailsStep({
  name, setName,
  startDate, setStartDate,
  endDate, setEndDate,
  capacity, setCapacity,
  adhoc, setAdhoc,
  team,
  selectedMembers,
  toggleMember,
  selectAll,
  selectNone,
  onNext,
  onCancel
}: {
  name: string
  setName: (v: string) => void
  startDate: string
  setStartDate: (v: string) => void
  endDate: string
  setEndDate: (v: string) => void
  capacity: string
  setCapacity: (v: string) => void
  adhoc: string
  setAdhoc: (v: string) => void
  team: { id: string; name: string; defaultCapacity: number }[]
  selectedMembers: Set<string>
  toggleMember: (id: string) => void
  selectAll: () => void
  selectNone: () => void
  onNext: () => void
  onCancel: () => void
}) {
  return (
    <>
      <div className="modal-body">
        <div style={{ marginBottom: '16px' }}>
          <label className="label">Sprint Name</label>
          <input
            className="input"
            placeholder="e.g., Sprint 1, 2026.3.1"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="label">Default Capacity (SP)</label>
            <input
              type="number"
              className="input input-mono"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              min="1"
              step="any"
            />
          </div>
          <div>
            <label className="label">Adhoc Reserve (%)</label>
            <input
              type="number"
              className="input input-mono"
              value={adhoc}
              onChange={e => setAdhoc(e.target.value)}
              min="0"
              max="100"
            />
            <p className="input-hint">Deducted from available capacity</p>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="label" style={{ marginBottom: 0 }}>Participating Members</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-ghost btn-xs" onClick={selectAll}>All</button>
              <button type="button" className="btn btn-ghost btn-xs" onClick={selectNone}>None</button>
            </div>
          </div>
          <div className="member-select-list">
            {team.map(member => (
              <label key={member.id} className="member-select-item">
                <input
                  type="checkbox"
                  checked={selectedMembers.has(member.id)}
                  onChange={() => toggleMember(member.id)}
                />
                <div className="avatar avatar-sm">{getInitials(member.name)}</div>
                <span className="member-select-name">{member.name}</span>
                <span className="member-select-cap">{member.defaultCapacity} SP</span>
              </label>
            ))}
          </div>
          <p className="input-hint">{selectedMembers.size} of {team.length} selected</p>
        </div>
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={onNext}
          disabled={!name || !startDate || !endDate}
        >
          Next: Set Capacity
          <ChevronRight style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </>
  )
}

function CapacityStep({
  memberCapacities,
  holidays,
  setHolidays,
  updateMemberCapacity,
  onBack,
  onCreate
}: {
  memberCapacities: MemberCapacity[]
  holidays: string
  setHolidays: (v: string) => void
  updateMemberCapacity: (id: string, field: 'leaves' | 'nonJira', value: number) => void
  onBack: () => void
  onCreate: () => void
}) {
  return (
    <>
      <div className="modal-body">
        <div className="capacity-setup-header">
          <div className="capacity-team-field">
            <label className="label">Team Holidays (SP)</label>
            <input
              type="number"
              className="input input-mono"
              value={holidays}
              onChange={e => setHolidays(e.target.value)}
              min="0"
              step="any"
              style={{ width: '100px' }}
            />
            <p className="input-hint">Applied to all members</p>
          </div>
        </div>

        <div className="capacity-member-list">
          <div className="capacity-member-header">
            <span>Member</span>
            <span>Planned Leave</span>
            <span>Non-Jira</span>
          </div>
          {memberCapacities.map(mc => (
            <div key={mc.id} className="capacity-member-row">
              <div className="capacity-member-info">
                <div className="avatar avatar-sm">{getInitials(mc.name)}</div>
                <span>{mc.name}</span>
              </div>
              <input
                type="number"
                className="input input-mono capacity-input"
                value={mc.leaves}
                onChange={e => updateMemberCapacity(mc.id, 'leaves', parseFloat(e.target.value) || 0)}
                min="0"
                step="any"
                placeholder="0"
              />
              <input
                type="number"
                className="input input-mono capacity-input"
                value={mc.nonJira}
                onChange={e => updateMemberCapacity(mc.id, 'nonJira', parseFloat(e.target.value) || 0)}
                min="0"
                step="any"
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <p className="capacity-hint">
          You can also edit these values later in the Team Capacity table.
        </p>
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          <ChevronLeft style={{ width: '16px', height: '16px' }} />
          Back
        </button>
        <button type="button" className="btn btn-primary" onClick={onCreate}>
          Create Sprint
        </button>
      </div>
    </>
  )
}
