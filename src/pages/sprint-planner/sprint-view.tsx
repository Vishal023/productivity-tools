import { useState } from 'react'
import { useSprintPlannerStore, useCurrentSprint } from '@/store/sprint-planner'
import { Dashboard } from './dashboard'
import { TeamTable } from './team-table'
import { Backlog } from './backlog'
import { AssignedTickets } from './assigned-tickets'
import { EditSprintDialog } from './dialogs/edit-sprint'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Calendar, Trash2, Settings2 } from 'lucide-react'
import { formatDate } from '@/lib/calculations'

interface SprintViewProps {
  releaseId: string
  onManageTeam: () => void
}

export function SprintView({ releaseId: _releaseId, onManageTeam: _onManageTeam }: SprintViewProps) {
  const { deleteSprint } = useSprintPlannerStore()
  const sprint = useCurrentSprint()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!sprint) {
    return (
      <div className="sprint-empty">
        <Calendar className="sprint-empty-icon" />
        <h3>No Sprint Yet</h3>
        <p>Click "Add Sprint" above to create your first sprint</p>
      </div>
    )
  }

  return (
    <>
      <div className="sprint-content">
        <div className="sprint-title-bar">
          <div className="sprint-title-info">
            <h3>{sprint.name}</h3>
            <span className="sprint-title-dates">
              {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
            </span>
            {sprint.adhocReserve > 0 && (
              <span className="sprint-title-reserve">
                {sprint.adhocReserve}% reserve
              </span>
            )}
          </div>
          <div className="sprint-title-actions">
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setShowEditDialog(true)}
            >
              <Settings2 />
              Edit
            </button>
            <button 
              className="btn btn-ghost btn-sm btn-danger-text"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 />
              Delete
            </button>
          </div>
        </div>

        <Dashboard />
        
        <div className="sprint-section">
          <Backlog />
        </div>

        <div className="sprint-section">
          <TeamTable />
        </div>

        <div className="sprint-section">
          <AssignedTickets />
        </div>
      </div>

      <EditSprintDialog open={showEditDialog} onClose={() => setShowEditDialog(false)} />
      
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteSprint(sprint.id)}
        title="Delete Sprint"
        message={`Are you sure you want to delete "${sprint.name}"? This will remove all assigned tickets and capacity data.`}
        confirmText="Delete Sprint"
        variant="danger"
      />
    </>
  )
}
