'use client'

import { useCallback, useState } from 'react'
import { useMemos } from '@/hooks/useMemos'
import { Memo, MemoFormData } from '@/types/memo'
import MemoList from '@/components/MemoList'
import MemoForm from '@/components/MemoForm'
import MemoDetail from '@/components/MemoDetail'

export default function Home() {
  const {
    memos,
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
    importLocalMemos,
    seedSampleMemos,
    clearLocalMemos,
    searchMemos,
    filterByCategory,
    dismissError,
  } = useMemos()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)
  const [viewingMemo, setViewingMemo] = useState<Memo | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const handleCreateMemo = async (formData: MemoFormData) => {
    await createMemo(formData)
    setIsFormOpen(false)
    setNotice('메모를 저장했습니다.')
  }

  const handleUpdateMemo = async (formData: MemoFormData) => {
    if (editingMemo) {
      await updateMemo(editingMemo.id, formData)
      setEditingMemo(null)
      setIsFormOpen(false)
      setNotice('메모를 수정했습니다.')
    }
  }

  const handleEditMemo = (memo: Memo) => {
    setEditingMemo(memo)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingMemo(null)
  }

  const handleViewMemo = (memo: Memo) => {
    setViewingMemo(memo)
  }

  const handleEditFromDetail = (memo: Memo) => {
    setViewingMemo(null)
    setEditingMemo(memo)
    setIsFormOpen(true)
  }

  const handleDeleteFromDetail = async (id: string) => {
    await deleteMemo(id)
    setViewingMemo(null)
    setNotice('메모를 삭제했습니다.')
  }

  const handleSummaryUpdate = useCallback(
    async (memoId: string, summary: string) => {
      const updatedMemo = await updateMemoSummary(memoId, summary)
      setViewingMemo(prev => (prev && prev.id === memoId ? updatedMemo : prev))
      setNotice('AI 요약을 저장했습니다.')
    },
    [updateMemoSummary]
  )

  const handleImportLocalData = useCallback(async () => {
    try {
      const result = await importLocalMemos()

      if (result.importedCount === 0) {
        setNotice('가져올 로컬 메모가 없습니다.')
        return
      }

      setNotice(`${result.importedCount}개의 로컬 메모를 가져왔습니다.`)
    } catch {
      // 훅에서 에러 상태를 관리합니다.
    }
  }, [importLocalMemos])

  const handleSeedSampleData = useCallback(async () => {
    try {
      const result = await seedSampleMemos()
      setNotice(`${result.seededCount}개의 샘플 메모를 동기화했습니다.`)
    } catch {
      // 훅에서 에러 상태를 관리합니다.
    }
  }, [seedSampleMemos])

  const handleClearLocalData = useCallback(() => {
    if (!window.confirm('브라우저 LocalStorage 메모를 정말 비우시겠습니까?')) {
      return
    }

    clearLocalMemos()
    setNotice('브라우저 LocalStorage 메모를 비웠습니다.')
  }, [clearLocalMemos])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">📝 메모 앱</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Supabase 데이터베이스와 서버 액션으로 메모를 관리합니다.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => void handleImportLocalData()}
                disabled={isImportingLocal || isSubmitting}
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isImportingLocal ? '로컬 데이터 가져오는 중...' : '로컬 데이터 가져오기'}
              </button>
              <button
                type="button"
                onClick={() => void handleSeedSampleData()}
                disabled={isSeeding || isSubmitting}
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSeeding ? '샘플 데이터 생성 중...' : '샘플 데이터 생성'}
              </button>
              <button
                type="button"
                onClick={handleClearLocalData}
                className="inline-flex items-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100"
              >
                로컬 데이터 비우기
              </button>
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                새 메모
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex items-center justify-between gap-4">
              <span>{error}</span>
              <button
                type="button"
                onClick={dismissError}
                className="font-medium text-red-700 underline-offset-2 hover:underline"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {notice && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <div className="flex items-center justify-between gap-4">
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="font-medium text-green-700 underline-offset-2 hover:underline"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        <MemoList
          memos={memos}
          loading={loading}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onSearchChange={searchMemos}
          onCategoryChange={filterByCategory}
          onViewMemo={handleViewMemo}
          onEditMemo={handleEditMemo}
          onDeleteMemo={id => {
            void (async () => {
              try {
                await deleteMemo(id)
                if (viewingMemo?.id === id) {
                  setViewingMemo(null)
                }
                setNotice('메모를 삭제했습니다.')
              } catch {
                // 훅에서 에러 상태를 관리합니다.
              }
            })()
          }}
          stats={stats}
        />
      </main>

      {/* 상세 보기 모달 */}
      <MemoDetail
        memo={viewingMemo}
        isOpen={viewingMemo !== null}
        onClose={() => setViewingMemo(null)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
        onSummaryUpdate={handleSummaryUpdate}
      />

      {/* 모달 폼 */}
      <MemoForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingMemo ? handleUpdateMemo : handleCreateMemo}
        editingMemo={editingMemo}
        isSubmitting={isSubmitting}
        submitError={error}
      />
    </div>
  )
}
