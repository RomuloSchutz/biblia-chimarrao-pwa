from pathlib import Path
import subprocess

BRANCH = "lab-commercial-prices-2026-10-07"
APP = Path("src/App.jsx")

branch = subprocess.check_output(["git", "branch", "--show-current"], text=True).strip()
if branch != BRANCH:
    raise SystemExit(f"ABORTADO: branch atual {branch!r}; esperado {BRANCH!r}")

s = APP.read_text(encoding="utf-8")

required = [
    "import { fetchCommercialCatalog, formatCommercialPrice } from './lib/commercial-catalog-api.js'",
    "const [commercialCatalog,setCommercialCatalog]=useState({})",
]
for marker in required:
    if marker not in s:
        raise SystemExit(f"ABORTADO: integração-base ausente: {marker}")

# Trabalha exclusivamente no array `books` da tela da biblioteca.
# O limite final é o `const bookTitles` que vem logo depois desse array.
start_marker = "const books=["
end_marker = ";const bookTitles="
start = s.find(start_marker)
if start < 0:
    raise SystemExit("ABORTADO: início do array books não encontrado")
end = s.find(end_marker, start)
if end < 0:
    raise SystemExit("ABORTADO: fim do array books não encontrado")
if s.find(start_marker, start + len(start_marker), end) >= 0:
    raise SystemExit("ABORTADO: outro array books apareceu dentro do intervalo esperado")

prefix = s[:start]
books_block = s[start:end]
suffix = s[end:]

book_replacements = {
    "{title:'Chimarrão com Deus — 365 Encontros com Deus',sub:": "{title:'Chimarrão com Deus — 365 Encontros com Deus',productCode:'devocional_chimarrao_com_deus_2027',sub:",
    "{title:'Entre os Tempos',sub:": "{title:'Entre os Tempos',productCode:'ebook_entre_os_tempos',sub:",
    "{title:'Entre o Já e o Ainda Não',sub:": "{title:'Entre o Já e o Ainda Não',productCode:'ebook_entre_ja_ainda_nao',sub:",
    "{title:'Cristo: O Marco Entre o Antes e o Depois',sub:": "{title:'Cristo: O Marco Entre o Antes e o Depois',productCode:'ebook_cristo_marco',sub:",
}

for old, new in book_replacements.items():
    count = books_block.count(old)
    if count != 1:
        raise SystemExit(f"ABORTADO: dentro do array books, marcador apareceu {count} vezes: {old}")
    if new in books_block:
        raise SystemExit(f"ABORTADO: productCode já presente no array books para: {old}")

for old, new in book_replacements.items():
    books_block = books_block.replace(old, new, 1)

s = prefix + books_block + suffix

old_block = "<div className=\"book-actions\"><button className=\"book-disabled\" disabled>🔒 Livro não adquirido</button><small className=\"book-license-note\">Após a compra ou liberação pelo administrador, a leitura e o download serão habilitados nesta conta.</small></div>"
new_block = "<div className=\"book-actions\"><button className=\"book-disabled\" disabled>🔒 Livro não adquirido{book.productCode&&commercialCatalog[book.productCode]?.amountCents!=null?` · ${formatCommercialPrice(commercialCatalog[book.productCode].amountCents,commercialCatalog[book.productCode].currency)}`:''}</button><small className=\"book-license-note\">Após a compra ou liberação pelo administrador, a leitura e o download serão habilitados nesta conta.</small></div>"

if s.count(old_block) != 1:
    raise SystemExit(f"ABORTADO: bloco do card não adquirido apareceu {s.count(old_block)} vezes")
if new_block in s:
    raise SystemExit("ABORTADO: preço dinâmico já parece estar integrado ao card")

s = s.replace(old_block, new_block, 1)
APP.write_text(s, encoding="utf-8")

print("OK: alteração restrita ao array books da biblioteca.")
print("OK: quatro productCode inseridos e preço dinâmico ligado ao card não adquirido.")
print("Nenhum preço foi fixado no App.jsx.")
print("Nenhum commit foi criado por este script.")
