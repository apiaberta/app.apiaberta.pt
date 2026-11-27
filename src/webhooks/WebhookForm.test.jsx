import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WebhookForm from './WebhookForm'
import { MOCK_EVENTS, MANY_EVENTS, MOCK_MUNICIPALITIES, MOCK_REFS } from './fixtures'
import { resetOptionsSourceCache } from './geo'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

const post = vi.fn()
const patch = vi.fn()
const get = vi.fn()

vi.mock('../api/client', () => ({
  default: {
    post: (...args) => post(...args),
    patch: (...args) => patch(...args),
    get: (...args) => get(...args),
  },
}))

function renderForm(props = {}) {
  const onSubmitSuccess = vi.fn()
  const onCancel = vi.fn()
  const view = render(
    <WebhookForm
      catalog={MOCK_EVENTS}
      refs={MOCK_REFS}
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
    resetOptionsSourceCache()
    post.mockReset()
    patch.mockReset()
    get.mockReset()
    post.mockResolvedValue({
      data: {
        id: 'wh_1',
        url: 'https://api.meusite.pt/hook',
        events: [],
        filters: {},
        active: true,
        secret: 'whsec_from_create',
        note: 'Store the secret securely — it will not be shown again.',
      },
    })
    patch.mockResolvedValue({
      data: { id: 'wh_1', url: 'https://api.meusite.pt/hook', events: [], filters: {}, active: true },
    })
    get.mockImplementation(path => {
      if (String(path).includes('/v1/geo/municipalities')) {
        return Promise.resolve({
          data: {
            total: MOCK_MUNICIPALITIES.length,
            page: 1,
            limit: 400,
            pages: 1,
            data: MOCK_MUNICIPALITIES,
          },
        })
      }
      return Promise.resolve({ data: { data: [] } })
    })
  })

  it('loads concelhos from options_source and keeps Fundão when the IPMA region is Castelo Branco', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('checkbox', { name: /Novo aviso meteorológico/i }))

    expect(screen.getAllByText('O filtro aplica-se ao distrito (ex.: Fundão → Castelo Branco).')).toHaveLength(1)
    expect(screen.getByLabelText('Nível mínimo')).toHaveDisplayValue('Amarelo e acima (predefinição)')

    await user.click(screen.getByRole('checkbox', { name: 'Castelo Branco' }))

    const concelho = screen.getByLabelText('Concelho (mapeado à área do distrito)')
    await user.click(concelho)

    expect(await screen.findByRole('option', { name: /Fundão/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Lisboa/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /Concelho/ })).not.toHaveAttribute('type', 'select')

    await user.type(concelho, 'Fund')
    await user.click(screen.getByRole('option', { name: /Fundão/ }))

    await waitFor(() => {
      expect(get).toHaveBeenCalledWith(
        '/v1/geo/municipalities',
        expect.objectContaining({ params: expect.objectContaining({ limit: 400, page: 1 }) })
      )
    })

    await user.type(screen.getByLabelText('URL de destino (HTTPS)'), 'https://api.meusite.pt/hook')
    await user.click(screen.getByRole('button', { name: 'Criar webhook' }))

    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][1].filters).toEqual({
      'ipma.warning.new': {
        region: 'CBO',
        municipality: '0504',
      },
    })
  })

  it('saves the INE code for base.contract.new when picking Fundão by name', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('URL de destino (HTTPS)'), 'https://api.meusite.pt/hook')
    await user.click(screen.getByRole('checkbox', { name: /Novo contrato público/i }))

    const concelho = screen.getByLabelText('Concelho')
    await user.click(concelho)
    await user.type(concelho, 'Fundão')
    await user.click(await screen.findByRole('option', { name: /Fundão/ }))

    expect(screen.getByText('Novo contrato público · concelho é Fundão')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Criar webhook' }))

    expect(post.mock.calls[0][1]).toEqual({
      url: 'https://api.meusite.pt/hook',
      events: ['base.contract.new'],
      filters: {
        'base.contract.new': { municipality: '0504' },
      },
    })
  })

  it('sends number filters as numbers', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('URL de destino (HTTPS)'), 'https://api.meusite.pt/hook')
    await user.click(screen.getByRole('checkbox', { name: /Novo contrato público/i }))
    await user.type(screen.getByLabelText('Valor mínimo (€)'), '10000')
    await user.click(screen.getByRole('button', { name: 'Criar webhook' }))

    expect(post.mock.calls[0][1].filters).toEqual({
      'base.contract.new': { valor_min: 10000 },
    })
  })

  it('rejects non-https URLs without calling the API', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('URL de destino (HTTPS)'), 'http://api.meusite.pt/hook')
    await user.click(screen.getByRole('checkbox', { name: /Preços de combustíveis/i }))
    await user.click(screen.getByRole('button', { name: 'Criar webhook' }))

    expect(post).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('https://')
  })

  it('reads legacy local/concelho keys and PATCHes municipality', async () => {
    const user = userEvent.setup()
    renderForm({
      mode: 'edit',
      webhook: {
        id: 'wh_1',
        url: 'https://api.meusite.pt/hook',
        events: ['base.contract.new'],
        filters: { 'base.contract.new': { local: 'Fundão', valor_min: 10000 } },
        active: true,
      },
    })

    expect(screen.getByLabelText('URL de destino (HTTPS)')).toHaveValue('https://api.meusite.pt/hook')
    expect(screen.getByRole('checkbox', { name: /Novo contrato público/i })).toBeChecked()
    expect(await screen.findByText('Fundão')).toBeInTheDocument()
    expect(screen.getByLabelText('Valor mínimo (€)')).toHaveValue(10000)

    await user.clear(screen.getByLabelText('Valor mínimo (€)'))
    await user.click(screen.getByRole('button', { name: 'Guardar alterações' }))

    expect(patch).toHaveBeenCalledTimes(1)
    const [path, body] = patch.mock.calls[0]
    expect(path).toBe('/v1/webhooks/wh_1')
    expect(body.filters['base.contract.new'].municipality).toBe('0504')
    expect(body.filters['base.contract.new'].local).toBeUndefined()
    expect(body.filters['base.contract.new'].valor_min).toBeUndefined()
  })

  it('labels national events and keeps free text only where marked', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('checkbox', { name: /Novo aviso da Proteção Civil/i }))
    expect(screen.getAllByText('Nacional — sem filtro de localização').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Texto').tagName).toBe('INPUT')
    expect(screen.getByText('Pesquisa em texto livre — pode falhar.')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /Novo diploma do DRE/i }))
    const dre = screen.getByRole('checkbox', { name: /Novo diploma do DRE/i }).closest('div')
    expect(within(dre).getByRole('checkbox', { name: 'I Série' })).toBeInTheDocument()
    expect(within(dre).getByRole('checkbox', { name: 'II Série' })).toBeInTheDocument()
  })

  it('shows search when the catalog is large', () => {
    renderForm({ catalog: MANY_EVENTS })
    expect(screen.getByPlaceholderText('Pesquisar eventos, conectores…')).toBeInTheDocument()
  })

  it('passes the create response including the one-time secret to the parent', async () => {
    const user = userEvent.setup()
    const { onSubmitSuccess } = renderForm()

    await user.type(screen.getByLabelText('URL de destino (HTTPS)'), 'https://api.meusite.pt/hook')
    await user.click(screen.getByRole('checkbox', { name: /Preços de combustíveis/i }))
    await user.click(screen.getByRole('button', { name: 'Criar webhook' }))

    await waitFor(() => {
      expect(onSubmitSuccess).toHaveBeenCalledWith(expect.objectContaining({
        id: 'wh_1',
        secret: 'whsec_from_create',
      }))
    })
  })
})
