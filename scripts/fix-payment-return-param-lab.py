from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')
old = "const payment=params.get('payment')"
new = "const payment=params.get('payment_return')"
if old in text:
    text = text.replace(old, new, 1)
elif new not in text:
    raise SystemExit('Parâmetro de retorno do pagamento não localizado em src/App.jsx')
path.write_text(text, encoding='utf-8')
print('Parâmetro de retorno corrigido para payment_return.')
