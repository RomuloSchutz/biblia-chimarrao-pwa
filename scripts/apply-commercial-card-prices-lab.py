from pathlib import Path
import subprocess

BRANCH = "lab-commercial-prices-2026-10-07"
APP = Path("src/App.jsx")

branch = subprocess.check_output(["git", "branch", "--show-current"], text=True).strip()
if branch != BRANCH:
    raise SystemExit(f"ABORTADO: branch atual {branch!r}; esperado {BRANCH!r}")

s = APP.read_text(encoding="utf-8")
start_marker = "const books=["
start = s.find(start_marker)
if start < 0:
    raise SystemExit("ABORTADO: início do array books não encontrado")

array_start = start + len("const books=")
if s[array_start] != "[":
    raise SystemExit("ABORTADO: colchete inicial do array books não encontrado")

# Localizador estrutural: conta colchetes e ignora colchetes dentro de strings,
# template literals e comentários. Este script é SOMENTE diagnóstico: não grava App.jsx.
depth = 0
i = array_start
quote = None
escaped = False
line_comment = False
block_comment = False
array_end = None

while i < len(s):
    ch = s[i]
    nxt = s[i + 1] if i + 1 < len(s) else ""

    if line_comment:
        if ch == "\n":
            line_comment = False
        i += 1
        continue

    if block_comment:
        if ch == "*" and nxt == "/":
            block_comment = False
            i += 2
        else:
            i += 1
        continue

    if quote:
        if escaped:
            escaped = False
        elif ch == "\\":
            escaped = True
        elif ch == quote:
            quote = None
        i += 1
        continue

    if ch == "/" and nxt == "/":
        line_comment = True
        i += 2
        continue
    if ch == "/" and nxt == "*":
        block_comment = True
        i += 2
        continue
    if ch in ("'", '"', "`"):
        quote = ch
        i += 1
        continue

    if ch == "[":
        depth += 1
    elif ch == "]":
        depth -= 1
        if depth == 0:
            array_end = i + 1
            break
        if depth < 0:
            raise SystemExit("ABORTADO: estrutura de colchetes inválida")
    i += 1

if array_end is None:
    raise SystemExit("ABORTADO: fechamento estrutural do array books não encontrado")

books_block = s[start:array_end]
required_titles = [
    "Chimarrão com Deus — 365 Encontros com Deus",
    "Entre os Tempos",
    "Entre o Já e o Ainda Não",
    "Cristo: O Marco Entre o Antes e o Depois",
]

print("OK: array books localizado estruturalmente.")
print(f"INÍCIO: caractere {start}")
print(f"FIM: caractere {array_end}")
print(f"TAMANHO DO BLOCO: {len(books_block)} caracteres")
for title in required_titles:
    print(f"{title}: {books_block.count(title)} ocorrência(s) dentro do array")
print("MODO DIAGNÓSTICO: src/App.jsx NÃO foi alterado.")
print("Nenhum commit do App.jsx foi criado.")
