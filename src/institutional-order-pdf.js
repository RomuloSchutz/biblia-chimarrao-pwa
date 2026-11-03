import { jsPDF } from 'jspdf'

export function createInstitutionalOrderPdf(institution, edition, lot) {
  if (!institution?.id || !lot?.id || !Number.isInteger(Number(lot.quantity)) || Number(lot.quantity) <= 0) throw new Error('Lote inválido para emissão.')
  const doc = new jsPDF()
  let y = 25
  function write(text, size = 12) {
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(String(text), 170)
    for (const line of lines) {
      if (y > 270) { doc.addPage(); y = 25 }
      doc.text(line, 20, y); y += size * 0.5 + 3
    }
    y += 3
  }
  write('BÍBLIA + CHIMARRÃO', 20)
  write('Comprovante de contratação de acessos', 15)
  write(`Pedido / lote: ${lot.id}`, 10)
  write(`Data da contratação: ${new Date(lot.purchased_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
  write(`Instituição: ${institution.name}`)
  write(`Responsável: ${institution.contact_name || 'Não informado'}`)
  write(`E-mail: ${institution.contact_email || 'Não informado'}`)
  write(`Telefone: ${institution.contact_phone || 'Não informado'}`)
  write(`Edição: ${edition?.year || ''} — ${edition?.title || 'Bíblia + Chimarrão'}`)
  write(`Quantidade contratada neste lote: ${lot.quantity} acessos`, 14)
  if (lot.reference) write(`Referência: ${lot.reference}`)
  if (lot.amount_cents != null && lot.amount_cents !== '') write(`Valor registrado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(lot.amount_cents) / 100)}`)
  write('Os acessos deste lote foram registrados para a instituição. A distribuição e a ativação são realizadas por códigos individuais no aplicativo.')
  write('Este documento comprova o registro da contratação. Não atesta quitação de pagamento.', 10)
  write('Romulo Schutz | Chimarrão com Deus', 11)
  write('https://bibliachimarrao.com.br', 11)
  const filename = `pedido-biblia-chimarrao-${String(lot.id).replace(/[^a-zA-Z0-9-]/g, '')}.pdf`
  return { doc, filename }
}

export async function deliverInstitutionalOrder(institution, edition, lot, share = false) {
  const { doc, filename } = createInstitutionalOrderPdf(institution, edition, lot)
  if (share) {
    const file = new File([doc.output('blob')], filename, { type: 'application/pdf' })
    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({ title: 'Pedido — Bíblia + Chimarrão', files: [file] })
      return '✓ Compartilhamento aberto. Escolha WhatsApp ou e-mail.'
    }
  }
  doc.save(filename)
  return share ? '✓ PDF baixado. Anexe o arquivo no WhatsApp ou e-mail.' : '✓ Comprovante baixado em PDF.'
}
