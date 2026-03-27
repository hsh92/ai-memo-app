import { Database } from '@/types/database'
import { Memo } from '@/types/memo'

export type MemoRow = Database['public']['Tables']['memos']['Row']
export type MemoInsert = Database['public']['Tables']['memos']['Insert']
export type MemoUpdate = Database['public']['Tables']['memos']['Update']

export const mapMemoRowToMemo = (row: MemoRow): Memo => {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    summary: row.summary ?? undefined,
    category: row.category,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const mapMemoToInsert = (memo: Memo): MemoInsert => {
  return {
    id: memo.id,
    title: memo.title,
    content: memo.content,
    summary: memo.summary ?? null,
    category: memo.category,
    tags: memo.tags,
    created_at: memo.createdAt,
    updated_at: memo.updatedAt,
  }
}

export const mapMemoToUpdate = (
  partialMemo: Partial<Memo> & Pick<Memo, 'id'>
): MemoUpdate => {
  return {
    id: partialMemo.id,
    title: partialMemo.title,
    content: partialMemo.content,
    summary:
      partialMemo.summary === undefined ? undefined : (partialMemo.summary ?? null),
    category: partialMemo.category,
    tags: partialMemo.tags,
    created_at: partialMemo.createdAt,
    updated_at: partialMemo.updatedAt,
  }
}
