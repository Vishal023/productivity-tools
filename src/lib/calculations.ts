import type { SprintMember, Sprint, UtilizationStatus, Release } from '@/types'

export const JIRA_BASE_URL = 'https://celigo.atlassian.net/browse/'

export const buildJiraUrl = (ticketId: string) => `${JIRA_BASE_URL}${ticketId}`

export const parseTicketId = (input: string): string | null => {
  const cleaned = input.trim().toUpperCase()
  const urlMatch = cleaned.match(/([A-Z]+-\d+)/)
  if (urlMatch) return urlMatch[1]
  const directMatch = cleaned.match(/^[A-Z]+-\d+$/)
  if (directMatch) return cleaned
  return null
}

export const getInitials = (name: string) => 
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export const calculateAvailable = (member: SprintMember, adhocReserve: number = 0) => {
  const raw = member.capacity - member.leaves - member.holidays - member.nonJira
  const available = raw * (1 - adhocReserve / 100)
  return Math.max(0, available)
}

export const calculateActualAvailable = (member: SprintMember, adhocReserve: number = 0) => {
  const available = calculateAvailable(member, adhocReserve)
  return Math.max(0, available - (member.unplannedLeaves || 0))
}

export const calculatePlannedSp = (sprint: Sprint, memberId: string) => {
  const tickets = sprint.jiraTickets[memberId] || []
  return tickets.filter(t => !t.isAdhoc).reduce((sum, t) => sum + t.sp, 0)
}

export const calculateAdhocSp = (sprint: Sprint, memberId: string) => {
  const tickets = sprint.jiraTickets[memberId] || []
  return tickets.filter(t => t.isAdhoc).reduce((sum, t) => sum + t.sp, 0)
}

export const calculateTotalSp = (sprint: Sprint, memberId: string) => {
  const tickets = sprint.jiraTickets[memberId] || []
  return tickets.reduce((sum, t) => sum + t.sp, 0)
}

export const calculateCompletedSp = (sprint: Sprint, memberId: string) => {
  const tickets = sprint.jiraTickets[memberId] || []
  return tickets.filter(t => t.completed).reduce((sum, t) => sum + t.sp, 0)
}

export const calculateCompletedPlannedSp = (sprint: Sprint, memberId: string) => {
  const tickets = sprint.jiraTickets[memberId] || []
  return tickets.filter(t => t.completed && !t.isAdhoc).reduce((sum, t) => sum + t.sp, 0)
}

export const calculateCompletedAdhocSp = (sprint: Sprint, memberId: string) => {
  const tickets = sprint.jiraTickets[memberId] || []
  return tickets.filter(t => t.completed && t.isAdhoc).reduce((sum, t) => sum + t.sp, 0)
}

export const getMemberStatus = (plannedUtil: number): UtilizationStatus => {
  if (plannedUtil < 85) return 'under'
  if (plannedUtil >= 85 && plannedUtil <= 100) return 'balanced'
  return 'over'
}

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

export const calculateSprintMetrics = (sprint: Sprint) => {
  let totalAvailable = 0
  let totalActualAvailable = 0
  let totalPlanned = 0
  let totalAdhoc = 0
  let totalDelivered = 0
  let totalDeliveredPlanned = 0
  let totalDeliveredAdhoc = 0
  let totalUnplannedLeaves = 0
  let underCount = 0
  let balancedCount = 0
  let overCount = 0

  for (const member of sprint.members) {
    const available = calculateAvailable(member, sprint.adhocReserve)
    const actualAvailable = calculateActualAvailable(member, sprint.adhocReserve)
    const plannedSp = calculatePlannedSp(sprint, member.id)
    const adhocSp = calculateAdhocSp(sprint, member.id)
    const completedSp = calculateCompletedSp(sprint, member.id)
    const completedPlannedSp = calculateCompletedPlannedSp(sprint, member.id)
    const completedAdhocSp = calculateCompletedAdhocSp(sprint, member.id)
    const plannedUtil = available > 0 ? (plannedSp / available) * 100 : 0

    totalAvailable += available
    totalActualAvailable += actualAvailable
    totalPlanned += plannedSp
    totalAdhoc += adhocSp
    totalDelivered += completedSp
    totalDeliveredPlanned += completedPlannedSp
    totalDeliveredAdhoc += completedAdhocSp
    totalUnplannedLeaves += (member.unplannedLeaves || 0)

    const status = getMemberStatus(plannedUtil)
    if (status === 'under') underCount++
    else if (status === 'balanced') balancedCount++
    else overCount++
  }

  const plannedUtil = totalAvailable > 0 ? (totalPlanned / totalAvailable) * 100 : 0
  const actualUtil = totalActualAvailable > 0 ? (totalDelivered / totalActualAvailable) * 100 : 0
  const completionRate = totalPlanned > 0 ? (totalDeliveredPlanned / totalPlanned) * 100 : 0

  return {
    totalAvailable,
    totalActualAvailable,
    totalUnplannedLeaves,
    totalPlanned,
    totalAdhoc,
    totalDelivered,
    totalDeliveredPlanned,
    totalDeliveredAdhoc,
    plannedUtil,
    actualUtil,
    completionRate,
    underCount,
    balancedCount,
    overCount
  }
}

export const calculateReleaseMetrics = (release: Release, sprints: Record<string, Sprint>) => {
  const releaseSprints = release.sprintIds.map(id => sprints[id]).filter(Boolean)
  
  let totalAvailable = 0
  let totalActualAvailable = 0
  let totalPlanned = 0
  let totalAdhoc = 0
  let totalDelivered = 0
  let totalDeliveredPlanned = 0
  let totalUnplannedLeaves = 0

  const sprintMetrics = releaseSprints.map(sprint => {
    const metrics = calculateSprintMetrics(sprint)
    totalAvailable += metrics.totalAvailable
    totalActualAvailable += metrics.totalActualAvailable
    totalPlanned += metrics.totalPlanned
    totalAdhoc += metrics.totalAdhoc
    totalDelivered += metrics.totalDelivered
    totalDeliveredPlanned += metrics.totalDeliveredPlanned
    totalUnplannedLeaves += metrics.totalUnplannedLeaves
    return { sprint, metrics }
  })

  const plannedUtil = totalAvailable > 0 ? (totalPlanned / totalAvailable) * 100 : 0
  const actualUtil = totalActualAvailable > 0 ? (totalDelivered / totalActualAvailable) * 100 : 0
  const completionRate = totalPlanned > 0 ? (totalDeliveredPlanned / totalPlanned) * 100 : 0

  return {
    totalAvailable,
    totalActualAvailable,
    totalUnplannedLeaves,
    totalPlanned,
    totalAdhoc,
    totalDelivered,
    totalDeliveredPlanned,
    plannedUtil,
    actualUtil,
    completionRate,
    sprintCount: releaseSprints.length,
    sprintMetrics
  }
}
