export interface TeamMember {
  id: string
  name: string
  defaultCapacity: number
}

export interface SprintMember {
  id: string
  name: string
  capacity: number
  leaves: number
  unplannedLeaves: number
  holidays: number
  nonJira: number
}

export interface JiraTicket {
  id: string
  sp: number
  isAdhoc?: boolean
  completed?: boolean
}

export interface Sprint {
  id: string
  releaseId: string
  name: string
  startDate: string
  endDate: string
  defaultCapacity: number
  adhocReserve: number
  members: SprintMember[]
  backlog: JiraTicket[]
  jiraTickets: Record<string, JiraTicket[]>
}

export interface Release {
  id: string
  name: string
  startDate: string
  endDate: string
  sprintIds: string[]
}

export interface SprintPlannerState {
  teamName: string
  team: TeamMember[]
  releases: Record<string, Release>
  sprints: Record<string, Sprint>
  currentReleaseId: string | null
  currentSprintId: string | null
}

export type UtilizationStatus = 'under' | 'balanced' | 'over'

export type SprintPlannerTab = 'team' | 'sprints'

export interface StoryPointEntry {
  id: string
  description: string
  minutes: number
}
