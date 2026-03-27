'use client'

import dynamic from 'next/dynamic'
import { useEffect, useCallback, useState } from 'react'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'

const MarkdownPreview = dynamic(() => import('@uiw/react-markdown-preview'), {
  ssr: false,
})

interface MemoDetailProps {
  memo: Memo | null
  isOpen: boolean
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => Promise<void>
  onSummaryUpdate: (memoId: string, summary: string) => Promise<void>
}

export default function MemoDetail({
  memo,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onSummaryUpdate,
}: MemoDetailProps) {
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  useEffect(() => {
    if (!isOpen) {
      setIsSummarizing(false)
    }
    setActionError(null)
  }, [isOpen, memo?.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      personal: 'bg-blue-100 text-blue-800',
      work: 'bg-green-100 text-green-800',
      study: 'bg-purple-100 text-purple-800',
      idea: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || colors.other
  }

  const handleDelete = async () => {
    if (!memo) return

    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      try {
        await onDelete(memo.id)
        onClose()
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : '메모 삭제 중 오류가 발생했습니다.'
        )
      }
    }
  }

  const handleEdit = () => {
    if (!memo) return

    onEdit(memo)
    onClose()
  }

  const handleGenerateSummary = useCallback(async () => {
    if (!memo) return

    setIsSummarizing(true)
    setActionError(null)

    try {
      const response = await fetch('/api/summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: memo.title,
          content: memo.content,
        }),
      })

      const result = (await response.json()) as {
        summary?: string
        error?: string
      }

      if (!response.ok || !result.summary) {
        throw new Error(
          result.error ?? 'AI 요약 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.'
        )
      }

      await onSummaryUpdate(memo.id, result.summary)
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'AI 요약 생성 중 오류가 발생했습니다.'
      )
    } finally {
      setIsSummarizing(false)
    }
  }, [memo, onSummaryUpdate])

  if (!isOpen || !memo) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[60vw] max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-2xl font-bold text-gray-900 break-words">
              {memo.title}
            </h2>
            <div className="flex items-center gap-3 mt-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(memo.category)}`}
              >
                {MEMO_CATEGORIES[
                  memo.category as keyof typeof MEMO_CATEGORIES
                ] || memo.category}
              </span>
              <span className="text-sm text-gray-500">
                작성: {formatDate(memo.createdAt)}
              </span>
              {memo.createdAt !== memo.updatedAt && (
                <span className="text-sm text-gray-500">
                  수정: {formatDate(memo.updatedAt)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6">
          <section className="mb-6 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900">AI 요약</h3>
                {memo.summary ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {memo.summary}
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    아직 생성된 요약이 없습니다. 버튼을 눌러 메모 핵심 내용을 빠르게
                    정리할 수 있습니다.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                data-testid="generate-summary-btn"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSummarizing
                  ? '요약 생성 중...'
                  : memo.summary
                    ? '요약 다시 생성'
                    : '요약 생성'}
              </button>
            </div>

            {actionError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {actionError}
              </p>
            )}
          </section>

          <div data-color-mode="light" className="memo-markdown-wrapper">
            <MarkdownPreview
              source={memo.content}
              className="memo-markdown"
              disallowedElements={['script', 'style', 'iframe', 'object', 'embed']}
            />
          </div>

          {memo.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-6 pt-4 border-t border-gray-100">
              {memo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            편집
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
