import type { ISprintPlannerRepository, IStorageAdapter } from './types'
import { SprintPlannerRepository } from './sprint-planner.repository'
import { LocalStorageAdapter } from './storage-adapters/local-storage.adapter'

// Re-export types
export type { 
  ISprintPlannerRepository, 
  ITeamRepository, 
  IReleaseRepository, 
  ISprintRepository,
  ISessionRepository,
  IStorageAdapter,
  RepositoryResponse 
} from './types'

// Re-export implementations
export { SprintPlannerRepository } from './sprint-planner.repository'
export { LocalStorageAdapter } from './storage-adapters/local-storage.adapter'

/**
 * Storage backend types
 */
export type StorageBackend = 'localStorage' | 'api'

/**
 * Repository configuration
 */
export interface RepositoryConfig {
  backend: StorageBackend
  apiBaseUrl?: string  // For future API implementation
  storagePrefix?: string
}

/**
 * Create a repository instance based on configuration
 * This factory makes it easy to swap storage backends
 */
export function createRepository(config: RepositoryConfig = { backend: 'localStorage' }): ISprintPlannerRepository {
  let adapter: IStorageAdapter

  switch (config.backend) {
    case 'localStorage':
      adapter = new LocalStorageAdapter(config.storagePrefix || 'sprint-planner')
      break
    
    case 'api':
      // Future: implement API adapter
      // adapter = new ApiStorageAdapter(config.apiBaseUrl!)
      throw new Error('API backend not yet implemented')
    
    default:
      throw new Error(`Unknown storage backend: ${config.backend}`)
  }

  return new SprintPlannerRepository(adapter)
}

/**
 * Default repository instance using localStorage
 */
let defaultRepository: ISprintPlannerRepository | null = null

export function getRepository(): ISprintPlannerRepository {
  if (!defaultRepository) {
    defaultRepository = createRepository({ backend: 'localStorage' })
  }
  return defaultRepository
}

/**
 * Reset repository (useful for testing)
 */
export function resetRepository(): void {
  defaultRepository = null
}
