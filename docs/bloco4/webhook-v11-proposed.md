# Bloco 4 — Webhook Mercado Pago v11 PROPOSTO

> LAB / NÃO PUBLICADO. Esta especificação registra a alteração exata planejada para `mercado-pago-orders-webhook` antes de autorização de deploy.

## Estado atual v10

A função v10 valida HMAC, consulta a ordem no Mercado Pago, confere pedido local, produto, valor/moeda e trata estados do pagamento. Para `app_access`, porém, ainda grava `app_access` global. Em `refunded`, altera apenas o pedido e devolve `access_review_required`.

## Alteração proposta v11

### Pagamento anual confirmado

Quando:
- `product_code = app_biblia_chimarrao`;
- `product_type = app_access`;
- pagamento no provedor = `processed/accredited`;
- valor pago = valor do pedido;

então:
1. marcar pedido como `paid` como já ocorre;
2. localizar `app_annual_editions.year = 2027` ativa;
3. inserir/upsert direito anual do usuário para 2027 com:
   - `source = purchase`;
   - `order_reference = order.id`;
   - `granted_at = paidAt`;
4. NÃO conceder novo `app_access` global;
5. operação repetida deve ser idempotente.

### EPUB/devocional

Sem mudança de modelo:
- `ebook`/`devotional` com `edition_id` continuam concedendo `user_editions`.

### Refund anual

Quando a ordem anual for confirmada como `refunded`:
1. marcar pedido `refunded`;
2. localizar somente o direito anual com `source = purchase` e `order_reference = order.id`;
3. marcar essa concessão como revogada;
4. não remover concessões `admin`, `corporate`, `promotion` ou `legacy`;
5. não alterar `user_editions` de livros/devocionais.

### Refund de EPUB/devocional

A v11 não deve inventar regra jurídica/comercial nova. A revogação automática de livros será tratada separadamente conforme política comercial aplicável e comportamento de download. Até decisão explícita, manter revisão controlada.

## Guardas obrigatórias

- assinatura HMAC permanece obrigatória;
- consulta autoritativa ao Mercado Pago permanece obrigatória;
- redirect do navegador nunca concede acesso;
- validar `external_reference`;
- validar provider_order_id quando já registrado;
- validar valor total, valor pago e moeda;
- validar catálogo/produto;
- erro de concessão anual deve retornar erro de reconciliação e não fingir sucesso;
- logs não devem expor token/chave/PII desnecessária.

## Compatibilidade

- `app_access` existente não será apagado pela v11;
- comprador anual já migrado permanece com 2027;
- frontend pode continuar temporariamente com fallback legado;
- novas compras anuais passam a nascer no modelo correto por edição.

## Testes pós-deploy sem nova compra real

1. GET de saúde da função.
2. Confirmar versão ativa nova.
3. Consultar contagens: comprador pago existente continua com 2027.
4. Confirmar `app_access` legado intacto.
5. Confirmar biblioteca EPUB intacta.
6. Não reenviar artificialmente evento pago ao Mercado Pago nem fabricar assinatura HMAC.

## Rollback

A versão v10 atual deve permanecer documentada para restauração caso a v11 apresente falha operacional. Como as novas tabelas são aditivas e `app_access` antigo permanece, o rollback do webhook não exige apagar dados.

## Gate

Deploy da v11 no Supabase compartilhado exige autorização explícita separada. Nenhum deploy é realizado por este documento.
