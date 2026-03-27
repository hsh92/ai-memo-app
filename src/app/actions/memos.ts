'use server'

import { v4 as uuidv4 } from 'uuid'
import { Memo, MemoFormData } from '@/types/memo'
import { mapMemoRowToMemo, mapMemoToInsert } from '@/utils/memoMapper'
import { sampleMemos } from '@/utils/seedData'
import { createSupabaseServerClient } from '@/utils/supabase'

const MEMO_COLUMNS = 'id, title, content, summary, category, tags, created_at, updated_at'

const buildErrorMessage = (defaultMessage: string, error?: { message: string }) => {
  return error?.message ? `${defaultMessage}: ${error.message}` : defaultMessage
}

const normalizeImportedMemo = (memo: Memo): Memo => {
  const now = new Date().toISOString()

  return {
    id: memo.id,
    title: memo.title.trim(),
    content: memo.content.trim(),
    summary: memo.summary?.trim() || undefined,
    category: memo.category.trim(),
    tags: memo.tags.map(tag => tag.trim()).filter(Boolean),
    createdAt: memo.createdAt || now,
    updatedAt: memo.updatedAt || now,
  }
}

export async function listMemosAction(): Promise<Memo[]> {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('memos')
    .select(MEMO_COLUMNS)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(buildErrorMessage('메모 목록을 불러오지 못했습니다', error))
  }

  return (data ?? []).map(mapMemoRowToMemo)
}

export async function createMemoAction(formData: MemoFormData): Promise<Memo> {
  const supabase = createSupabaseServerClient()
  const now = new Date().toISOString()
  const newMemo: Memo = {
    id: uuidv4(),
    title: formData.title.trim(),
    content: formData.content.trim(),
    category: formData.category,
    tags: formData.tags,
    createdAt: now,
    updatedAt: now,
  }

  const { data, error } = await supabase
    .from('memos')
    .insert(mapMemoToInsert(newMemo))
    .select(MEMO_COLUMNS)
    .single()

  if (error) {
    throw new Error(buildErrorMessage('메모를 저장하지 못했습니다', error))
  }

  return mapMemoRowToMemo(data)
}

export async function updateMemoAction(id: string, formData: MemoFormData): Promise<Memo> {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('memos')
    .update({
      title: formData.title.trim(),
      content: formData.content.trim(),
      category: formData.category,
      tags: formData.tags,
      summary: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(MEMO_COLUMNS)
    .single()

  if (error) {
    throw new Error(buildErrorMessage('메모를 수정하지 못했습니다', error))
  }

  return mapMemoRowToMemo(data)
}

export async function updateMemoSummaryAction(id: string, summary: string): Promise<Memo> {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('memos')
    .update({
      summary: summary.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(MEMO_COLUMNS)
    .single()

  if (error) {
    throw new Error(buildErrorMessage('메모 요약을 저장하지 못했습니다', error))
  }

  return mapMemoRowToMemo(data)
}

export async function deleteMemoAction(id: string): Promise<void> {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('memos').delete().eq('id', id)

  if (error) {
    throw new Error(buildErrorMessage('메모를 삭제하지 못했습니다', error))
  }
}

export async function seedMemosAction(): Promise<{ seededCount: number }> {
  const supabase = createSupabaseServerClient()
  const rows = sampleMemos.map(mapMemoToInsert)
  const { error } = await supabase.from('memos').upsert(rows, { onConflict: 'id' })

  if (error) {
    throw new Error(buildErrorMessage('샘플 메모를 생성하지 못했습니다', error))
  }

  return { seededCount: rows.length }
}

export async function importMemosAction(
  memos: Memo[]
): Promise<{ importedCount: number }> {
  if (memos.length === 0) {
    return { importedCount: 0 }
  }

  const supabase = createSupabaseServerClient()
  const normalizedMemos = memos.map(normalizeImportedMemo)
  const rows = normalizedMemos.map(mapMemoToInsert)
  const { error } = await supabase.from('memos').upsert(rows, { onConflict: 'id' })

  if (error) {
    throw new Error(buildErrorMessage('로컬 메모를 가져오지 못했습니다', error))
  }

  return { importedCount: rows.length }
}
