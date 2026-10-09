# Bloco 4 — Webhook anual: estado v11 e correção v12

## Estado confirmado em 09/10/2026

A função compartilhada `mercado-pago-orders-webhook` está ACTIVE na versão 11. A versão 11 preserva validação HMAC, consulta autoritativa da ordem no Mercado Pago, validação de `external_reference`, produto, valor, moeda e a regra de que redirect não libera acesso.

O modelo anual correto já existe em produção em `app_annual_editions` e `user_annual_editions`. A compra anual 2027 deve conceder somente a Edição 2027; e-books/devocional continuam em `user_editions`.

## Defeito identificado na v11

A concessão anual usa atualmente:

`upsert(..., { onConflict: "user_id,annual_edition_id" })`

A tabela de produção não possui uma constraint UNIQUE simples exatamente nesse par. O desenho final usa um `id` próprio e preserva múltiplas origens independentes (purchase/admin/corporate/promotion/legacy), com unicidade de compra vinculada ao `order_reference`.

Consequência: uma nova compra anual confirmada pode chegar ao estado `paid` no pedido e falhar na criação do direito anual com `annual_entitlement_grant_failed`.

O comprador 2027 já migrado permanece protegido pelo backfill realizado anteriormente. Nenhum direito existente deve ser removido para corrigir este ponto.

## Correção v12 — algoritmo fechado

Para `product_type = app_access` e `product.code = app_biblia_chimarrao`:

1. localizar a edição anual ativa de 2027;
2. procurar primeiro `user_annual_editions` por `source = purchase` e `order_reference = order.id`;
3. se já existir, validar que `user_id` e `annual_edition_id` correspondem exatamente ao pedido e à edição 2027;
4. se existir ativo, tratar como idempotente e não criar outro direito;
5. se existir revogado e o provedor voltar a informar pagamento acreditado para o mesmo pedido, reativar somente esse registro exato;
6. se não existir, fazer `insert` com `user_id`, `annual_edition_id`, `source = purchase`, `order_reference = order.id`, `granted_at = paidAt`, `revoked_at = null`;
7. se ocorrer conflito de corrida no insert, reler pelo `order_reference` e aceitar somente se usuário e edição forem exatamente os esperados; caso contrário, falhar fechado;
8. refund continua revogando somente `source = purchase` + `order_reference = order.id`;
9. grants admin/corporate/promotion/legacy nunca são removidos pelo refund de uma compra pessoal;
10. e-books/devocional permanecem inalterados em `user_editions`.

## Segurança preservada

- HMAC do Mercado Pago permanece obrigatório.
- A ordem é consultada no Mercado Pago antes da reconciliação.
- Valor/moeda/produto continuam validados contra pedido e catálogo.
- Redirect continua incapaz de liberar acesso.
- Nenhuma nova escrita em `app_access` global.
- Nenhuma compra real adicional é necessária para preparar a correção.

## Gate de produção

A v12 só deve ser publicada após autorização explícita para a função compartilhada. Frase de autorização definida:

`APROVADO CORRIGIR WEBHOOK ANUAL V12`
