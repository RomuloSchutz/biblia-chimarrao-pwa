# Correção isolada — QR Code do site

O QR Code do card “Conheça o site oficial” aparecia acinzentado em Android/PWA apesar do SVG local declarar fundo branco e módulos pretos.

A correção mantém o layout, textos, botões e destino existentes. Apenas a renderização visual do QR passa a usar a mesma fonte raster já utilizada pelo card “Compartilhe o Bíblia + Chimarrão”, com fundo branco e contraste preto, evitando a alteração visual observada no SVG local.
