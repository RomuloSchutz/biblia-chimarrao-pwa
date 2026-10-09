from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')

marker = "  async function downloadSecureBook(title){\n    const url=await secureBookUrl(title,true);if(!url)return\n    window.open(url,'_blank','noopener,noreferrer')\n  }\n"
insert = marker + "\n  async function purchaseCommercialBook(book){\n    const product=book?.productCode?commercialCatalog[book.productCode]:null\n    if(!user||!supabase||!product?.isActive)return\n    const accepted=window.confirm('Compra digital: a leitura no aplicativo será liberada após a confirmação do pagamento. O download do EPUB ficará disponível após 7 dias. Ao continuar, você confirma que leu e aceita a Política de Compra Digital e a Licença Digital. Deseja ir para o Mercado Pago?')\n    if(!accepted)return\n    setBookAccessMessage('Preparando checkout seguro do Mercado Pago...')\n    const {data:sessionData}=await supabase.auth.getSession()\n    const session=sessionData?.session\n    if(!session){setBookAccessMessage('Sua sessão expirou. Entre novamente para comprar.');return}\n    try{\n      const response=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercado-pago-create-order`,{\n        method:'POST',\n        headers:{'Content-Type':'application/json','apikey':import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,'Authorization':`Bearer ${session.access_token}`},\n        body:JSON.stringify({product_code:book.productCode,accepted:true})\n      })\n      let data={}\n      try{data=await response.json()}catch{}\n      if(!response.ok||!data?.checkout_url){setBookAccessMessage('Não foi possível iniciar a compra: '+(data?.error||('erro '+response.status))+'.');return}\n      window.location.assign(data.checkout_url)\n    }catch{setBookAccessMessage('Não foi possível conectar ao checkout do Mercado Pago.')}\n  }\n"
if 'async function purchaseCommercialBook(book)' not in text:
    if marker not in text:
        raise SystemExit('ABORTADO: ponto de inserção do checkout não encontrado')
    text = text.replace(marker, insert, 1)

old = "<div className=\"book-actions\"><button className=\"book-disabled\" disabled>{book.productCode&&commercialCatalog[book.productCode]?`🔒 Livro não adquirido · ${formatCommercialPrice(commercialCatalog[book.productCode].amountCents,commercialCatalog[book.productCode].currency)}`:'🔒 Livro não adquirido'}</button><small className=\"book-license-note\">Após a compra ou liberação pelo administrador, a leitura e o download serão habilitados nesta conta.</small></div>"
new = "<div className=\"book-actions\">{book.productCode&&commercialCatalog[book.productCode]?.isActive?<button className=\"primary\" onClick={e=>{e.stopPropagation();purchaseCommercialBook(book)}}>Comprar · {formatCommercialPrice(commercialCatalog[book.productCode].amountCents,commercialCatalog[book.productCode].currency)} →</button>:<button className=\"book-disabled\" disabled>{book.productCode&&commercialCatalog[book.productCode]?`🔒 Livro não adquirido · ${formatCommercialPrice(commercialCatalog[book.productCode].amountCents,commercialCatalog[book.productCode].currency)}`:'🔒 Livro não adquirido'}</button>}<small className=\"book-license-note\">Após a confirmação do pagamento, a leitura será liberada nesta conta. O download do EPUB fica protegido por 7 dias.</small></div>"
if 'purchaseCommercialBook(book)' not in text.split("if (screen === 'books' && user)",1)[-1]:
    if old not in text:
        raise SystemExit('ABORTADO: card bloqueado esperado não encontrado')
    text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
print('OK: checkout Mercado Pago preparado no App.jsx do laboratório')
