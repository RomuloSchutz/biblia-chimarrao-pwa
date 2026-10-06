const CRISTO_TITLE = 'Cristo: O Marco Entre o Antes e o Depois'

function isCristoArea(button) {
  const card = button.closest('.book-card, .author-work-detail')
  return Boolean(card && card.textContent.includes(CRISTO_TITLE))
}

function prepareCristoButton() {
  document.querySelectorAll('button').forEach(button => {
    if (!isCristoArea(button)) return
    const text = button.textContent.trim()
    if (text !== '🔒 Livro não adquirido' && text !== 'Adquirir livro digital — em breve') return
    button.disabled = false
    button.classList.remove('book-disabled')
    button.classList.add('primary', 'cristo-buy-preview')
    button.textContent = 'Adquirir livro digital — R$ 19,90'
  })
}

function closePreview() {
  document.getElementById('cristo-commercial-preview')?.remove()
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
        <p>✓ Download liberado após o prazo legal aplicável, conforme a Política de Compra.</p>
      </div>
      <label class="cristo-commercial-consent"><input type="checkbox"/> Li e concordo com as condições da compra digital.</label>
      <button type="button" class="cristo-commercial-continue" disabled>Continuar para pagamento — R$ 19,90</button>
      <small class="cristo-commercial-note">Prévia comercial: o pagamento ainda não está conectado nesta etapa.</small>
    </div>`
  document.body.appendChild(backdrop)
  const checkbox = backdrop.querySelector('input')
  const continueButton = backdrop.querySelector('.cristo-commercial-continue')
  checkbox.addEventListener('change', () => { continueButton.disabled = !checkbox.checked })
  backdrop.querySelector('.cristo-commercial-close').addEventListener('click', closePreview)
  backdrop.addEventListener('click', event => { if (event.target === backdrop) closePreview() })
  continueButton.addEventListener('click', () => {
    if (!checkbox.checked) return
    continueButton.textContent = 'Pagamento ainda não conectado'
    continueButton.disabled = true
  })
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
@media (prefers-color-scheme:dark){html[data-appearance="dark"] .cristo-commercial-card{background:#211d18;color:#f7f0e5}.cristo-commercial-info{background:#30291f}}
`
document.head.appendChild(style)

const observer = new MutationObserver(prepareCristoButton)
observer.observe(document.documentElement, { childList: true, subtree: true })
prepareCristoButton()
