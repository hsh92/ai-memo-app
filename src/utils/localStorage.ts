import { Memo } from '@/types/memo'

const STORAGE_KEY = 'memo-app-memos'

export const localStorageUtils = {
  getMemos: (): Memo[] => {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading memos from localStorage:', error)
      return []
    }
  },
  clearMemos: (): void => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing memos from localStorage:', error)
    }
  },
}
