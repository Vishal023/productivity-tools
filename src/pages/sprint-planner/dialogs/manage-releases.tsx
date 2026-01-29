import { useState } from 'react'
import { useSprintPlannerStore } from '@/store/sprint-planner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { X, Package, Calendar, Pencil, Trash2, Plus, ChevronRight } from 'lucide-react'
import { formatDate, calculateReleaseMetrics } from '@/lib/calculations'
import type { Release } from '@/types'

interface ManageReleasesDialogProps {
  open: boolean
  onClose: () => void
  onCreateNew: () => void
}

export function ManageReleasesDialog({ open, onClose, onCreateNew }: ManageReleasesDialogProps) {
  const { releases, sprints, currentReleaseId, setCurrentRelease, deleteRelease, updateRelease } = useSprintPlannerStore()
  const [editingRelease, setEditingRelease] = useState<Release | null>(null)
  const [releaseToDelete, setReleaseToDelete] = useState<Release | null>(null)

  const releaseList = Object.values(releases).sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )

  if (!open) return null

  const handleSelectRelease = (releaseId: string) => {
    setCurrentRelease(releaseId)
    onClose()
  }

  const handleDeleteConfirm = () => {
    if (releaseToDelete) {
      deleteRelease(releaseToDelete.id)
      setReleaseToDelete(null)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Manage Releases</h3>
            <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }} onClick={onClose}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
          
          <div className="modal-body" style={{ padding: 0 }}>
            {releaseList.length === 0 ? (
              <div className="empty-state" style={{ padding: '48px 24px' }}>
                <Package className="empty-state-icon" />
                <h3>No Releases Yet</h3>
                <p>Create your first release to start planning sprints</p>
                <button className="btn btn-primary" onClick={() => { onClose(); onCreateNew(); }}>
                  <Plus />
                  Create Release
                </button>
              </div>
            ) : (
              <div className="release-list">
                {releaseList.map(release => {
                  const metrics = calculateReleaseMetrics(release, sprints)
                  const isActive = release.id === currentReleaseId
                  
                  return (
                    <div 
                      key={release.id} 
                      className={`release-list-item ${isActive ? 'active' : ''}`}
                    >
                      <div className="release-list-main" onClick={() => handleSelectRelease(release.id)}>
                        <div className="release-list-icon">
                          <Package />
                        </div>
                        <div className="release-list-info">
                          <div className="release-list-name">
                            {release.name}
                            {isActive && <span className="release-list-badge">Current</span>}
                          </div>
                          <div className="release-list-meta">
                            <span className="release-list-dates">
                              <Calendar />
                              {formatDate(release.startDate)} - {formatDate(release.endDate)}
                            </span>
                            <span className="release-list-sprints">
                              {release.sprintIds.length} sprint{release.sprintIds.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="release-list-metrics">
                          <div className="release-list-metric">
                            <span className="release-list-metric-value">{metrics.totalPlanned.toFixed(0)}</span>
                            <span className="release-list-metric-label">Planned</span>
                          </div>
                          <div className="release-list-metric">
                            <span className="release-list-metric-value" style={{ color: '#10b981' }}>
                              {metrics.totalDelivered.toFixed(0)}
                            </span>
                            <span className="release-list-metric-label">Delivered</span>
                          </div>
                          <div className="release-list-metric">
                            <span 
                              className="release-list-metric-value"
                              style={{ color: metrics.completionRate >= 100 ? '#10b981' : metrics.completionRate >= 80 ? '#f59e0b' : '#f43f5e' }}
                            >
                              {metrics.completionRate.toFixed(0)}%
                            </span>
                            <span className="release-list-metric-label">Done</span>
                          </div>
                        </div>
                        <ChevronRight className="release-list-arrow" />
                      </div>
                      <div className="release-list-actions">
                        <button 
                          className="btn btn-ghost btn-icon"
                          onClick={(e) => { e.stopPropagation(); setEditingRelease(release); }}
                          title="Edit release"
                        >
                          <Pencil />
                        </button>
                        <button 
                          className="btn btn-ghost btn-icon"
                          onClick={(e) => { e.stopPropagation(); setReleaseToDelete(release); }}
                          title="Delete release"
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {releaseList.length > 0 && (
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => { onClose(); onCreateNew(); }}>
                <Plus />
                New Release
              </button>
            </div>
          )}
        </div>
      </div>

      {editingRelease && (
        <EditReleaseDialog
          release={editingRelease}
          onClose={() => setEditingRelease(null)}
          onSave={(updates) => {
            updateRelease(editingRelease.id, updates)
            setEditingRelease(null)
          }}
        />
      )}

      <ConfirmDialog
        open={!!releaseToDelete}
        onClose={() => setReleaseToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Release"
        message={`Are you sure you want to delete "${releaseToDelete?.name}"? This will also delete all ${releaseToDelete?.sprintIds.length || 0} sprint(s) and their data.`}
        confirmText="Delete Release"
        variant="danger"
      />
    </>
  )
}

interface EditReleaseDialogProps {
  release: Release
  onClose: () => void
  onSave: (updates: Partial<Release>) => void
}

function EditReleaseDialog({ release, onClose, onSave }: EditReleaseDialogProps) {
  const [name, setName] = useState(release.name)
  const [startDate, setStartDate] = useState(release.startDate)
  const [endDate, setEndDate] = useState(release.endDate)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !startDate || !endDate) return
    onSave({ name, startDate, endDate })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Release</h3>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }} onClick={onClose}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="label">Release Name</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="label">End Date</label>
                <input
                  type="date"
                  className="input"
                  value={endDate}
                  min={startDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!name || !startDate || !endDate}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
