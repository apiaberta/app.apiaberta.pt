import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WebhookSecretPanel from './WebhookSecretPanel'

describe('WebhookSecretPanel', () => {
  it('shows the secret, copy button and one-time warning', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    const onDismiss = vi.fn()
    render(
      <WebhookSecretPanel
        secret="whsec_abc123"
        reason="create"
        onDismiss={onDismiss}
      />
    )

    expect(screen.getByRole('dialog', { name: 'Guarda o segredo de assinatura' })).toBeInTheDocument()
    expect(screen.getByText('whsec_abc123')).toBeInTheDocument()
    expect(screen.getByText(/só é mostrado agora/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Copiar' }))
    expect(writeText).toHaveBeenCalledWith('whsec_abc123')
    expect(await screen.findByRole('button', { name: 'Copiado' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Já guardei' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not close when the dimmed backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(
      <WebhookSecretPanel
        secret="whsec_abc123"
        reason="rotate"
        onDismiss={onDismiss}
      />
    )

    expect(screen.getByRole('heading', { name: 'Novo segredo de assinatura' })).toBeInTheDocument()
    await user.click(screen.getByRole('dialog').parentElement)
    expect(onDismiss).not.toHaveBeenCalled()
    expect(screen.getByText('whsec_abc123')).toBeInTheDocument()
  })
})
