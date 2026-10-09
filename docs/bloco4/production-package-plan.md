# Bloco 4 — Pacote estrutural de produção (PLANO PARA APROVAÇÃO)

> NÃO EXECUTADO. Este documento consolida o pacote que deverá ser aprovado explicitamente antes de qualquer alteração no Supabase compartilhado/produção.

## Objetivo

Substituir o uso comercial do acesso global por direitos anuais independentes, sem misturar acesso ao aplicativo com biblioteca EPUB.

## Pacote A — Banco de dados

Criar:
- `app_annual_editions`: catálogo de anos do aplicativo (2027, 2028...).
- `user_annual_editions`: direito por usuário + ano, com origem e referência da compra.

Manter sem apagar:
- `app_access`: compatibilidade legada durante transição.
- `user_editions`: direitos de biblioteca/EPUB.
- `editions`: catálogo editorial já existente.

Criar RPCs seguras:
- `get_my_annual_access(year)` — usuário consulta somente o próprio direito; admin continua autorizado.
- `get_my_annual_editions()` — lista anos anuais ativos da própria conta.
- `admin_list_annual_entitlements(user)` — somente admin.
- `admin_grant_annual_edition(user, year, source)` — somente admin; origem admin/corporate/promotion.
- `admin_revoke_annual_edition(user, year)` — somente admin; revogação controlada.

Requisitos:
- SECURITY DEFINER com `search_path` fixo.
- EXECUTE removido de `public` quando aplicável e concedido somente aos papéis necessários.
- RLS habilitado nas novas tabelas; cliente não recebe permissão direta de escrita.

## Pacote B — Migração 2027

1. Criar edição anual 2027 separada da edição EPUB/devocional.
2. Localizar pedidos `app_biblia_chimarrao` com `status='paid'`.
3. Conceder 2027 aos compradores pagos usando `source='purchase'` e `order_reference`.
4. Comparar quantidade de compradores pagos com direitos anuais criados.
5. Se houver divergência, abortar transação.
6. Não remover `app_access` nesta etapa.

## Pacote C — Webhook Mercado Pago

Pagamento anual confirmado:
- validar HMAC, pedido no Mercado Pago, valor, moeda, produto e pedido local;
- marcar pedido pago;
- para `app_biblia_chimarrao`, conceder `user_annual_editions` 2027;
- não conceder `app_access` global;
- manter idempotência.

EPUB/devocional:
- continuar usando `user_editions` e `edition_id` editorial.

Estorno:
- localizar direito cuja `order_reference` corresponda ao pedido estornado;
- revogar somente esse direito derivado da compra;
- não apagar concessão administrativa/corporativa/promocional independente;
- registrar pedido como `refunded`.

Cancelado/falhou/pendente:
- não conceder direito novo.

## Pacote D — Checkout

- Sincronizar a versão dos termos comerciais com a versão vigente do frontend antes do lançamento.
- Não reescrever/alterar aceitações históricas já registradas.
- Atualizar allowlist de retorno somente para URLs finais efetivamente aprovadas.
- Retorno do Mercado Pago nunca é prova de pagamento e nunca libera conteúdo sozinho.

## Pacote E — Frontend

Durante transição:
- consultar direito anual 2027;
- manter fallback legado para contas antigas autorizadas;
- rotular no painel admin o antigo status como `Acesso legado/global`;
- mostrar `Edições anuais` separadamente de `Biblioteca digital`;
- permitir 2027 e futuros anos simultaneamente.

## Pacote F — Empresas

- funcionário usa conta normal;
- admin concede ano exato com origem `corporate`;
- não libera EPUBs por consequência;
- futura revogação corporativa não pode apagar compra pessoal independente.

## Ordem segura de implantação

1. Snapshot lógico/contagens de referência.
2. Aplicar banco + RPCs + RLS.
3. Executar backfill 2027 e asserts.
4. Verificar comprador pago existente.
5. Publicar webhook atualizado.
6. Publicar checkout/termos/return allowlist atualizados.
7. Publicar frontend LAB compatível com novo direito + fallback legado.
8. Testar admin, comprador existente e usuário sem compra.
9. Somente depois promover frontend para produção.
10. Manter `app_access` legado até auditoria final; não apagar automaticamente.

## Rollback operacional

- Não apagar dados antigos na primeira implantação.
- Se frontend novo falhar, fallback legado continua disponível.
- Se webhook novo falhar, interromper novas vendas até correção; não liberar acesso pelo redirect.
- Novas tabelas preservam trilha de origem e pedido.
- Remoção de estruturas antigas fica fora deste pacote.

## Validações obrigatórias após aplicação

- comprador anual real existente possui 2027;
- comprador de devocional não recebe anual;
- comprador de e-book não recebe anual;
- admin/manual legado não perde acesso;
- usuário sem compra não recebe premium;
- `get_my_annual_access` não expõe direitos de terceiros;
- RPC admin rejeita não-admin;
- webhook repetido não duplica direito;
- refund só afeta direito vinculado ao pedido correto;
- biblioteca EPUB continua funcionando.

## Fora do pacote

- cobrança/serviço pago adicional;
- Supabase Branch pago;
- remoção definitiva de `app_access`;
- publicação em Google Play/App Store;
- criação de outro aplicativo.

## Gate de autorização

Somente após revisão deste pacote, a execução real deverá exigir autorização explícita e inequívoca do proprietário do projeto para alterar o Supabase compartilhado/produção.
