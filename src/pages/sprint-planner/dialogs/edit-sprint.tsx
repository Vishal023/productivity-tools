import { useState, useEffect } from 'react'
import { useSprintPlannerStore, useCurrentSprint } from '@/store/sprint-planner'
import { X } from 'lucide-react'

interface EditSprintDialogProps {
  open: boolean
  onClose: () => void
}

export function EditSprintDialog({ open, onClose }: EditSprintDialogProps) {
  const sprint = useCurrentSprint()
  const { updateSprint } = useSprintPlannerStore()
  
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [capacity, setCapacity] = useState('')
  const [adhoc, setAdhoc] = useState('')

  useEffect(() => {
    if (sprint) {
      setName(sprint.name)
      setStartDate(sprint.startDate)
      setEndDate(sprint.endDate)
      setCapacity(String(sprint.defaultCapacity))
      setAdhoc(String(sprint.adhocReserve))
    }
  }, [sprint])

  if (!open || !sprint) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSprint(sprint.id, {
      name,
      startDate,
      endDate,
      defaultCapacity: parseFloat(capacity) || 10,
      adhocReserve: parseFloat(adhoc) || 15
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Sprint Settings</h3>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }} onClick={onClose}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Sprint Name</label>
              <input
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                required
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
                  required
                />
              </div>
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  className="input"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="label">Default Capacity (SP)</label>
                <input
                  type="number"
                  className="input input-mono"
                  value={capacity}
                  onChange={e => setCapacity(e.target.value)}
                  min="1"
                  step="any"
                  required
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
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}
