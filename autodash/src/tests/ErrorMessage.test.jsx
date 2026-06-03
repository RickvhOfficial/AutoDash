import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ErrorMessage from '../components/ErrorMessage'

describe('ErrorMessage', () => {
  test('toont foutmelding', () => {
    render(<ErrorMessage message="API niet bereikbaar" />)
    expect(screen.getByText('API niet bereikbaar')).toBeInTheDocument()
    expect(screen.getByText(/Oeps/)).toBeInTheDocument()
  })

  test('retry-knop roept callback aan', () => {
    const onRetry = vi.fn()
    render(<ErrorMessage message="Fout" onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /probeer opnieuw/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
