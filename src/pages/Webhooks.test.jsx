import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Webhooks from './Webhooks'
import { MOCK_EVENTS, MOCK_REFS } from '../webhooks/fixtures'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

const get = vi.fn()
const post = vi.fn()
const patch = vi.fn()
const del = vi.fn()

vi.mock('../api/client', () => ({
  default: {
    get: (...args) => get(...args),
    post: (...args) => post(...args),
    patch: (...args) => patch(...args),
    delete: (...args) => del(...args),
  },
}))

const EXISTING = {
  id: 'wh_existing',
  url: 'https://hooks.meusite.pt/events',
  events: ['fuel.prices.updated'],
  filters: {},
  active: true,
  createdAt: '2026-01-15T10:00:00.000Z',
}

function renderPage() {
  return render(
    <MemoryRouter>
      <Webhooks />
    </MemoryRouter>
  )
}

describe('Webhooks page', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    patch.mockReset()
    del.mockReset()
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })

    get.mockImplementation(path => {
      if (String(path) === '/v1/webhooks') {
        return Promise.resolve({ data: { data: [EXISTING] } })
      }
      if (String(path) === '/v1/webhooks/events') {
        return Promise.resolve({ data: { events: MOCK_EVENTS, refs: MOCK_REFS } })
      }
      return Promise.resolve({ data: { data: [] } })
    })
  })

  it('shows the signing secret after create and ignores a late list refresh', async () => {
    const user = userEvent.setup()
    get.mockImplementation(path => {
      if (String(path) === '/v1/webhooks') {
        return Promise.resolve({ data: { data: [] } })
      }
      if (String(path) === '/v1/webhooks/events') {
        return Promise.resolve({ data: { events: MOCK_EVENTS, refs: MOCK_REFS } })
      }
      return Promise.resolve({ data: { data: [] } })
    })
    post.mockResolvedValue({
      data: {
        id: 'wh_1',
        url: 'https://api.meusite.pt/hook',
        events: ['fuel.prices.updated'],
        filters: {},
        active: true,
        createdAt: '2026-11-27T10:00:00.000Z',
        secret: 'whsec_only_once',
        note: 'Store the secret securely — it will not be shown again.',
      },
    })

    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Criar primeiro webhook' }))
    await user.type(screen.getByLabelText('URL de destino (HTTPS)'), 'https://api.meusite.pt/hook')
    await user.click(screen.getByRole('checkbox', { name: /Preços de combustíveis/i }))
    await user.click(screen.getByRole('button', { name: 'Criar webhook' }))

    const dialog = await screen.findByRole('dialog', { name: 'Guarda o segredo de assinatura' })
    expect(within(dialog).getByText('whsec_only_once')).toBeInTheDocument()
    expect(within(dialog).getByText(/só é mostrado agora/i)).toBeInTheDocument()
    expect(screen.getByText('https://api.meusite.pt/hook')).toBeInTheDocument()
    expect(screen.queryByText('whsec_only_once', { selector: 'code.truncate' })).not.toBeInTheDocument()
  })

  it('keeps the secret when the initial list fetch arrives after create', async () => {
    const user = userEvent.setup()
    let resolveList
    get.mockImplementation(path => {
      if (String(path) === '/v1/webhooks') {
        return new Promise(resolve => { resolveList = resolve })
      }
      if (String(path) === '/v1/webhooks/events') {
        return Promise.resolve({ data: { events: MOCK_EVENTS, refs: MOCK_REFS } })
      }
      return Promise.resolve({ data: { data: [] } })
    })
    post.mockResolvedValue({
      data: {
        id: 'wh_1',
        url: 'https://api.meusite.pt/hook',
        events: ['fuel.prices.updated'],
        secret: 'whsec_race',
      },
    })

    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Novo webhook' }))
    await user.type(screen.getByLabelText('URL de destino (HTTPS)'), 'https://api.meusite.pt/hook')
    await user.click(screen.getByRole('checkbox', { name: /Preços de combustíveis/i }))
    await user.click(screen.getByRole('button', { name: 'Criar webhook' }))

    expect(await screen.findByText('whsec_race')).toBeInTheDocument()
    resolveList({ data: { data: [] } })
    await waitFor(() => {
      expect(screen.getByText('whsec_race')).toBeInTheDocument()
      expect(screen.getByText('https://api.meusite.pt/hook')).toBeInTheDocument()
    })
  })

  it('rotates the secret and shows the new value in the same panel', async () => {
    const user = userEvent.setup()
    post.mockResolvedValue({
      data: { id: 'wh_existing', secret: 'whsec_rotated', note: 'Store the new secret.' },
    })

    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Gerar novo segredo' }))
    expect(post).not.toHaveBeenCalled()
    expect(screen.getByText('O segredo antigo deixa de funcionar imediatamente.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sim, gerar novo' }))
    expect(post).toHaveBeenCalledWith(
      '/v1/webhooks/wh_existing/rotate-secret',
      {},
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      })
    )

    const dialog = await screen.findByRole('dialog', { name: 'Novo segredo de assinatura' })
    expect(within(dialog).getByText('whsec_rotated')).toBeInTheDocument()
  })

  it('shows a simple message when rotate-secret returns 404', async () => {
    const user = userEvent.setup()
    post.mockRejectedValue({ response: { status: 404, data: { message: 'Webhook not found' } } })

    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Gerar novo segredo' }))
    await user.click(screen.getByRole('button', { name: 'Sim, gerar novo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Este webhook já não existe.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows a simple message when rotate-secret fails', async () => {
    const user = userEvent.setup()
    post.mockRejectedValue({ response: { status: 500 } })

    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Gerar novo segredo' }))
    await user.click(screen.getByRole('button', { name: 'Sim, gerar novo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível gerar o novo segredo.')
  })

  it('does not rotate when the confirmation is cancelled', async () => {
    const user = userEvent.setup()

    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Gerar novo segredo' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(post).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Gerar novo segredo' })).toBeInTheDocument()
  })
})
