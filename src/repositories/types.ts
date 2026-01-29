import type { TeamMember, Sprint, Release, SprintPlannerState } from '@/types'

/**
 * Repository response wrapper for async operations
 */
export interface RepositoryResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Team Repository Interface
 * Handles team member CRUD operations
 */
export interface ITeamRepository {
  getTeamName(): Promise<string>
  setTeamName(name: string): Promise<RepositoryResponse<void>>
  
  getTeamMembers(): Promise<TeamMember[]>
  addTeamMember(member: Omit<TeamMember, 'id'>): Promise<RepositoryResponse<TeamMember>>
  updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<RepositoryResponse<TeamMember>>
  deleteTeamMember(id: string): Promise<RepositoryResponse<void>>
}

/**
 * Release Repository Interface
 * Handles release CRUD operations
 */
export interface IReleaseRepository {
  getReleases(): Promise<Record<string, Release>>
  getRelease(id: string): Promise<Release | null>
  createRelease(release: Omit<Release, 'id' | 'sprintIds'>): Promise<RepositoryResponse<Release>>
  updateRelease(id: string, updates: Partial<Release>): Promise<RepositoryResponse<Release>>
  deleteRelease(id: string): Promise<RepositoryResponse<void>>
  addSprintToRelease(releaseId: string, sprintId: string): Promise<RepositoryResponse<void>>
  removeSprintFromRelease(releaseId: string, sprintId: string): Promise<RepositoryResponse<void>>
}

/**
 * Sprint Repository Interface
 * Handles sprint CRUD operations
 */
export interface ISprintRepository {
  getSprints(): Promise<Record<string, Sprint>>
  getSprint(id: string): Promise<Sprint | null>
  createSprint(sprint: Omit<Sprint, 'id' | 'backlog' | 'jiraTickets'>): Promise<RepositoryResponse<Sprint>>
  updateSprint(id: string, updates: Partial<Sprint>): Promise<RepositoryResponse<Sprint>>
  deleteSprint(id: string): Promise<RepositoryResponse<void>>
}

/**
 * Session Repository Interface
 * Handles current selection state (could be server session or local)
 */
export interface ISessionRepository {
  getCurrentReleaseId(): Promise<string | null>
  setCurrentReleaseId(id: string | null): Promise<RepositoryResponse<void>>
  getCurrentSprintId(): Promise<string | null>
  setCurrentSprintId(id: string | null): Promise<RepositoryResponse<void>>
}

/**
 * Combined Sprint Planner Repository Interface
 * Aggregates all domain repositories
 */
export interface ISprintPlannerRepository {
  team: ITeamRepository
  releases: IReleaseRepository
  sprints: ISprintRepository
  session: ISessionRepository
  
  /**
   * Load all data at once (for initial hydration)
   */
  loadAll(): Promise<SprintPlannerState>
  
  /**
   * Save entire state (for bulk operations)
   */
  saveAll(state: SprintPlannerState): Promise<RepositoryResponse<void>>
  
  /**
   * Clear all data
   */
  clearAll(): Promise<RepositoryResponse<void>>
}

/**
 * Storage adapter interface - low level storage operations
 * Can be implemented for localStorage, IndexedDB, API, etc.
 */
export interface IStorageAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
}
