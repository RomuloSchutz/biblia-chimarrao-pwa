from pathlib import Path
import subprocess

BRANCH = "lab-commercial-prices-2026-10-07"
APP = Path("src/App.jsx")

branch = subprocess.check_output(["git", "branch", "--show-current"], text=True).strip()
if branch != BRANCH:
    raise SystemExit(f"ABORTADO: branch atual {branch!r}; esperado {BRANCH!r}")

s = APP.read_text(encoding="utf-8")

# Trabalha exclusivamente dentro da tela real "Meus Livros".
start_marker = "if (screen === 'books' && user) {"
end_marker = "if (screen === 'authorBooks' && user) {"
start = s.find(start_marker)
if start < 0:
    raise SystemExit("ABORTADO: início da tela books não encontrado")
end = s.find(end_marker, start)
if end < 0:
    raise SystemExit("ABORTADO: fim estrutural da tela books não encontrado")
if s.find(start_marker, start + 1) >= 0:
    raise SystemExit("ABORTADO: mais de uma tela books encontrada")

screen_block = s[start:end]

# Os quatro vínculos comerciais precisam existir exatamente uma vez nessa tela.
expected_codes = [
    "devocional_chimarrao_com_deus_2027",
    "ebook_entre_os_tempos",
    "ebook_entre_ja_ainda_nao",
    "ebook_cristo_marco",
]
for code in expected_codes:
    if screen_block.count(f"productCode:'{code}'") != 1:
        raise SystemExit(f"ABORTADO: productCode {code!r} não apareceu exatamente uma vez na tela books")

# Alvo exato já existente no card de livro não adquirido.
old = '<button className="book-disabled" disabled>🔒 Livro não adquirido</button>'
new = '<button className="book-disabled" disabled>{book.productCode&&commercialCatalog[book.productCode]?`🔒 Livro não adquirido · ${formatCommercialPrice(commercialCatalog[book.productCode].amountCents,commercialCatalog[book.productCode].currency)}`:\'🔒 Livro não adquirido\'}</button>'

count = screen_block.count(old)
if count != 1:
    raise SystemExit(f"ABORTADO: botão-alvo apareceu {count} vez(es) na tela books; esperado 1")
if new in screen_block:
    raise SystemExit("ABORTADO: preço dinâmico já está aplicado; nenhuma escrita foi feita")

updated_block = screen_block.replace(old, new, 1)

# Garantias finais: somente a apresentação do botão muda; productCodes permanecem 4.
if updated_block.count("productCode:") != 4:
    raise SystemExit("ABORTADO: validação final dos quatro productCode falhou")
if updated_block.count("formatCommercialPrice(commercialCatalog[book.productCode].amountCents") != 1:
    raise SystemExit("ABORTADO: expressão de preço dinâmico não ficou única")

updated = s[:start] + updated_block + s[end:]
APP.write_text(updated, encoding="utf-8")

print("OK: preço dinâmico ligado somente ao botão dos livros não adquiridos em Meus Livros.")
print("OK: os quatro cards usam productCode + catálogo Supabase; nenhum preço foi fixado no App.jsx.")
print("OK: nenhum checkout, entitlement, leitura, download ou layout foi alterado.")
print("AINDA NÃO HOUVE COMMIT DO APP.JSX.")
