import { supabase, supabaseConfigured } from './lib/supabase.js'

const CRISTO_TITLE = 'Cristo: O Marco Entre o Antes e o Depois'
const PRODUCT_CODE = 'ebook_cristo_marco'

function findCristoCard(button) {
  let element = button.parentElement
  while (element && element !== document.body) {
    if (element.textContent?.includes(CRISTO_TITLE)) return element
    element = element.parentElement
  }
  return null
}

async function prepareCristoPurchasedCard() {
  if (!supabaseConfigured || !supabase) return
  const downloadButton = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Baixar EPUB ↓' && findCristoCard(button))
  if (!downloadButton || downloadButton.dataset.downloadChecked === 'true') return
  downloadButton.dataset.downloadChecked = 'true'

  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData?.session
    if (!session) return
    const { data: library, error: libraryError } = await supabase.rpc('my_book_library')
    if (libraryError) return
    const item = (library || []).find(entry => entry.title === CRISTO_TITLE && entry.has_access && entry.edition_id)
    if (!item) return

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
      downloadButton.classList.add('book-disabled', 'cristo-download-wait')
      downloadButton.textContent = `EPUB disponível em ${date}`
      const card = findCristoCard(downloadButton)
      const note = card?.querySelector('.book-license-note')
      if (note) note.textContent = 'A leitura no aplicativo já está liberada. O download do EPUB será habilitado automaticamente após o prazo de 7 dias.'
    }
  } catch (error) {
    console.info('Não foi possível consultar agora a data de liberação do EPUB.', error)
  }
}

function prepareCristoButton() {
  document.querySelectorAll('button').forEach(button => {
    const text = button.textContent.trim()
    if (text !== '🔒 Livro não adquirido' && text !== 'Adquirir livro digital — em breve') return
    if (!findCristoCard(button)) return
    button.disabled = false
    button.classList.remove('book-disabled')
    button.classList.add('primary', 'cristo-buy-preview')
    button.textContent = 'Adquirir livro digital — R$ 19,90'
  })
  prepareCristoPurchasedCard()
}

function closePreview() {
  document.getElementById('cristo-commercial-preview')?.remove()
}

async function createCristoOrder(continueButton, checkbox, status) {
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
        product_code: PRODUCT_CODE,
        accepted: true,
      }),
    })

    let result = null
    try { result = await response.json() } catch { result = null }

    if (response.status !== 201 || !result?.order_id || !result?.checkout_url) {
      console.error('Falha ao preparar checkout do livro Cristo', {
        status: response.status,
        error: result?.error ?? 'invalid_response',
      })
      status.textContent = 'Não foi possível preparar o pagamento. Nenhuma nova tentativa será feita automaticamente.'
      continueButton.textContent = 'Não foi possível continuar'
      return
    }

    status.textContent = 'Checkout preparado. Abrindo o Mercado Pago…'
    continueButton.textContent = 'Abrindo pagamento…'
    window.location.assign(result.checkout_url)
  } catch (error) {
    console.error('Falha de conexão ao preparar checkout do livro Cristo', error)
    status.textContent = 'Houve uma falha de conexão. Para evitar pedido duplicado, nenhuma nova tentativa será feita automaticamente.'
    continueButton.textContent = 'Verifique sua conexão'
  }
}

function openPreview() {
  closePreview()
  const backdrop = document.createElement('div')
  backdrop.id = 'cristo-commercial-preview'
  backdrop.setAttribute('role', 'dialog')
  backdrop.setAttribute('aria-modal', 'true')
  backdrop.setAttribute('aria-label', 'Confirmação de compra do livro Cristo')
  backdrop.innerHTML = `
    <div class="cristo-commercial-card">
      <button type="button" class="cristo-commercial-close" aria-label="Fechar">×</button>
      <small>LIVRO DIGITAL · EPUB</small>
      <h2>Cristo: O Marco Entre o Antes e o Depois</h2>
      <p>Como a Fé, a História e o Calendário se Encontram na Linha do Tempo</p>
      <strong class="cristo-commercial-price">R$ 19,90</strong>
      <div class="cristo-commercial-info">
        <p>✓ Leitura no aplicativo após a confirmação do pagamento.</p>
        <p>✓ EPUB protegido para uso pessoal.</p>
        <p>✓ Download do EPUB disponibilizado após 7 dias, conforme a Política de Compra Digital.</p>
      </div>
      <label class="cristo-commercial-consent"><input type="checkbox"/> Li e concordo com as condições da compra digital.</label>
      <button type="button" class="cristo-commercial-continue" disabled>Continuar para pagamento — R$ 19,90</button>
      <small class="cristo-commercial-note" aria-live="polite">Uma Order será criada somente após seu clique em continuar.</small>
    </div>`
  document.body.appendChild(backdrop)
  const checkbox = backdrop.querySelector('input')
  const continueButton = backdrop.querySelector('.cristo-commercial-continue')
  const status = backdrop.querySelector('.cristo-commercial-note')
  checkbox.addEventListener('change', () => {
    if (continueButton.dataset.submitting === 'true') return
    continueButton.disabled = !checkbox.checked
  })
  backdrop.querySelector('.cristo-commercial-close').addEventListener('click', closePreview)
  backdrop.addEventListener('click', event => { if (event.target === backdrop) closePreview() })
  continueButton.addEventListener('click', () => createCristoOrder(continueButton, checkbox, status))
}

document.addEventListener('click', event => {
  const button = event.target.closest?.('.cristo-buy-preview')
  if (!button) return
  event.preventDefault()
  event.stopPropagation()
  openPreview()
}, true)

const style = document.createElement('style')
style.textContent = `
#cristo-commercial-preview{position:fixed;inset:0;z-index:99999;background:rgba(20,16,10,.72);display:grid;place-items:center;padding:20px;overflow:auto}
.cristo-commercial-card{width:min(520px,100%);background:#fffdf8;color:#29241c;border-radius:20px;padding:26px;box-shadow:0 24px 70px rgba(0,0,0,.35);position:relative}
.cristo-commercial-card h2{margin:8px 0 6px;font-size:1.55rem;line-height:1.2}
.cristo-commercial-card>p{margin:0 0 16px;line-height:1.5}
.cristo-commercial-card>small:first-of-type{font-weight:800;letter-spacing:.08em}
.cristo-commercial-close{position:absolute;right:12px;top:10px;width:40px;height:40px;border:0;border-radius:50%;background:transparent;color:inherit;font-size:28px;cursor:pointer}
.cristo-commercial-price{display:block;font-size:1.8rem;margin:18px 0;color:#7a5520}
.cristo-commercial-info{padding:14px 16px;background:#f5efe2;border-radius:14px;margin:14px 0}.cristo-commercial-info p{margin:7px 0;line-height:1.4}
.cristo-commercial-consent{display:flex;align-items:flex-start;gap:10px;margin:18px 0;line-height:1.4}.cristo-commercial-consent input{margin-top:3px;transform:scale(1.15)}
.cristo-commercial-continue{width:100%;padding:14px;border:0;border-radius:12px;font-weight:800;cursor:pointer}.cristo-commercial-continue:disabled{cursor:not-allowed;opacity:.55}
.cristo-commercial-note{display:block;margin-top:12px;text-align:center;line-height:1.4;opacity:.72}
.cristo-download-wait{cursor:not-allowed!important;opacity:.78!important}
@media (prefers-color-scheme:dark){html[data-appearance="dark"] .cristo-commercial-card{background:#211d18;color:#f7f0e5}.cristo-commercial-info{background:#30291f}}
`
document.head.appendChild(style)

const observer = new MutationObserver(prepareCristoButton)
observer.observe(document.documentElement, { childList: true, subtree: true })
prepareCristoButton()
