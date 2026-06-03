import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '../components/Footer'

describe('Footer', () => {
  test('toont het projectnaam', () => {
    render(<Footer />)
    expect(screen.getByText(/AutoDash/)).toBeInTheDocument()
  })

  test('toont het huidige jaar', () => {
    render(<Footer />)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
  })
})
