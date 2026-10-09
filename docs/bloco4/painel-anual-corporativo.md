# Bloco 4 — Painel anual e corporativo

## Regra definitiva

O acesso premium do aplicativo é controlado por edição anual. Para 2027, o painel administrativo deve usar exclusivamente os RPCs anuais já existentes para conceder e revogar direitos da Edição 2027.

Os EPUBs continuam em domínio separado, usando os RPCs de livros. Comprar/liberar um EPUB não concede acesso anual ao aplicativo, e conceder acesso anual não libera EPUB separado.

## RPCs do painel anual

- `admin_list_annual_entitlements(target_user_id)` — lista concessões anuais e sua proveniência.
- `admin_grant_annual_edition(target_user_id, target_year, grant_source)` — concede uma edição anual por origem controlada.
- `admin_revoke_annual_entitlement(target_entitlement_id)` — revoga somente a concessão escolhida.

## Origens

- `purchase` — compra individual confirmada pelo provedor. Não deve ser criada manualmente pelo painel.
- `corporate` — acesso concedido a colaborador de empresa/parceiro.
- `admin` — liberação administrativa individual.
- `promotion` — campanha/promocional.
- `legacy` — compatibilidade de migração; não usar para novas concessões.

## Regra de revogação

Cada concessão é independente. Revogar um acesso `corporate` não pode remover uma compra pessoal `purchase` do mesmo usuário/ano. O painel deve revogar pelo `entitlement_id`, nunca por usuário/ano de forma genérica.

## UI do leitor no painel

Exibir separadamente:

1. **Bíblia + Chimarrão — Edição 2027**
   - estado efetivo: liberado/não liberado;
   - concessões ativas e origem;
   - ação `Liberar 2027` com origem `admin` ou `corporate`;
   - ação de revogação em cada concessão administrativa/corporativa/promocional;
   - compra (`purchase`) apenas informativa no painel, sem botão genérico que destrua o direito adquirido.
2. **Livros / EPUBs**
   - manter o controle individual existente, separado do acesso anual.

## Remoção do modelo antigo

O botão global `Liberar/Bloquear`, baseado em `admin_set_user_access`, é legado. Ele não deve ser usado como controle comercial da Edição 2027. A compatibilidade global permanece temporariamente apenas no gate do leitor até a migração administrativa estar validada.

## Critérios para promoção à produção

- Nenhum e-book libera premium anual.
- Nenhuma concessão anual libera e-book separado.
- Compra pessoal 2027 sobrevive à revogação de uma concessão corporativa/admin paralela.
- Admin consegue conceder 2027 a uma conta normal sem alterar compras.
- Admin consegue revogar somente a concessão escolhida.
- Usuário sem direito anual continua bloqueado no conteúdo premium.
- Usuário com direito anual ativo entra normalmente no devocional e recursos premium.
- Nenhuma alteração de produção deve ser feita a partir deste documento sem aprovação explícita.