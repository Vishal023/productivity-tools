import { useState, useRef, type FormEvent } from 'react'
import { useSprintPlannerStore, useCurrentSprint } from '@/store/sprint-planner'
import { buildJiraUrl, isJiraTicketFormat, extractJiraId } from '@/lib/calculations'
import { Plus, X, ExternalLink, Inbox, Pencil, Check } from 'lucide-react'

export function Backlog() {
  const sprint = useCurrentSprint()
  const { addToBacklog, updateBacklogTicket, removeFromBacklog, assignTicket } = useSprintPlannerStore()
  const [ticketInput, setTicketInput] = useState('')
  const [ticketSp, setTicketSp] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  if (!sprint) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const input = ticketInput.trim()
    if (!input) return

    const jiraId = extractJiraId(input)
    
    if (jiraId) {
      addToBacklog(sprint.id, { id: jiraId, sp: parseFloat(ticketSp) || 0 })
    } else {
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2)
      addToBacklog(sprint.id, { id, title: input, sp: parseFloat(ticketSp) || 0 })
    }
    
    setTicketInput('')
    setTicketSp('')
    inputRef.current?.focus()
  }

  const startEdit = (ticket: { id: string; title?: string }) => {
    setEditingId(ticket.id)
    setEditTitle(ticket.title || '')
  }

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      updateBacklogTicket(sprint.id, editingId, { title: editTitle.trim() })
    }
    setEditingId(null)
    setEditTitle('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const totalSp = sprint.backlog.reduce((sum, t) => sum + t.sp, 0)

  const getTicketDisplay = (ticket: { id: string; title?: string }) => {
    return ticket.title || ticket.id
  }

  const shouldShowJiraLink = (ticket: { id: string; title?: string }) => {
    if (ticket.title) return false
    return isJiraTicketFormat(ticket.id)
  }

  const needsTitle = (ticket: { id: string; title?: string }) => {
    return !ticket.title && !isJiraTicketFormat(ticket.id)
  }

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
            placeholder="PROJ-123 or description"
            value={ticketInput}
            onChange={e => setTicketInput(e.target.value)}
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
          <button type="submit" className="backlog-add" disabled={!ticketInput.trim()}>
            <Plus />
          </button>
        </form>

        {sprint.backlog.length === 0 ? (
          <div className="backlog-empty">
            <Inbox />
            <p>No backlog items</p>
            <span>Add tickets or tasks above</span>
          </div>
        ) : (
          <div className="backlog-list">
            {sprint.backlog.map(ticket => (
              <div key={ticket.id} className="backlog-item">
                {editingId === ticket.id ? (
                  <div className="backlog-edit-row">
                    <input
                      className="backlog-edit-input"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      autoFocus
                    />
                    <button className="backlog-edit-save" onClick={saveEdit}>
                      <Check />
                    </button>
                    <button className="backlog-edit-cancel" onClick={cancelEdit}>
                      <X />
                    </button>
                  </div>
                ) : (
                  <>
                    {shouldShowJiraLink(ticket) ? (
                      <a
                        href={buildJiraUrl(ticket.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="backlog-ticket-id"
                      >
                        {getTicketDisplay(ticket)}
                        <ExternalLink />
                      </a>
                    ) : (
                      <span 
                        className={`backlog-ticket-title ${needsTitle(ticket) ? 'needs-title' : ''}`}
                        onClick={() => needsTitle(ticket) && startEdit(ticket)}
                      >
                        {getTicketDisplay(ticket)}
                        {needsTitle(ticket) && <Pencil className="edit-hint" />}
                      </span>
                    )}
                    {!needsTitle(ticket) && ticket.title && (
                      <button className="backlog-edit-btn" onClick={() => startEdit(ticket)}>
                        <Pencil />
                      </button>
                    )}
                  </>
                )}
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
