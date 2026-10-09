# Bloco 4 — Checklist de fechamento

Atualizado em 10/10/2026.

## Concluído

- [x] Modelo de acesso anual separado dos EPUBs (`app_annual_editions` / `user_annual_editions`).
- [x] Edição anual 2027 cadastrada.
- [x] Comprador anual já existente migrado para 2027.
- [x] RPC do leitor `get_my_annual_access(target_year)` disponível.
- [x] RPCs administrativos anuais disponíveis.
- [x] Checkout anual exige versões atuais dos termos.
- [x] Compatibilidade de checkout dos e-books preservada sem falsificar versão histórica de aceite.
- [x] Gate principal do frontend consulta acesso anual 2027 antes da compatibilidade legada.
- [x] Abertura de encontro foi unificada para usar o mesmo gate anual.
- [x] Fluxo de recuperação de senha existe no frontend.
- [x] Biblioteca/EPUB continua separada por edição editorial.

## Bloqueador antes de novas vendas anuais

- [ ] Corrigir webhook anual v11 para v12: remover `upsert` com conflito inexistente e tornar a concessão de compra idempotente pelo `order_reference` exato.

A correção v12 deve preservar HMAC, validação do provedor, produto, valor, moeda, `external_reference`, regras dos e-books e revogação exata em reembolso.

## LAB antes de produção

- [ ] Converter UI administrativa de `admin_set_user_access` global para concessões anuais por edição/origem.
- [ ] Centralizar versão `08/10/2026` no checkout de e-books para evitar literal duplicado.
- [ ] Validar build/preview da branch do Bloco 4.
- [ ] Testar conta sem 2027 → bloqueada.
- [ ] Testar conta com 2027 → premium liberado.
- [ ] Testar concessão admin/corporate paralela sem apagar compra pessoal.

## Configuração/segurança a validar

- [ ] Conferir URLs autorizadas de recuperação no Supabase Auth.
- [ ] Fazer teste real de recuperação de senha por e-mail.
- [ ] Auditar EXECUTE dos `SECURITY DEFINER` críticos.
- [ ] Auditar RLS/policies e Storage dos arquivos pagos.
- [ ] Confirmar URL final de produção na allowlist de retorno do checkout antes do lançamento.

## Regras que não podem regredir

- [ ] EPUB comprado não concede acesso anual.
- [ ] Acesso anual não concede EPUB vendido separadamente.
- [ ] Redirect do Mercado Pago nunca concede acesso por si só.
- [ ] Reembolso anual revoga somente a concessão `purchase` ligada àquele pedido.
- [ ] Nenhuma mudança em produção/shared backend sem aprovação explícita.
- [ ] Nenhum serviço/plano pago sem aprovação explícita.

## Fechamento do bloco

O Bloco 4 só deve ser marcado como concluído depois de: webhook v12 corrigido e verificado, painel anual/corporativo validado no LAB, recuperação de senha validada, auditoria mínima de permissões concluída e retorno de produção configurado.