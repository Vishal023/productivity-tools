import type { IStorageAdapter } from '../types'

/**
 * LocalStorage Adapter
 * Implements IStorageAdapter using browser localStorage
 */
export class LocalStorageAdapter implements IStorageAdapter {
  private prefix: string

  constructor(prefix: string = 'sprint-planner') {
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.getKey(key))
      if (!item) return null
      return JSON.parse(item) as T
    } catch (error) {
      console.error(`[LocalStorage] Error reading key "${key}":`, error)
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value))
    } catch (error) {
      console.error(`[LocalStorage] Error writing key "${key}":`, error)
      throw error
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.getKey(key))
    } catch (error) {
      console.error(`[LocalStorage] Error removing key "${key}":`, error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('[LocalStorage] Error clearing storage:', error)
      throw error
    }
  }
}
