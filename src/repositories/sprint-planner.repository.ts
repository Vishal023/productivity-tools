import type { TeamMember, Sprint, Release, SprintPlannerState, JiraTicket } from '@/types'
import type {
  IStorageAdapter,
  ISprintPlannerRepository,
  ITeamRepository,
  IReleaseRepository,
  ISprintRepository,
  ISessionRepository,
  RepositoryResponse
} from './types'

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

// Storage keys
const KEYS = {
  TEAM_NAME: 'team-name',
  TEAM_MEMBERS: 'team-members',
  RELEASES: 'releases',
  SPRINTS: 'sprints',
  CURRENT_RELEASE_ID: 'current-release-id',
  CURRENT_SPRINT_ID: 'current-sprint-id'
} as const

/**
 * Team Repository Implementation
 */
class TeamRepository implements ITeamRepository {
  constructor(private storage: IStorageAdapter) {}

  async getTeamName(): Promise<string> {
    return (await this.storage.get<string>(KEYS.TEAM_NAME)) || ''
  }

  async setTeamName(name: string): Promise<RepositoryResponse<void>> {
    try {
      await this.storage.set(KEYS.TEAM_NAME, name)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async getTeamMembers(): Promise<TeamMember[]> {
    return (await this.storage.get<TeamMember[]>(KEYS.TEAM_MEMBERS)) || []
  }

  async addTeamMember(member: Omit<TeamMember, 'id'>): Promise<RepositoryResponse<TeamMember>> {
    try {
      const members = await this.getTeamMembers()
      const newMember: TeamMember = { ...member, id: generateId() }
      await this.storage.set(KEYS.TEAM_MEMBERS, [...members, newMember])
      return { success: true, data: newMember }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<RepositoryResponse<TeamMember>> {
    try {
      const members = await this.getTeamMembers()
      const index = members.findIndex(m => m.id === id)
      if (index === -1) {
        return { success: false, error: 'Member not found' }
      }
      const updated = { ...members[index], ...updates }
      members[index] = updated
      await this.storage.set(KEYS.TEAM_MEMBERS, members)
      return { success: true, data: updated }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async deleteTeamMember(id: string): Promise<RepositoryResponse<void>> {
    try {
      const members = await this.getTeamMembers()
      await this.storage.set(KEYS.TEAM_MEMBERS, members.filter(m => m.id !== id))
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

/**
 * Release Repository Implementation
 */
class ReleaseRepository implements IReleaseRepository {
  constructor(private storage: IStorageAdapter) {}

  async getReleases(): Promise<Record<string, Release>> {
    return (await this.storage.get<Record<string, Release>>(KEYS.RELEASES)) || {}
  }

  async getRelease(id: string): Promise<Release | null> {
    const releases = await this.getReleases()
    return releases[id] || null
  }

  async createRelease(release: Omit<Release, 'id' | 'sprintIds'>): Promise<RepositoryResponse<Release>> {
    try {
      const releases = await this.getReleases()
      const newRelease: Release = { ...release, id: generateId(), sprintIds: [] }
      releases[newRelease.id] = newRelease
      await this.storage.set(KEYS.RELEASES, releases)
      return { success: true, data: newRelease }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async updateRelease(id: string, updates: Partial<Release>): Promise<RepositoryResponse<Release>> {
    try {
      const releases = await this.getReleases()
      if (!releases[id]) {
        return { success: false, error: 'Release not found' }
      }
      releases[id] = { ...releases[id], ...updates }
      await this.storage.set(KEYS.RELEASES, releases)
      return { success: true, data: releases[id] }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async deleteRelease(id: string): Promise<RepositoryResponse<void>> {
    try {
      const releases = await this.getReleases()
      delete releases[id]
      await this.storage.set(KEYS.RELEASES, releases)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async addSprintToRelease(releaseId: string, sprintId: string): Promise<RepositoryResponse<void>> {
    try {
      const releases = await this.getReleases()
      if (!releases[releaseId]) {
        return { success: false, error: 'Release not found' }
      }
      releases[releaseId].sprintIds = [...releases[releaseId].sprintIds, sprintId]
      await this.storage.set(KEYS.RELEASES, releases)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async removeSprintFromRelease(releaseId: string, sprintId: string): Promise<RepositoryResponse<void>> {
    try {
      const releases = await this.getReleases()
      if (!releases[releaseId]) {
        return { success: false, error: 'Release not found' }
      }
      releases[releaseId].sprintIds = releases[releaseId].sprintIds.filter(id => id !== sprintId)
      await this.storage.set(KEYS.RELEASES, releases)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

/**
 * Sprint Repository Implementation
 */
class SprintRepository implements ISprintRepository {
  constructor(private storage: IStorageAdapter) {}

  async getSprints(): Promise<Record<string, Sprint>> {
    return (await this.storage.get<Record<string, Sprint>>(KEYS.SPRINTS)) || {}
  }

  async getSprint(id: string): Promise<Sprint | null> {
    const sprints = await this.getSprints()
    return sprints[id] || null
  }

  async createSprint(sprint: Omit<Sprint, 'id' | 'backlog' | 'jiraTickets'>): Promise<RepositoryResponse<Sprint>> {
    try {
      const sprints = await this.getSprints()
      const jiraTickets: Record<string, JiraTicket[]> = {}
      sprint.members.forEach(m => { jiraTickets[m.id] = [] })
      
      const newSprint: Sprint = {
        ...sprint,
        id: generateId(),
        backlog: [],
        jiraTickets
      }
      sprints[newSprint.id] = newSprint
      await this.storage.set(KEYS.SPRINTS, sprints)
      return { success: true, data: newSprint }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async updateSprint(id: string, updates: Partial<Sprint>): Promise<RepositoryResponse<Sprint>> {
    try {
      const sprints = await this.getSprints()
      if (!sprints[id]) {
        return { success: false, error: 'Sprint not found' }
      }
      sprints[id] = { ...sprints[id], ...updates }
      await this.storage.set(KEYS.SPRINTS, sprints)
      return { success: true, data: sprints[id] }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async deleteSprint(id: string): Promise<RepositoryResponse<void>> {
    try {
      const sprints = await this.getSprints()
      delete sprints[id]
      await this.storage.set(KEYS.SPRINTS, sprints)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

/**
 * Session Repository Implementation
 */
class SessionRepository implements ISessionRepository {
  constructor(private storage: IStorageAdapter) {}

  async getCurrentReleaseId(): Promise<string | null> {
    return await this.storage.get<string>(KEYS.CURRENT_RELEASE_ID)
  }

  async setCurrentReleaseId(id: string | null): Promise<RepositoryResponse<void>> {
    try {
      if (id === null) {
        await this.storage.remove(KEYS.CURRENT_RELEASE_ID)
      } else {
        await this.storage.set(KEYS.CURRENT_RELEASE_ID, id)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async getCurrentSprintId(): Promise<string | null> {
    return await this.storage.get<string>(KEYS.CURRENT_SPRINT_ID)
  }

  async setCurrentSprintId(id: string | null): Promise<RepositoryResponse<void>> {
    try {
      if (id === null) {
        await this.storage.remove(KEYS.CURRENT_SPRINT_ID)
      } else {
        await this.storage.set(KEYS.CURRENT_SPRINT_ID, id)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

/**
 * Sprint Planner Repository
 * Main repository that aggregates all domain repositories
 */
export class SprintPlannerRepository implements ISprintPlannerRepository {
  public team: ITeamRepository
  public releases: IReleaseRepository
  public sprints: ISprintRepository
  public session: ISessionRepository

  constructor(private storage: IStorageAdapter) {
    this.team = new TeamRepository(storage)
    this.releases = new ReleaseRepository(storage)
    this.sprints = new SprintRepository(storage)
    this.session = new SessionRepository(storage)
  }

  async loadAll(): Promise<SprintPlannerState> {
    const [teamName, team, releases, sprints, currentReleaseId, currentSprintId] = await Promise.all([
      this.team.getTeamName(),
      this.team.getTeamMembers(),
      this.releases.getReleases(),
      this.sprints.getSprints(),
      this.session.getCurrentReleaseId(),
      this.session.getCurrentSprintId()
    ])

    return {
      teamName,
      team,
      releases,
      sprints,
      currentReleaseId,
      currentSprintId
    }
  }

  async saveAll(state: SprintPlannerState): Promise<RepositoryResponse<void>> {
    try {
      await Promise.all([
        this.storage.set(KEYS.TEAM_NAME, state.teamName),
        this.storage.set(KEYS.TEAM_MEMBERS, state.team),
        this.storage.set(KEYS.RELEASES, state.releases),
        this.storage.set(KEYS.SPRINTS, state.sprints),
        state.currentReleaseId 
          ? this.storage.set(KEYS.CURRENT_RELEASE_ID, state.currentReleaseId)
          : this.storage.remove(KEYS.CURRENT_RELEASE_ID),
        state.currentSprintId
          ? this.storage.set(KEYS.CURRENT_SPRINT_ID, state.currentSprintId)
          : this.storage.remove(KEYS.CURRENT_SPRINT_ID)
      ])
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async clearAll(): Promise<RepositoryResponse<void>> {
    try {
      await this.storage.clear()
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}
