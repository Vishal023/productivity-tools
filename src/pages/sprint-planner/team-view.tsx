import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useSprintPlannerStore } from '@/store/sprint-planner'
import { getInitials } from '@/lib/calculations'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Plus, Pencil, Trash2, Check, X, ArrowRight, Users } from 'lucide-react'

interface TeamViewProps {
  onContinue: () => void
}

export function TeamView({ onContinue }: TeamViewProps) {
  const { teamName, team, setTeamName, addTeamMember, updateTeamMember, removeTeamMember } = useSprintPlannerStore()
  const [editingName, setEditingName] = useState(!teamName)
  const [tempName, setTempName] = useState(teamName)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberCapacity, setNewMemberCapacity] = useState('10')
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCapacity, setEditCapacity] = useState('')
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const memberInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [editingName])

  const handleSaveTeamName = () => {
    if (tempName.trim()) {
      setTeamName(tempName.trim())
      setEditingName(false)
    }
  }

  const handleAddMember = () => {
    const trimmedName = newMemberName.trim()
    if (!trimmedName) return
    
    const exists = team.some(m => m.name.toLowerCase() === trimmedName.toLowerCase())
    if (exists) {
      setNewMemberName('')
      return
    }

    addTeamMember(trimmedName, parseFloat(newMemberCapacity) || 10)
    setNewMemberName('')
    setNewMemberCapacity('10')
    memberInputRef.current?.focus()
  }

  const handleMemberKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddMember()
    }
  }

  const startEditMember = (member: { id: string; name: string; defaultCapacity: number }) => {
    setEditingMemberId(member.id)
    setEditName(member.name)
    setEditCapacity(String(member.defaultCapacity))
  }

  const saveEditMember = () => {
    if (editingMemberId && editName.trim()) {
      updateTeamMember(editingMemberId, editName.trim(), parseFloat(editCapacity) || 10)
    }
    setEditingMemberId(null)
  }

  const cancelEditMember = () => {
    setEditingMemberId(null)
    setEditName('')
    setEditCapacity('')
  }

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEditMember()
    } else if (e.key === 'Escape') {
      cancelEditMember()
    }
  }

  const handleDeleteMember = () => {
    if (memberToDelete) {
      removeTeamMember(memberToDelete.id)
      setMemberToDelete(null)
    }
  }

  const canContinue = team.length > 0

  return (
    <div className="team-view">
      <div className="team-header-section">
        {editingName ? (
          <div className="team-name-edit">
            <input
              ref={nameInputRef}
              className="input team-name-input"
              placeholder="Enter team name (e.g., Platform Team)"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveTeamName()}
            />
            <button className="btn btn-primary" onClick={handleSaveTeamName} disabled={!tempName.trim()}>
              <Check className="w-4 h-4" />
              Save
            </button>
            {teamName && (
              <button className="btn btn-secondary" onClick={() => { setTempName(teamName); setEditingName(false) }}>
                Cancel
              </button>
            )}
          </div>
        ) : (
          <div className="team-name-display">
            <div className="team-name-icon">
              <Users />
            </div>
            <div className="team-name-info">
              <h2 className="team-name-title">{teamName}</h2>
              <p className="team-name-subtitle">{team.length} member{team.length !== 1 ? 's' : ''}</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditingName(true)}>
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          </div>
        )}
      </div>

      <div className="team-content">
        <div className="team-members-section">
          <div className="section-header">
            <h3 className="section-title">Team Members</h3>
            <p className="section-subtitle">Add members with their default sprint capacity</p>
          </div>

          <div className="add-member-row">
            <input
              ref={memberInputRef}
              className="input"
              placeholder="Member name"
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              onKeyDown={handleMemberKeyDown}
            />
            <div className="capacity-input-wrapper">
              <input
                type="number"
                className="input input-mono"
                placeholder="10"
                value={newMemberCapacity}
                onChange={e => setNewMemberCapacity(e.target.value)}
                onKeyDown={handleMemberKeyDown}
                min="0"
                step="any"
              />
              <span className="capacity-suffix">SP</span>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleAddMember}
              disabled={!newMemberName.trim()}
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="members-list">
            {team.length === 0 ? (
              <div className="empty-members">
                <Users className="empty-icon" />
                <p>No team members yet</p>
                <span>Add your first team member above</span>
              </div>
            ) : (
              team.map((member, index) => (
                <div 
                  key={member.id} 
                  className="member-row"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {editingMemberId === member.id ? (
                    <>
                      <div className="avatar">{getInitials(editName || member.name)}</div>
                      <input
                        className="input member-edit-name"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        autoFocus
                      />
                      <div className="capacity-input-wrapper compact">
                        <input
                          type="number"
                          className="input input-mono"
                          value={editCapacity}
                          onChange={e => setEditCapacity(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          min="0"
                          step="any"
                        />
                        <span className="capacity-suffix">SP</span>
                      </div>
                      <button className="btn btn-ghost btn-icon" onClick={saveEditMember}>
                        <Check className="w-4 h-4 text-emerald" />
                      </button>
                      <button className="btn btn-ghost btn-icon" onClick={cancelEditMember}>
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="avatar">{getInitials(member.name)}</div>
                      <span className="member-name">{member.name}</span>
                      <span className="member-capacity">{member.defaultCapacity} SP</span>
                      <div className="member-actions">
                        <button 
                          className="btn btn-ghost btn-icon" 
                          onClick={() => startEditMember(member)}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          className="btn btn-ghost btn-icon" 
                          onClick={() => setMemberToDelete({ id: member.id, name: member.name })}
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="team-footer">
          <p className="team-footer-text">
            {canContinue 
              ? 'Your team is ready! Continue to create your first sprint.' 
              : 'Add at least one team member to continue.'}
          </p>
          <button 
            className="btn btn-primary btn-lg" 
            onClick={onContinue}
            disabled={!canContinue}
          >
            Continue to Sprints
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleDeleteMember}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${memberToDelete?.name} from the team? They will be removed from any future sprints.`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  )
}
