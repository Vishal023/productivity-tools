import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { SprintPlannerState, Sprint, SprintMember, JiraTicket, Release, TeamMember } from '@/types'
import { getRepository, type ISprintPlannerRepository } from '@/repositories'

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

interface SprintPlannerActions {
  // Initialization
  hydrate: () => Promise<void>
  
  // Team actions
  setTeamName: (name: string) => void
  addTeamMember: (name: string, defaultCapacity: number) => void
  updateTeamMember: (id: string, name: string, defaultCapacity: number) => void
  removeTeamMember: (id: string) => void
  
  // Release actions
  createRelease: (release: Omit<Release, 'id' | 'sprintIds'>) => void
  updateRelease: (id: string, updates: Partial<Release>) => void
  deleteRelease: (id: string) => void
  setCurrentRelease: (id: string | null) => void
  
  // Sprint actions
  createSprint: (sprint: Omit<Sprint, 'id' | 'backlog' | 'jiraTickets'>) => void
  updateSprint: (id: string, updates: Partial<Sprint>) => void
  deleteSprint: (id: string) => void
  setCurrentSprint: (id: string | null) => void
  
  // Sprint member actions
  updateSprintMember: (sprintId: string, memberId: string, updates: Partial<SprintMember>) => void
  addMemberToSprint: (sprintId: string, memberId: string, capacityInfo?: { leaves: number; holidays: number; nonJira: number }) => void
  removeMemberFromSprint: (sprintId: string, memberId: string) => void
  
  // Ticket actions
  addToBacklog: (sprintId: string, ticket: JiraTicket) => void
  removeFromBacklog: (sprintId: string, ticketId: string) => void
  assignTicket: (sprintId: string, ticketId: string, memberId: string) => void
  unassignTicket: (sprintId: string, memberId: string, ticketId: string) => void
  addTicketToMember: (sprintId: string, memberId: string, ticket: JiraTicket) => void
  removeTicketFromMember: (sprintId: string, memberId: string, ticketId: string) => void
  toggleTicketCompleted: (sprintId: string, memberId: string, ticketId: string) => void
  toggleTicketAdhoc: (sprintId: string, memberId: string, ticketId: string) => void
  updateTicket: (sprintId: string, memberId: string, ticketId: string, updates: Partial<JiraTicket>) => void
}

interface StoreState extends SprintPlannerState {
  _hydrated: boolean
}

type SprintPlannerStore = StoreState & SprintPlannerActions

// Get repository instance
const repository: ISprintPlannerRepository = getRepository()

// Helper to persist state after mutations
const persistState = async (state: SprintPlannerState) => {
  await repository.saveAll(state)
}

export const useSprintPlannerStore = create<SprintPlannerStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    _hydrated: false,
    teamName: '',
    team: [],
    releases: {},
    sprints: {},
    currentReleaseId: null,
    currentSprintId: null,

    // Hydrate from repository
    hydrate: async () => {
      try {
        const data = await repository.loadAll()
        set({ ...data, _hydrated: true })
      } catch (error) {
        console.error('Failed to hydrate store:', error)
        set({ _hydrated: true })
      }
    },

    setTeamName: (name) => {
      set({ teamName: name })
    },

    addTeamMember: (name, defaultCapacity) => {
      const id = generateId()
      const newMember: TeamMember = { id, name, defaultCapacity }
      set(state => ({
        team: [...state.team, newMember]
      }))
    },

    updateTeamMember: (id, name, defaultCapacity) => {
      set(state => ({
        team: state.team.map(m => m.id === id ? { ...m, name, defaultCapacity } : m)
      }))
    },

    removeTeamMember: (id) => {
      set(state => ({
        team: state.team.filter(m => m.id !== id)
      }))
    },

    createRelease: (releaseData) => {
      const id = generateId()
      set(state => ({
        releases: {
          ...state.releases,
          [id]: { ...releaseData, id, sprintIds: [] }
        },
        currentReleaseId: id
      }))
    },

    updateRelease: (id, updates) => {
      set(state => ({
        releases: {
          ...state.releases,
          [id]: { ...state.releases[id], ...updates }
        }
      }))
    },

    deleteRelease: (id) => {
      set(state => {
        const release = state.releases[id]
        if (!release) return state

        const { [id]: _, ...restReleases } = state.releases
        const sprintsToDelete = release.sprintIds
        const remainingSprints = { ...state.sprints }
        sprintsToDelete.forEach(sid => delete remainingSprints[sid])

        return {
          releases: restReleases,
          sprints: remainingSprints,
          currentReleaseId: state.currentReleaseId === id ? null : state.currentReleaseId,
          currentSprintId: sprintsToDelete.includes(state.currentSprintId || '') ? null : state.currentSprintId
        }
      })
    },

    setCurrentRelease: (id) => {
      set(state => {
        if (!id) return { currentReleaseId: null, currentSprintId: null }
        const release = state.releases[id]
        const firstSprintId = release?.sprintIds[0] || null
        return { 
          currentReleaseId: id, 
          currentSprintId: release?.sprintIds.includes(state.currentSprintId || '') 
            ? state.currentSprintId 
            : firstSprintId 
        }
      })
    },

    createSprint: (sprintData) => {
      const id = generateId()
      const jiraTickets: Record<string, JiraTicket[]> = {}
      sprintData.members.forEach(m => { jiraTickets[m.id] = [] })
      
      set(state => {
        const release = state.releases[sprintData.releaseId]
        if (!release) return state

        return {
          sprints: {
            ...state.sprints,
            [id]: { ...sprintData, id, backlog: [], jiraTickets }
          },
          releases: {
            ...state.releases,
            [sprintData.releaseId]: {
              ...release,
              sprintIds: [...release.sprintIds, id]
            }
          },
          currentSprintId: id
        }
      })
    },

    updateSprint: (id, updates) => {
      set(state => ({
        sprints: {
          ...state.sprints,
          [id]: { ...state.sprints[id], ...updates }
        }
      }))
    },

    deleteSprint: (id) => {
      set(state => {
        const sprint = state.sprints[id]
        if (!sprint) return state

        const { [id]: _, ...restSprints } = state.sprints
        const release = state.releases[sprint.releaseId]
        
        return {
          sprints: restSprints,
          releases: release ? {
            ...state.releases,
            [sprint.releaseId]: {
              ...release,
              sprintIds: release.sprintIds.filter(sid => sid !== id)
            }
          } : state.releases,
          currentSprintId: state.currentSprintId === id ? null : state.currentSprintId
        }
      })
    },

    setCurrentSprint: (id) => {
      set({ currentSprintId: id })
    },

    updateSprintMember: (sprintId, memberId, updates) => {
      set(state => {
        const sprint = state.sprints[sprintId]
        if (!sprint) return state
        
        return {
          sprints: {
            ...state.sprints,
            [sprintId]: {
              ...sprint,
              members: sprint.members.map(m => 
                m.id === memberId ? { ...m, ...updates } : m
              )
            }
          }
        }
      })
    },

    addMemberToSprint: (sprintId, memberId, capacityInfo) => {
      const teamMember = get().team.find(m => m.id === memberId)
      if (!teamMember) return

      set(state => {
        const sprint = state.sprints[sprintId]
        if (!sprint) return state

        const alreadyInSprint = sprint.members.some(m => m.id === memberId)
        if (alreadyInSprint) return state

        const newMember: SprintMember = {
          id: memberId,
          name: teamMember.name,
          capacity: sprint.defaultCapacity,
          leaves: capacityInfo?.leaves ?? 0,
          unplannedLeaves: 0,
          holidays: capacityInfo?.holidays ?? 0,
          nonJira: capacityInfo?.nonJira ?? 0
        }

        return {
          sprints: {
            ...state.sprints,
            [sprintId]: {
              ...sprint,
              members: [...sprint.members, newMember],
              jiraTickets: { ...sprint.jiraTickets, [memberId]: [] }
            }
          }
        }
      })
    },

    removeMemberFromSprint: (sprintId, memberId) => {
      set(state => {
        const sprint = state.sprints[sprintId]
        if (!sprint) return state

        const memberTickets = sprint.jiraTickets[memberId] || []
        const { [memberId]: _, ...restTickets } = sprint.jiraTickets

        return {
          sprints: {
            ...state.sprints,
            [sprintId]: {
              ...sprint,
              members: sprint.members.filter(m => m.id !== memberId),
              jiraTickets: restTickets,
              backlog: [...sprint.backlog, ...memberTickets]
            }
          }
        }
      })
    },

    addToBacklog: (sprintId, ticket) => {
      set(state => {
        const sprint = state.sprints[sprintId]
        if (!sprint) return state

        const exists = sprint.backlog.find(t => t.id === ticket.id)
        if (exists) return state

        return {
          sprints: {
            ...state.sprints,
            [sprintId]: {
              ...sprint,
              backlog: [...sprint.backlog, ticket]
            }
          }
        }
      })
    },

    removeFromBacklog: (sprintId, ticketId) => {
      set(state => {
        const sprint = state.sprints[sprintId]
        if (!sprint) return state

        return {
          sprints: {
            ...state.sprints,
            [sprintId]: {
              ...sprint,
              backlog: sprint.backlog.filter(t => t.id !== ticketId)
            }
          }
        }
      })
    },

    assignTicket: (sprintId, ticketId, memberId) => {
      set(state => {
        const sprint = state.sprints[sprintId]
        if (!sprint) return state

        const ticket = sprint.backlog.find(t => t.id === ticketId)
        if (!ticket) return state

        return {
          sprints: {
            ...state.sprints,
            [sprintId]: {
              ...sprint,
              backlog: sprint.backlog.filter(t => t.id !== ticketId),
              jiraTickets: {
                ...sprint.jiraTickets,
                [memberId]: [...(sprint.jiraTickets[memberId] || []), ticket]
              }
            }
          }
        }
      })
    },

    unassignTicket: (sprintId, memberId, ticketId) => {
      set(state => {
        const sprint = state.sprints[sprintId]
        if (!sprint) return state

        const ticket = sprint.jiraTickets[memberId]?.find(t => t.id === ticketId)
        if (!ticket) return state

        return {
          sprints: {
            ...state.sprints,
            [sprintId]: {
              ...sprint,
              backlog: [...sprint.backlog, { ...ticket, completed: false, isAdhoc: false }],
              jiraTickets: {
                ...sprint.jiraTickets,
                [memberId]: sprint.jiraTickets[memberId].filter(t => t.id !== ticketId)
              }
            }
          }
        }
      })
    },

    addTicketToMember: (sprintId, memberId, ticket) => {
      set(state => {
        const sprint = state.sprints[sprintId]
        if (!sprint) return state

        const exists = sprint.jiraTickets[memberId]?.find(t => t.id === ticket.id)
        if (exists) return state

        return {
          sprints: {
            ...state.sprints,
            [sprintId]: {
              ...sprint,
              jiraTickets: {
                ...sprint.jiraTickets,
                [memberId]: [...(sprint.jiraTickets[memberId] || []), ticket]
              }
            }
          }
        }
      })
    },

    removeTicketFromMember: (sprintId, memberId, ticketId) => {
      set(state => {
        const sprint = state.sprints[sprintId]
        if (!sprint) return state

        return {
          sprints: {
            ...state.sprints,
            [sprintId]: {
              ...sprint,
              jiraTickets: {
                ...sprint.jiraTickets,
                [memberId]: sprint.jiraTickets[memberId]?.filter(t => t.id !== ticketId) || []
              }
            }
          }
        }
      })
    },

    toggleTicketCompleted: (sprintId, memberId, ticketId) => {
      set(state => {
        const sprint = state.sprints[sprintId]
        if (!sprint) return state

        return {
          sprints: {
            ...state.sprints,
            [sprintId]: {
              ...sprint,
              jiraTickets: {
                ...sprint.jiraTickets,
                [memberId]: sprint.jiraTickets[memberId]?.map(t => 
                  t.id === ticketId ? { ...t, completed: !t.completed } : t
                ) || []
              }
            }
          }
        }
      })
    },

    toggleTicketAdhoc: (sprintId, memberId, ticketId) => {
      set(state => {
        const sprint = state.sprints[sprintId]
        if (!sprint) return state

        return {
          sprints: {
            ...state.sprints,
            [sprintId]: {
              ...sprint,
              jiraTickets: {
                ...sprint.jiraTickets,
                [memberId]: sprint.jiraTickets[memberId]?.map(t => 
                  t.id === ticketId ? { ...t, isAdhoc: !t.isAdhoc } : t
                ) || []
              }
            }
          }
        }
      })
    },

    updateTicket: (sprintId, memberId, ticketId, updates) => {
      set(state => {
        const sprint = state.sprints[sprintId]
        if (!sprint) return state

        return {
          sprints: {
            ...state.sprints,
            [sprintId]: {
              ...sprint,
              jiraTickets: {
                ...sprint.jiraTickets,
                [memberId]: sprint.jiraTickets[memberId]?.map(t => 
                  t.id === ticketId ? { ...t, ...updates } : t
                ) || []
              }
            }
          }
        }
      })
    }
  }))
)

// Subscribe to state changes and persist
useSprintPlannerStore.subscribe(
  (state) => ({
    teamName: state.teamName,
    team: state.team,
    releases: state.releases,
    sprints: state.sprints,
    currentReleaseId: state.currentReleaseId,
    currentSprintId: state.currentSprintId
  }),
  (state) => {
    // Only persist after hydration
    if (useSprintPlannerStore.getState()._hydrated) {
      persistState(state)
    }
  },
  { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
)

// Selector hooks
export const useCurrentRelease = () => {
  const { releases, currentReleaseId } = useSprintPlannerStore()
  return currentReleaseId ? releases[currentReleaseId] : null
}

export const useCurrentSprint = () => {
  const { sprints, currentSprintId } = useSprintPlannerStore()
  return currentSprintId ? sprints[currentSprintId] : null
}

export const useReleaseSprints = (releaseId: string | null) => {
  const { releases, sprints } = useSprintPlannerStore()
  if (!releaseId) return []
  const release = releases[releaseId]
  if (!release) return []
  return release.sprintIds.map(id => sprints[id]).filter(Boolean)
}

export const useIsHydrated = () => {
  return useSprintPlannerStore(state => state._hydrated)
}
