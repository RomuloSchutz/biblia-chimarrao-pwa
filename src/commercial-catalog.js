// Catálogo comercial estático dos livros digitais.
// Este módulo NÃO altera o DOM, NÃO observa a interface e NÃO inicia checkout.
// Os valores exibidos aqui são de apresentação; o backend continua sendo a autoridade do preço cobrado.

export const COMMERCIAL_BOOKS = Object.freeze({
  'Entre os Tempos': Object.freeze({
    productCode: 'ebook_entre_os_tempos',
    priceCents: 2990,
    priceLabel: 'R$ 29,90',
  }),
  'Entre o Já e o Ainda Não': Object.freeze({
    productCode: 'ebook_entre_ja_ainda_nao',
    priceCents: 3990,
    priceLabel: 'R$ 39,90',
  }),
  'Cristo: O Marco Entre o Antes e o Depois': Object.freeze({
    productCode: 'ebook_cristo_marco',
    priceCents: 1990,
    priceLabel: 'R$ 19,90',
  }),
  'Chimarrão com Deus — 365 Encontros com Deus': Object.freeze({
    productCode: 'devocional_chimarrao_com_deus_2027',
    priceCents: 2490,
    priceLabel: 'R$ 24,90',
  }),
})

export function getCommercialBook(title) {
  return COMMERCIAL_BOOKS[title] || null
}
