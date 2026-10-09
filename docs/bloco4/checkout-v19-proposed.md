# Bloco 4 — Checkout Mercado Pago v19 PROPOSTO

> LAB / NÃO PUBLICADO. Especificação para revisão antes de alterar a Edge Function compartilhada `mercado-pago-create-order`.

## Problemas confirmados na v18

1. Backend grava `terms_version = 04/10/2026`, enquanto o frontend vigente usa `COMMERCIAL_POLICY_VERSION = 08/10/2026`.
2. O backend calcula o hash de um texto canônico identificado como versão 04/10/2026.
3. A allowlist de retorno contém somente o endereço LAB antigo.
4. O frontend já envia `policyVersion` e `licenseVersion`, mas a v18 ignora essas versões e grava a constante antiga.

## Alteração proposta v19

### Aceite comercial

- Versão canônica vigente no backend: `08/10/2026`.
- Exigir que `accepted === true`, como já ocorre.
- Exigir que `policy_version === '08/10/2026'` e `license_version === '08/10/2026'` no corpo do pedido.
- Se houver divergência entre frontend e backend, rejeitar criação da compra com erro de versão, em vez de registrar aceite incorreto.
- Gravar `terms_version = 08/10/2026` para NOVAS compras.
- Calcular hash canônico da versão 08/10/2026.
- Não alterar aceitações históricas existentes.

### Retorno do Mercado Pago

- Manter allowlist fechada; nunca aceitar URL arbitrária enviada pelo cliente.
- Incluir somente endereços efetivamente aprovados para LAB/produção.
- `success_url`, `pending_url` e `failure_url` continuam transportando estado visual e `local_order`.
- Redirect não concede acesso e não substitui webhook.

### Produto anual

- Checkout continua criando pedido para `app_biblia_chimarrao` com preço obtido do catálogo autoritativo.
- Não deve conceder acesso diretamente.
- Webhook v11 continua sendo o responsável por reconciliar pagamento e conceder 2027.

### Segurança preservada

- autenticação do usuário via `auth.getUser`;
- catálogo e preço consultados no backend;
- pedido local criado antes do provedor;
- `X-Idempotency-Key = order.id`;
- erros do provedor sanitizados;
- segredo/token nunca enviado ao navegador.

## Ajuste necessário no frontend LAB

Hoje `AnnualPurchasePanel.jsx` já chama:

`onContinue({ accepted:true, policyVersion:digitalPurchasePolicy.version, licenseVersion:digitalLicense.version })`

O chamador que monta o body para `mercado-pago-create-order` deverá encaminhar esses campos como:
- `policy_version`
- `license_version`

Isso deve ser validado no LAB antes do deploy da v19.

## Critérios de aceite

- nova compra não pode registrar versão 04/10/2026;
- frontend 08/10/2026 + backend 08/10/2026 = permitido;
- frontend com versão divergente = bloqueado antes de chamar Mercado Pago;
- aceitações antigas permanecem intactas;
- preço continua vindo de `commercial_products`;
- redirect não libera acesso;
- webhook v11 permanece responsável pelo direito anual.

## Gate

Nenhuma alteração da função compartilhada será feita sem autorização explícita separada para publicar o checkout v19.
