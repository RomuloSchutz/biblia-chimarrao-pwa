import { supabase, supabaseConfigured } from './lib/supabase.js'

const PRODUCTS = [
  { title: 'Chimarrão com Deus — 365 Encontros com Deus', code: 'devocional_chimarrao_com_deus_2027', price: 'R$ 24,90', active: false },
  { title: 'Entre os Tempos', code: 'ebook_entre_os_tempos', price: 'R$ 29,90', active: false },
  { title: 'Entre o Já e o Ainda Não', code: 'ebook_entre_ja_ainda_nao', price: 'R$ 39,90', active: false },
  { title: 'Cristo: O Marco Entre o Antes e o Depois', code: 'ebook_cristo_marco', price: 'R$ 19,90', active: true },
]

function findProductCard(element, product) {
  let current = element?.parentElement
  while (current && current !== document.body) {
    if (current.textContent?.includes(product.title)) return current
    current = current.parentElement
  }
  return null
}

function productForElement(element) {
  return PRODUCTS.find(product => findProductCard(element, product)) || null
}

async function preparePurchasedCards() {
  if (!supabaseConfigured || !supabase) return
  const downloadButtons = [...document.querySelectorAll('button')].filter(button => button.textContent.trim() === 'Baixar EPUB ↓')
  if (!downloadButtons.length) return

  let session
  let library
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    session = sessionData?.session
    if (!session) return
    const { data, error } = await supabase.rpc('my_book_library')
    if (error) return
    library = data || []
  } catch {
    return
  }

  for (const downloadButton of downloadButtons) {
    const product = productForElement(downloadButton)
    if (!product || downloadButton.dataset.downloadChecked === 'true') continue
    downloadButton.dataset.downloadChecked = 'true'
    const item = library.find(entry => entry.title === product.title && entry.has_access && entry.edition_id)
    if (!item) continue

    try {
      const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-epub-access`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ edition_id: item.edition_id, download: true }),
      })
      let result = null
      try { result = await response.json() } catch { result = null }

      if (response.status === 403 && result?.download_available_at) {
        const date = new Date(result.download_available_at).toLocaleDateString('pt-BR', {
          timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric'
        })
        downloadButton.disabled = true
        downloadButton.classList.add('book-disabled', 'commercial-download-wait')
        downloadButton.textContent = `EPUB disponível em ${date}`
        const card = findProductCard(downloadButton, product)
        const note = card?.querySelector('.book-license-note')
        if (note) note.textContent = 'A leitura no aplicativo já está liberada. O download do EPUB será habilitado automaticamente após o prazo de 7 dias.'
      }
    } catch (error) {
      console.info('Não foi possível consultar agora a data de liberação do EPUB.', error)
    }
  }
}

function prepareCommercialButtons() {
  document.querySelectorAll('button').forEach(button => {
    const text = button.textContent.trim()
    if (text !== '🔒 Livro não adquirido' && text !== 'Adquirir livro digital — em breve' && !button.dataset.commercialProduct) return
    const product = productForElement(button)
    if (!product) return

    button.dataset.commercialProduct = product.code
    button.dataset.commercialPrice = product.price
    button.classList.add('commercial-book-button')
    button.textContent = `Adquirir livro digital — ${product.price}`

    if (product.active) {
      button.disabled = false
      button.classList.remove('book-disabled')
      button.classList.add('primary', 'commercial-buy-button')
      button.title = ''
    } else {
      button.disabled = true
      button.classList.add('book-disabled', 'commercial-price-preview')
      button.classList.remove('primary', 'commercial-buy-button')
      button.title = 'Preço definido. Venda será ativada após a homologação comercial.'
    }
  })
  preparePurchasedCards()
}

function closePreview() {
  document.getElementById('book-commercial-preview')?.remove()
}

async function createOrder(product, continueButton, checkbox, status) {
  if (!checkbox.checked || continueButton.dataset.submitting === 'true') return

  continueButton.dataset.submitting = 'true'
  continueButton.disabled = true
  continueButton.textContent = 'Preparando pagamento…'
  status.textContent = 'Aguarde. Não feche esta janela.'

  if (!supabaseConfigured || !supabase) {
    status.textContent = 'Não foi possível iniciar o pagamento. Atualize o aplicativo e tente novamente.'
    continueButton.textContent = 'Pagamento indisponível'
    return
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  const accessToken = sessionData?.session?.access_token
  if (sessionError || !accessToken) {
    status.textContent = 'Sua sessão expirou. Entre novamente na sua conta antes de comprar.'
    continueButton.textContent = 'Sessão expirada'
    return
  }

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercado-pago-create-order`

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        access_token: accessToken,
        product_code: product.code,
        accepted: true,
      }),
    })

    let result = null
    try { result = await response.json() } catch { result = null }

    if (response.status !== 201 || !result?.order_id || !result?.checkout_url) {
      console.error('Falha ao preparar checkout do livro', { product: product.code, status: response.status, error: result?.error ?? 'invalid_response' })
      status.textContent = 'Não foi possível preparar o pagamento. Nenhuma nova tentativa será feita automaticamente.'
      continueButton.textContent = 'Não foi possível continuar'
      return
    }

    status.textContent = 'Checkout preparado. Abrindo o Mercado Pago…'
    continueButton.textContent = 'Abrindo pagamento…'
    window.location.assign(result.checkout_url)
  } catch (error) {
    console.error('Falha de conexão ao preparar checkout do livro', error)
    status.textContent = 'Houve uma falha de conexão. Para evitar pedido duplicado, nenhuma nova tentativa será feita automaticamente.'
    continueButton.textContent = 'Verifique sua conexão'
  }
}

function openPreview(product) {
  closePreview()
  const backdrop = document.createElement('div')
  backdrop.id = 'book-commercial-preview'
  backdrop.setAttribute('role', 'dialog')
  backdrop.setAttribute('aria-modal', 'true')
  backdrop.setAttribute('aria-label', `Confirmação de compra de ${product.title}`)
  backdrop.innerHTML = `
    <div class="book-commercial-card">
      <button type="button" class="book-commercial-close" aria-label="Fechar">×</button>
      <small>LIVRO DIGITAL · EPUB</small>
      <h2>${product.title}</h2>
      <strong class="book-commercial-price">${product.price}</strong>
      <div class="book-commercial-info">
        <p>✓ Leitura no aplicativo após a confirmação do pagamento.</p>
        <p>✓ EPUB protegido para uso pessoal.</p>
        <p>✓ Download do EPUB disponibilizado após 7 dias, conforme a Política de Compra Digital.</p>
      </div>
      <label class="book-commercial-consent"><input type="checkbox"/> Li e concordo com as condições da compra digital.</label>
      <button type="button" class="book-commercial-continue" disabled>Continuar para pagamento — ${product.price}</button>
      <small class="book-commercial-note" aria-live="polite">Uma Order será criada somente após seu clique em continuar.</small>
    </div>`
  document.body.appendChild(backdrop)
  const checkbox = backdrop.querySelector('input')
  const continueButton = backdrop.querySelector('.book-commercial-continue')
  const status = backdrop.querySelector('.book-commercial-note')
  checkbox.addEventListener('change', () => {
    if (continueButton.dataset.submitting === 'true') return
    continueButton.disabled = !checkbox.checked
  })
  backdrop.querySelector('.book-commercial-close').addEventListener('click', closePreview)
  backdrop.addEventListener('click', event => { if (event.target === backdrop) closePreview() })
  continueButton.addEventListener('click', () => createOrder(product, continueButton, checkbox, status))
}

document.addEventListener('click', event => {
  const button = event.target.closest?.('.commercial-buy-button')
  if (!button) return
  const product = PRODUCTS.find(item => item.code === button.dataset.commercialProduct)
  if (!product?.active) return
  event.preventDefault()
  event.stopPropagation()
  openPreview(product)
}, true)

const style = document.createElement('style')
style.textContent = `
#book-commercial-preview{position:fixed;inset:0;z-index:99999;background:rgba(20,16,10,.72);display:grid;place-items:center;padding:20px;overflow:auto}
.book-commercial-card{width:min(520px,100%);background:#fffdf8;color:#29241c;border-radius:20px;padding:26px;box-shadow:0 24px 70px rgba(0,0,0,.35);position:relative}
.book-commercial-card h2{margin:8px 0 6px;font-size:1.55rem;line-height:1.2}
.book-commercial-card>small:first-of-type{font-weight:800;letter-spacing:.08em}
.book-commercial-close{position:absolute;right:12px;top:10px;width:40px;height:40px;border:0;border-radius:50%;background:transparent;color:inherit;font-size:28px;cursor:pointer}
.book-commercial-price{display:block;font-size:1.8rem;margin:18px 0;color:#7a5520}
.book-commercial-info{padding:14px 16px;background:#f5efe2;border-radius:14px;margin:14px 0}.book-commercial-info p{margin:7px 0;line-height:1.4}
.book-commercial-consent{display:flex;align-items:flex-start;gap:10px;margin:18px 0;line-height:1.4}.book-commercial-consent input{margin-top:3px;transform:scale(1.15)}
.book-commercial-continue{width:100%;padding:14px;border:0;border-radius:12px;font-weight:800;cursor:pointer}.book-commercial-continue:disabled{cursor:not-allowed;opacity:.55}
.book-commercial-note{display:block;margin-top:12px;text-align:center;line-height:1.4;opacity:.72}
.commercial-download-wait{cursor:not-allowed!important;opacity:.78!important}
.commercial-price-preview{opacity:.82!important}
@media (prefers-color-scheme:dark){html[data-appearance="dark"] .book-commercial-card{background:#211d18;color:#f7f0e5}.book-commercial-info{background:#30291f}}
`
document.head.appendChild(style)

const observer = new MutationObserver(prepareCommercialButtons)
observer.observe(document.documentElement, { childList: true, subtree: true })
prepareCommercialButtons()
