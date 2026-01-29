import { useState, type FormEvent } from 'react'
import { useSprintPlannerStore, useCurrentSprint } from '@/store/sprint-planner'
import { getInitials, buildJiraUrl, parseTicketId, calculatePlannedSp, calculateCompletedSp, calculateAdhocSp } from '@/lib/calculations'
import { Plus, ExternalLink, Check, Zap } from 'lucide-react'

export function AssignedTickets() {
  const sprint = useCurrentSprint()

  if (!sprint) return null

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Assigned Tickets</h3>
      </div>
      <div className="card-content">
        <div className="assigned-list">
          {sprint.members.map(member => (
            <MemberSection key={member.id} memberId={member.id} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MemberSection({ memberId }: { memberId: string }) {
  const sprint = useCurrentSprint()
  const { unassignTicket, removeTicketFromMember, addTicketToMember, toggleTicketCompleted, toggleTicketAdhoc } = useSprintPlannerStore()
  const [showAddForm, setShowAddForm] = useState(false)

  if (!sprint) return null

  const member = sprint.members.find(m => m.id === memberId)
  if (!member) return null

  const tickets = sprint.jiraTickets[memberId] || []
  const plannedSp = calculatePlannedSp(sprint, memberId)
  const adhocSp = calculateAdhocSp(sprint, memberId)
  const completedSp = calculateCompletedSp(sprint, memberId)
  const totalSp = plannedSp + adhocSp

  return (
    <div className="member-section">
      <div className="member-section-header">
        <div className="member-section-left">
          <div className="avatar avatar-sm">{getInitials(member.name)}</div>
          <span className="member-section-name">{member.name}</span>
        </div>
        <div className="member-section-right">
          <span className="member-section-stats">
            <span className="stat-done">{completedSp.toFixed(1)}</span>
            <span className="stat-sep">/</span>
            <span className="stat-total">{totalSp.toFixed(1)}</span>
            <span className="stat-label">SP</span>
          </span>
          <button 
            className="btn-add-ticket"
            onClick={() => setShowAddForm(!showAddForm)}
            title="Add ticket"
          >
            <Plus />
          </button>
        </div>
      </div>

      {showAddForm && (
        <AddTicketInline
          onAdd={(ticket) => {
            addTicketToMember(sprint.id, memberId, ticket)
            setShowAddForm(false)
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {tickets.length === 0 && !showAddForm ? (
        <p className="member-section-empty">No tickets yet</p>
      ) : (
        <div className="ticket-list">
          {tickets.map(ticket => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onToggleComplete={() => toggleTicketCompleted(sprint.id, memberId, ticket.id)}
              onToggleAdhoc={() => toggleTicketAdhoc(sprint.id, memberId, ticket.id)}
              onUnassign={() => unassignTicket(sprint.id, memberId, ticket.id)}
              onRemove={() => removeTicketFromMember(sprint.id, memberId, ticket.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TicketRow({ 
  ticket, 
  onToggleComplete, 
  onToggleAdhoc,
  onUnassign,
  onRemove
}: { 
  ticket: { id: string; sp: number; completed?: boolean; isAdhoc?: boolean }
  onToggleComplete: () => void
  onToggleAdhoc: () => void
  onUnassign: () => void
  onRemove: () => void
}) {
  return (
    <div className={`ticket-row ${ticket.completed ? 'completed' : ''}`}>
      <button
        className={`ticket-checkbox ${ticket.completed ? 'checked' : ''}`}
        onClick={onToggleComplete}
        title={ticket.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {ticket.completed && <Check />}
      </button>
      
      <a
        href={buildJiraUrl(ticket.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="ticket-id"
      >
        {ticket.id}
        <ExternalLink />
      </a>

      <span className="ticket-sp">{ticket.sp} SP</span>

      <div className="ticket-badges">
        <button
          className={`badge-btn adhoc ${ticket.isAdhoc ? 'active' : ''}`}
          onClick={onToggleAdhoc}
        >
          <Zap />
          Adhoc
        </button>

        <button
          className={`badge-btn done ${ticket.completed ? 'active' : ''}`}
          onClick={onToggleComplete}
        >
          <Check />
          Done
        </button>

        <button className="badge-btn" onClick={onUnassign}>
          Backlog
        </button>

        <button className="badge-btn remove" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  )
}

function AddTicketInline({ 
  onAdd, 
  onCancel 
}: { 
  onAdd: (ticket: { id: string; sp: number; isAdhoc?: boolean }) => void
  onCancel: () => void
}) {
  const [ticketId, setTicketId] = useState('')
  const [ticketSp, setTicketSp] = useState('')
  const [isAdhoc, setIsAdhoc] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = parseTicketId(ticketId)
    if (!parsed) return

    onAdd({ id: parsed, sp: parseFloat(ticketSp) || 0, isAdhoc })
  }

  return (
    <form className="add-ticket-inline" onSubmit={handleSubmit}>
      <input
        placeholder="PROJ-123"
        value={ticketId}
        onChange={e => setTicketId(e.target.value)}
        className="input"
        autoFocus
      />
      <input
        type="number"
        placeholder="SP"
        step="any"
        min="0"
        value={ticketSp}
        onChange={e => setTicketSp(e.target.value)}
        className="input input-sp"
      />
      <button 
        type="button"
        className={`btn-adhoc ${isAdhoc ? 'active' : ''}`}
        onClick={() => setIsAdhoc(!isAdhoc)}
        title="Mark as adhoc"
      >
        <Zap />
      </button>
      <button type="submit" className="btn btn-primary btn-sm" disabled={!ticketId.trim()}>
        Add
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
        Cancel
      </button>
    </form>
  )
}
