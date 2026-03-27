'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  createMemoAction,
  deleteMemoAction,
  importMemosAction,
  listMemosAction,
  seedMemosAction,
  updateMemoAction,
  updateMemoSummaryAction,
} from '@/app/actions/memos'
import { Memo, MemoFormData } from '@/types/memo'
import { localStorageUtils } from '@/utils/localStorage'

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  return error instanceof Error ? error.message : fallbackMessage
}

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isImportingLocal, setIsImportingLocal] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const loadMemos = useCallback(async () => {
    setLoading(true)

    try {
      const loadedMemos = await listMemosAction()
      setMemos(loadedMemos)
      setError(null)
    } catch (error) {
      console.error('Failed to load memos:', error)
      setError(getErrorMessage(error, '메모를 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMemos()
  }, [loadMemos])

  const createMemo = useCallback(
    async (formData: MemoFormData): Promise<Memo> => {
      setIsSubmitting(true)

      try {
        const newMemo = await createMemoAction(formData)
        setMemos(prev => [newMemo, ...prev])
        setError(null)

        return newMemo
      } catch (error) {
        const message = getErrorMessage(error, '메모를 저장하지 못했습니다.')
        setError(message)
        throw new Error(message)
      } finally {
        setIsSubmitting(false)
      }
    },
    []
  )

  const updateMemo = useCallback(
    async (id: string, formData: MemoFormData): Promise<Memo> => {
      setIsSubmitting(true)

      try {
        const updatedMemo = await updateMemoAction(id, formData)
        setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
        setError(null)

        return updatedMemo
      } catch (error) {
        const message = getErrorMessage(error, '메모를 수정하지 못했습니다.')
        setError(message)
        throw new Error(message)
      } finally {
        setIsSubmitting(false)
      }
    },
    []
  )

  const updateMemoSummary = useCallback(
    async (id: string, summary: string): Promise<Memo> => {
      setIsSubmitting(true)

      try {
        const updatedMemo = await updateMemoSummaryAction(id, summary)
        setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
        setError(null)

        return updatedMemo
      } catch (error) {
        const message = getErrorMessage(error, '메모 요약을 저장하지 못했습니다.')
        setError(message)
        throw new Error(message)
      } finally {
        setIsSubmitting(false)
      }
    },
    []
  )

  const deleteMemo = useCallback(async (id: string): Promise<void> => {
    setIsSubmitting(true)

    try {
      await deleteMemoAction(id)
      setMemos(prev => prev.filter(memo => memo.id !== id))
      setError(null)
    } catch (error) {
      const message = getErrorMessage(error, '메모를 삭제하지 못했습니다.')
      setError(message)
      throw new Error(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const importLocalMemos = useCallback(async (): Promise<{ importedCount: number }> => {
    const localMemos = localStorageUtils.getMemos()

    if (localMemos.length === 0) {
      return { importedCount: 0 }
    }

    setIsImportingLocal(true)

    try {
      const result = await importMemosAction(localMemos)
      await loadMemos()
      setError(null)
      return result
    } catch (error) {
      const message = getErrorMessage(error, '로컬 메모를 가져오지 못했습니다.')
      setError(message)
      throw new Error(message)
    } finally {
      setIsImportingLocal(false)
    }
  }, [loadMemos])

  const seedSampleMemos = useCallback(async (): Promise<{ seededCount: number }> => {
    setIsSeeding(true)

    try {
      const result = await seedMemosAction()
      await loadMemos()
      setError(null)
      return result
    } catch (error) {
      const message = getErrorMessage(error, '샘플 메모를 생성하지 못했습니다.')
      setError(message)
      throw new Error(message)
    } finally {
      setIsSeeding(false)
    }
  }, [loadMemos])

  const dismissError = useCallback(() => {
    setError(null)
  }, [])

  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  const getMemoById = useCallback(
    (id: string): Memo | undefined => {
      return memos.find(memo => memo.id === id)
    },
    [memos]
  )

  const filteredMemos = useMemo(() => {
    let filtered = memos

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [memos, selectedCategory, searchQuery])

  const clearLocalMemos = useCallback((): void => {
    localStorageUtils.clearMemos()
  }, [])

  const stats = useMemo(() => {
    const totalMemos = memos.length
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: totalMemos,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    memos: filteredMemos,
    allMemos: memos,
    loading,
    isSubmitting,
    isImportingLocal,
    isSeeding,
    error,
    searchQuery,
    selectedCategory,
    stats,
    createMemo,
    updateMemo,
    updateMemoSummary,
    deleteMemo,
    getMemoById,
    searchMemos,
    filterByCategory,
    importLocalMemos,
    seedSampleMemos,
    clearLocalMemos,
    refreshMemos: loadMemos,
    dismissError,
  }
}
