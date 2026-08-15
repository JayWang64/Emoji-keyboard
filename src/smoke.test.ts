import { describe, it, expect } from 'vitest'
import { harnessWorks } from './smoke'

describe('test harness', () => {
  it('runs', () => {
    expect(harnessWorks()).toBe(true)
  })
})
