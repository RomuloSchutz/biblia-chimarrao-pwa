# MARCO PRÉ-MERCADO PAGO

Data: 03/10/2026

Este documento registra o ponto de estabilidade aprovado do aplicativo Bíblia + Chimarrão antes da integração do Mercado Pago.

## Estado aprovado
- Biblioteca de EPUBs protegidos funcionando.
- Conta de leitor: concessão/revogação de acesso funcionando.
- Leitor autorizado: Ler no aplicativo funcionando.
- Leitor autorizado: Baixar EPUB funcionando.
- Conta administrativa: acesso aos livros funcionando.
- EPUBs permanecem privados no Supabase Storage.
- Acesso usa link temporário assinado no servidor.
- Edge Function book-epub-access: versão 6 ativa no momento da aprovação.
- Leitor EPUB e áudio aprovados e não devem ser alterados sem solicitação explícita.

## Referência técnica
Commit que corrigiu o fluxo administrativo:
6ebe9deca7dee23c9dbf8757d7be7c57399ce21a

Este marco deve ser usado como referência de recuperação antes de alterações relacionadas a pagamentos ou mudanças estruturais na biblioteca protegida.
