# Bloco 4 — Especificação: acesso anual, webhook e painel administrativo

> Documento de LAB. Nenhuma mudança de produção é executada por este arquivo.

## Regra comercial central

Existem direitos independentes:

1. **Acesso anual ao aplicativo** — exemplo: Bíblia + Chimarrão — Edição 2027 (R$ 34,90).
2. **Devocional/EPUB** — exemplo: Chimarrão com Deus — 365 Encontros com Deus (R$ 24,90).
3. **Demais e-books** — cada obra mantém seu próprio direito de biblioteca.

Comprar um item nunca deve conceder automaticamente outro item.

## Modelo anual

- `app_annual_editions`: catálogo dos anos do aplicativo.
- `user_annual_editions`: direito de uma conta a um ano específico.
- `user_editions`: continua reservado a livros/devocionais EPUB.
- `app_access`: permanece temporariamente como compatibilidade legada durante a transição.

## Compra anual 2027

Fluxo desejado:

1. Usuário autenticado aceita os documentos comerciais vigentes.
2. Checkout cria pedido para `app_biblia_chimarrao`.
3. Redirecionamento do Mercado Pago **não libera acesso**.
4. Webhook valida assinatura, pedido no provedor, valor, moeda e produto.
5. Somente pagamento confirmado/acreditado concede `user_annual_editions` para 2027.
6. Operação deve ser idempotente: webhook repetido não cria direito duplicado.
7. A compra de 2027 nunca concede 2028.
8. Quando 2028 existir, o usuário pode possuir 2027 e 2028 simultaneamente.

## Estorno/cancelamento

- `pending`, `failed` e `cancelled`: não concedem direito novo.
- `refunded`: não deve apenas alterar o pedido; o direito derivado daquela compra precisa entrar em revisão/revogação controlada.
- Direitos concedidos manualmente, corporativos ou promocionais não podem ser removidos por engano por causa de um pedido diferente.
- A implementação deverá distinguir a origem (`source`) e a referência do pedido (`order_reference`).

## Painel administrativo

Para cada cliente, exibir separadamente:

### Acesso anual
- 2027 — ativo/revogado — origem compra/admin/corporativo/promoção/legado.
- 2028 e anos futuros quando cadastrados.
- Ações administrativas por edição: conceder, revogar/restaurar.

### Biblioteca digital
- Lista dos EPUBs/e-books adquiridos/liberados.
- Ações já existentes de concessão/revogação continuam independentes.

### Acesso legado
- Mostrar apenas enquanto a transição estiver ativa.
- Identificar claramente que não representa compra de todas as futuras edições.

## Empresas

Fluxo previsto sem criar contas especiais:

1. Empresa contrata determinada edição/quantidade fora do fluxo individual.
2. Funcionário cria uma conta normal.
3. Administrador concede exatamente a edição anual contratada com `source='corporate'`.
4. A concessão corporativa não libera EPUBs compráveis separadamente.
5. Revogação de um vínculo corporativo não deve apagar compras pessoais do mesmo usuário.

## Compatibilidade e migração

- O comprador anual 2027 já existente deve ser migrado pelo pedido pago real.
- Usuários com `app_access` manual/global não serão apagados na primeira etapa.
- A UI deverá consultar o direito anual novo e manter fallback legado somente durante a transição.
- Remover o fallback global será uma etapa posterior, depois de validar todas as contas existentes.

## Critérios de aceite antes de produção

- [ ] Comprador anual 2027 recebe somente 2027.
- [ ] Comprador do EPUB/devocional 2027 não recebe acesso anual.
- [ ] Comprador de e-book não recebe acesso anual.
- [ ] 2027 e 2028 podem coexistir na mesma conta.
- [ ] Concessão corporativa é por ano.
- [ ] Admin visualiza origem e situação de cada direito.
- [ ] Webhook repetido é idempotente.
- [ ] Redirecionamento do checkout não libera conteúdo.
- [ ] Estorno não deixa direito pago ativo sem tratamento.
- [ ] Direitos manuais/corporativos não são revogados por um estorno alheio.
- [ ] Cliente real que já pagou 2027 permanece com acesso.
- [ ] Biblioteca EPUB permanece independente e funcional.

## Alterações de produção necessárias (ainda NÃO autorizadas/executadas)

1. Criar as tabelas anuais e políticas/RPCs de acesso.
2. Fazer backfill do comprador anual 2027.
3. Alterar webhook para conceder/revogar direito anual por ano.
4. Alterar frontend para verificar edição anual em vez de depender apenas de `app_access` global.
5. Alterar painel admin para gerenciar direitos anuais por edição.
6. Validar usuário pago existente, admin/manual e conta sem compra.
7. Só depois considerar retirada do fallback legado.

## Observação de segurança

Nenhuma das etapas acima deve ser aplicada no Supabase compartilhado ou publicada em produção sem aprovação explícita para o pacote estrutural do Bloco 4.
