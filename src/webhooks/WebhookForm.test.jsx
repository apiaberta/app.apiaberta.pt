import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WebhookForm from './WebhookForm'
import { MOCK_EVENTS, MANY_EVENTS } from './fixtures'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

const post = vi.fn()
const patch = vi.fn()

vi.mock('../api/client', () => ({
  default: {
    post: (...args) => post(...args),
    patch: (...args) => patch(...args),
  },
}))

function renderForm(props = {}) {
  const onSubmitSuccess = vi.fn()
  const onCancel = vi.fn()
  const view = render(
    <WebhookForm
      catalog={MOCK_EVENTS}
      catalogStatus="ok"
      onSubmitSuccess={onSubmitSuccess}
      onCancel={onCancel}
      {...props}
    />
  )
  return { ...view, onSubmitSuccess, onCancel }
}

describe('WebhookForm', () => {
  beforeEach(() => {
    post.mockReset()
    patch.mockReset()
    post.mockResolvedValue({
      data: { id: 'wh_1', url: 'https://api.meusite.pt/hook', events: [], filters: {}, active: true },
    })
    patch.mockResolvedValue({
      data: { id: 'wh_1', url: 'https://api.meusite.pt/hook', events: [], filters: {}, active: true },
    })
  })

  it('renders string, enum and number filters for a selected event', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('checkbox', { name: /Contratos públicos/i }))

    const local = screen.getByLabelText('Local')
    const value = screen.getByLabelText('Valor mínimo (€)')
    expect(local.tagName).toBe('INPUT')
    expect(local).toHaveAttribute('type', 'text')
    expect(local).toHaveAttribute('placeholder', 'Fundão, Castelo Branco…')
    expect(value.tagName).toBe('INPUT')
    expect(value).toHaveAttribute('type', 'number')

    await user.click(screen.getByRole('checkbox', { name: /Aviso meteorológico/i }))
    const level = screen.getByLabelText('Nível')
    expect(level.tagName).toBe('SELECT')
    expect(screen.getByRole('option', { name: 'Vermelho' })).toBeInTheDocument()
  })

  it('builds a POST payload with filled filters and omits empty ones', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('URL de destino (HTTPS)'), 'https://api.meusite.pt/hook')
    await user.click(screen.getByRole('checkbox', { name: /Contratos públicos/i }))
    await user.type(screen.getByLabelText('Local'), 'Fundão')
    await user.click(screen.getByRole('checkbox', { name: /Aviso meteorológico/i }))

    expect(screen.getByText('Contratos públicos · local contém Fundão')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Criar webhook' }))

    expect(post).toHaveBeenCalledTimes(1)
    const [path, body, config] = post.mock.calls[0]
    expect(path).toBe('/v1/webhooks')
    expect(config.headers.Authorization).toBe('Bearer test-token')
    expect(body).toEqual({
      url: 'https://api.meusite.pt/hook',
      events: ['base.contract.new', 'ipma.warning.new'],
      filters: {
        'base.contract.new': { local: 'Fundão' },
      },
    })
    expect(body.filters['ipma.warning.new']).toBeUndefined()
  })

  it('sends number filters as numbers', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('URL de destino (HTTPS)'), 'https://api.meusite.pt/hook')
    await user.click(screen.getByRole('checkbox', { name: /Contratos públicos/i }))
    await user.type(screen.getByLabelText('Valor mínimo (€)'), '10000')
    await user.click(screen.getByRole('button', { name: 'Criar webhook' }))

    expect(post.mock.calls[0][1].filters).toEqual({
      'base.contract.new': { value: 10000 },
    })
  })

  it('rejects non-https URLs without calling the API', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('URL de destino (HTTPS)'), 'http://api.meusite.pt/hook')
    await user.click(screen.getByRole('checkbox', { name: /Preços de combustível/i }))
    await user.click(screen.getByRole('button', { name: 'Criar webhook' }))

    expect(post).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('https://')
  })

  it('prefills the edit form and PATCHes including cleared filters', async () => {
    const user = userEvent.setup()
    renderForm({
      mode: 'edit',
      webhook: {
        id: 'wh_1',
        url: 'https://api.meusite.pt/hook',
        events: ['base.contract.new'],
        filters: { 'base.contract.new': { local: 'Fundão', value: 10000 } },
        active: true,
      },
    })

    expect(screen.getByLabelText('URL de destino (HTTPS)')).toHaveValue('https://api.meusite.pt/hook')
    expect(screen.getByRole('checkbox', { name: /Contratos públicos/i })).toBeChecked()
    expect(screen.getByLabelText('Local')).toHaveValue('Fundão')
    expect(screen.getByLabelText('Valor mínimo (€)')).toHaveValue(10000)

    await user.clear(screen.getByLabelText('Local'))
    await user.clear(screen.getByLabelText('Valor mínimo (€)'))
    await user.click(screen.getByRole('button', { name: 'Guardar alterações' }))

    expect(patch).toHaveBeenCalledTimes(1)
    const [path, body] = patch.mock.calls[0]
    expect(path).toBe('/v1/webhooks/wh_1')
    expect(body).toEqual({
      url: 'https://api.meusite.pt/hook',
      events: ['base.contract.new'],
      filters: {},
    })
  })

  it('shows search when the catalog is large', () => {
    renderForm({ catalog: MANY_EVENTS })
    expect(screen.getByPlaceholderText('Pesquisar eventos, conectores…')).toBeInTheDocument()
  })
})
