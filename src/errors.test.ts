import { describe, it, expect } from 'vitest'
import { NotImplementedError } from './errors'

describe('NotImplementedError', () => {
  it('should create error with method name', () => {
    const err = new NotImplementedError('sendMessage')
    expect(err.message).toBe('sendMessage is not implemented')
    expect(err.name).toBe('NotImplementedError')
  })
})