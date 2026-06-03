import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../components/LoadingSpinner'

describe('LoadingSpinner', () => {
  test('toont standaard laadtekst', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('Data laden...')).toBeInTheDocument()
  })

  test('toont aangepaste boodschap', () => {
    render(<LoadingSpinner message="Races worden geladen..." />)
    expect(screen.getByText('Races worden geladen...')).toBeInTheDocument()
  })
})
