import { describe, expect, it } from 'vitest'
import { GAME_TITLE } from './App.tsx'

describe('빈 앱', () => {
  it('제목은 낱말탑', () => {
    expect(GAME_TITLE).toBe('낱말탑')
  })
})
