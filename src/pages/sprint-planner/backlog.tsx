import { useState, useRef, type FormEvent } from 'react'
import { useSprintPlannerStore, useCurrentSprint } from '@/store/sprint-planner'
import { parseTicketId, buildJiraUrl, isJiraTicketFormat, extractJiraId } from '@/lib/calculations'
import { Plus, X, ExternalLink, Inbox } from 'lucide-react'

export function Backlog() {
  const sprint = useCurrentSprint()
  const { addToBacklog, removeFromBacklog, assignTicket } = useSprintPlannerStore()
  const [ticketInput, setTicketInput] = useState('')
  const [ticketSp, setTicketSp] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  if (!sprint) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const input = ticketInput.trim()
    if (!input) return

    // Check if it's a Jira ticket format
    const jiraId = extractJiraId(input)
    
    if (jiraId) {
      // It's a Jira ticket - use the Jira ID as both id and display
      addToBacklog(sprint.id, { id: jiraId, sp: parseFloat(ticketSp) || 0 })
    } else {
      // It's a free-form text - generate ID, store title
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2)
      addToBacklog(sprint.id, { id, title: input, sp: parseFloat(ticketSp) || 0 })
    }
    
    setTicketInput('')
    setTicketSp('')
    inputRef.current?.focus()
  }

  const totalSp = sprint.backlog.reduce((sum, t) => sum + t.sp, 0)

  // Get display text for a ticket
  const getTicketDisplay = (ticket: { id: string; title?: string }) => {
    return ticket.title || ticket.id
  }

  // Check if ticket should show Jira link
  const shouldShowJiraLink = (ticket: { id: string; title?: string }) => {
    // If it has a title, the id is generated (not a Jira ID)
    if (ticket.title) return false
    // Check if the id looks like a Jira ticket
    return isJiraTicketFormat(ticket.id)
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
                  <span className="backlog-ticket-title">
                    {getTicketDisplay(ticket)}
                  </span>
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
