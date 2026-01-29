import { useState, useRef, type FormEvent } from 'react'
import { useSprintPlannerStore, useCurrentSprint } from '@/store/sprint-planner'
import { parseTicketId, buildJiraUrl } from '@/lib/calculations'
import { Plus, X, ExternalLink, Inbox } from 'lucide-react'

export function Backlog() {
  const sprint = useCurrentSprint()
  const { addToBacklog, removeFromBacklog, assignTicket } = useSprintPlannerStore()
  const [ticketId, setTicketId] = useState('')
  const [ticketSp, setTicketSp] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  if (!sprint) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = parseTicketId(ticketId)
    if (!parsed) return

    addToBacklog(sprint.id, { id: parsed, sp: parseFloat(ticketSp) || 0 })
    setTicketId('')
    setTicketSp('')
    inputRef.current?.focus()
  }

  const totalSp = sprint.backlog.reduce((sum, t) => sum + t.sp, 0)

  return (
    <div className="card backlog-card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Sprint Backlog</h3>
          {sprint.backlog.length > 0 && (
            <p className="card-subtitle">
              {sprint.backlog.length} item{sprint.backlog.length !== 1 ? 's' : ''} · {totalSp.toFixed(1)} SP
            </p>
          )}
        </div>
      </div>
      <div className="card-content">
        <form className="backlog-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="backlog-input"
            placeholder="PROJ-123"
            value={ticketId}
            onChange={e => setTicketId(e.target.value)}
          />
          <input
            type="number"
            className="backlog-sp"
            placeholder="SP"
            step="any"
            min="0"
            value={ticketSp}
            onChange={e => setTicketSp(e.target.value)}
          />
          <button type="submit" className="backlog-add" disabled={!ticketId.trim()}>
            <Plus />
          </button>
        </form>

        {sprint.backlog.length === 0 ? (
          <div className="backlog-empty">
            <Inbox />
            <p>No backlog items</p>
            <span>Add Jira tickets above</span>
          </div>
        ) : (
          <div className="backlog-list">
            {sprint.backlog.map(ticket => (
              <div key={ticket.id} className="backlog-item">
                <a
                  href={buildJiraUrl(ticket.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="backlog-ticket-id"
                >
                  {ticket.id}
                  <ExternalLink />
                </a>
                <span className="backlog-ticket-sp">{ticket.sp}</span>
                <select 
                  className="backlog-assign"
                  defaultValue=""
                  onChange={e => {
                    if (e.target.value) {
                      assignTicket(sprint.id, ticket.id, e.target.value)
                      e.target.value = ''
                    }
                  }}
                >
                  <option value="">Assign</option>
                  {sprint.members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <button
                  className="backlog-remove"
                  onClick={() => removeFromBacklog(sprint.id, ticket.id)}
                >
                  <X />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
