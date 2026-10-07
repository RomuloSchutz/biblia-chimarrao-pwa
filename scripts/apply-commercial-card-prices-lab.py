from pathlib import Path
import subprocess

BRANCH = "lab-commercial-prices-2026-10-07"
APP = Path("src/App.jsx")

branch = subprocess.check_output(["git", "branch", "--show-current"], text=True).strip()
if branch != BRANCH:
    raise SystemExit(f"ABORTADO: branch atual {branch!r}; esperado {BRANCH!r}")

s = APP.read_text(encoding="utf-8")

# Âncoras exatas da biblioteca real, confirmadas no App.jsx.
start_marker = "if (screen === 'books' && user) {\n    const books = ["
end_marker = "\n    ]\n    return <main className=\"dashboard\""
start = s.find(start_marker)
if start < 0:
    raise SystemExit("ABORTADO: início exato da biblioteca não encontrado")
end = s.find(end_marker, start)
if end < 0:
    raise SystemExit("ABORTADO: fim exato do array books não encontrado")
if s.find(start_marker, start + 1) >= 0:
    raise SystemExit("ABORTADO: mais de uma biblioteca correspondente foi encontrada")

books_start = start + start_marker.index("const books = [")
books_end = end + len("\n    ]")
books_block = s[books_start:books_end]

# Somente os quatro produtos digitais comercializáveis recebem productCode.
replacements = [
    (
        "{title:'Chimarrão com Deus — 365 Encontros com Deus',sub:'Edição digital EPUB · Prévia 2027'",
        "{title:'Chimarrão com Deus — 365 Encontros com Deus',productCode:'devocional_chimarrao_com_deus_2027',sub:'Edição digital EPUB · Prévia 2027'",
    ),
    (
        "{title:'Entre os Tempos',sub:'A Urgência de Compreender o Calendário de Deus'",
        "{title:'Entre os Tempos',productCode:'ebook_entre_os_tempos',sub:'A Urgência de Compreender o Calendário de Deus'",
    ),
    (
        "{title:'Entre o Já e o Ainda Não',sub:'A Esperança Inabalável em um Mundo Acelerado'",
        "{title:'Entre o Já e o Ainda Não',productCode:'ebook_entre_ja_ainda_nao',sub:'A Esperança Inabalável em um Mundo Acelerado'",
    ),
    (
        "{title:'Cristo: O Marco Entre o Antes e o Depois',sub:'Como a Fé, a História e o Calendário se Encontram na Linha do Tempo'",
        "{title:'Cristo: O Marco Entre o Antes e o Depois',productCode:'ebook_cristo_marco',sub:'Como a Fé, a História e o Calendário se Encontram na Linha do Tempo'",
    ),
]

# Proteções: cada objeto precisa existir exatamente uma vez dentro do array e
# nenhum productCode pode estar previamente aplicado.
for old, new in replacements:
    count = books_block.count(old)
    if count != 1:
        raise SystemExit(f"ABORTADO: objeto comercial esperado apareceu {count} vezes dentro de books: {old}")
    if new in books_block:
        raise SystemExit("ABORTADO: um dos productCode já está aplicado; nenhuma escrita foi feita")

# Confirma que os dois itens não comerciais continuam sem productCode.
non_commercial = [
    "{title:'Chimarrão com Deus',sub:'365 Encontros com Deus'",
    "{title:'Entre a Cidade e o Silêncio',sub:'NASCE · CRESCE · VIVE'",
]
for marker in non_commercial:
    if books_block.count(marker) != 1:
        raise SystemExit(f"ABORTADO: item não comercial esperado não foi identificado de forma única: {marker}")

updated_block = books_block
for old, new in replacements:
    updated_block = updated_block.replace(old, new, 1)

if updated_block.count("productCode:") != 4:
    raise SystemExit("ABORTADO: validação final não encontrou exatamente quatro productCode")

# Nesta etapa NÃO altera botão, preço, checkout ou layout.
updated = s[:books_start] + updated_block + s[books_end:]
APP.write_text(updated, encoding="utf-8")

print("OK: quatro productCode inseridos somente no array books da biblioteca.")
print("OK: devocional interno e Entre a Cidade e o Silêncio permaneceram sem productCode.")
print("Nenhum preço, botão, checkout ou layout foi alterado.")
print("Nenhum commit do App.jsx foi criado por este script.")
