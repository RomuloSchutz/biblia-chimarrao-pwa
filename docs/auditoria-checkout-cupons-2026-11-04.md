# Retorno do checkout e reserva de cupons

O site oficial envia `https://bibliachimarrao.com.br/loja` para o checkout. Esse endereço passa a integrar a lista exata de retornos permitidos, preservando PWA e Pages. URLs arbitrárias continuam sem configuração de retorno.

A consulta de disponibilidade considera `pending` e `redeemed`. A proteção definitiva fica no gatilho `enforce_coupon_reservation_quota`: a inserção bloqueia a linha do cupom com `FOR NO KEY UPDATE`, conta reservas globais e por usuário e rejeita excesso antes de chamar o Mercado Pago. A trava é compatível com o key-share da chave estrangeira. Confirmar o mesmo pagamento novamente apenas atualiza a reserva, sem ocupar outra vaga.

O gatilho é SECURITY INVOKER, com search_path vazio e sem EXECUTE para PUBLIC/anon/authenticated. As escritas da tabela permanecem restritas ao serviço; não há novas políticas de cliente. Nenhum direito de livro, regra dos sete dias, preço, capa ou publicação editorial muda.

## Resultado incerto no provedor

Timeout, erro 5xx, HTTP 408/409/429 ou sucesso incompleto mantêm pedido e cupom pendentes. Uma resposta perdida pode esconder um pedido realmente criado; liberar a vaga permitiria reutilizar o desconto antes da confirmação. O webhook assinado continua finalizando ou cancelando a reserva.

Não expirar reservas somente pelo relógio: um checkout remoto ainda pode ser pago. Reservas sem desfecho precisam de reconciliação com o provedor ou cancelamento remoto confirmado antes da liberação. Reutilize o checkout pendente disponível em vez de criar nova compra com o mesmo cupom. Não há limpeza automática de reservas antigas nesta alteração.

## Implantação

1. Executar `npm ci`, `npm test`, `npm run test:db` com banco local dedicado, e `npm run build`.
2. Aplicar a migração `20261104220124_enforce_coupon_reservation_quota.sql`. Ela não modifica reservas existentes nem dados editoriais.
3. Implantar `mercado-pago-create-order` e `validate-commercial-coupon`, mantendo `verify_jwt=false` e a validação de usuário no corpo. Não substituir segredos.
4. Conferir definição/permissões do gatilho e funções implantadas, além de rejeição de solicitações não autenticadas. Não executar compra real só para testar.

O workflow de validação passa a executar os testes de concorrência com PostgreSQL 17. O teste exige host local e banco `bc_coupon_quota_test` vazio, sem apontar para Supabase.

## Retorno da implantação

Se necessário, reimplantar as versões anteriores das duas funções. Para remover a proteção adicional: `drop trigger enforce_coupon_reservation_quota on public.commercial_coupon_redemptions; drop function public.enforce_coupon_reservation_quota(); drop index public.commercial_coupon_redemptions_reserved_idx;`. Essa remoção reabre a corrida de quotas; preferir manter o gatilho durante um rollback de frontend. Não apagar pedidos ou resgates para voltar versões.

## Validação

Testes de checkout cobrem retornos confiáveis, rejeição de endereços externos, quota antes do provedor e resultados incertos. Testes reais de PostgreSQL usam duas conexões e verificam bloqueio/commit, rollback, limite individual, cancelamento, reembolso, finalização idempotente e permissões. Isso não certifica cobrança real, reembolso real nem todos os dispositivos móveis.
