# Bloco 4 — Segurança comercial e acesso por edição

## Objetivo
Preparar o Bíblia + Chimarrão para vender edições anuais independentes (2027, 2028, 2029...) sem retirar do leitor as edições já adquiridas e sem confundir a compra anual com os e-books avulsos.

## Estado atual confirmado
- `app_access` representa acesso global/legado ao aplicativo.
- `get_my_app_access()` libera globalmente quando `app_access.status = active`.
- `commercial_products` exige atualmente `edition_id IS NULL` para `product_type = app_access`.
- `user_editions` já representa direitos específicos por edição e é a base correta para e-books e futuras edições anuais.
- `my_book_library()` e `has_edition_access()` já trabalham com direito por edição.
- O produto `app_biblia_chimarrao` (Edição 2027) está ativo, mas atualmente é `app_access` e não possui `edition_id`.
- Existe uma compra anual 2027 paga que hoje depende do acesso global e ainda precisa receber o direito específico de 2027 quando a migração for aprovada.

## Regra comercial alvo
1. Criar conta continua gratuito.
2. Comprar 2027 concede somente a edição anual 2027.
3. Comprar 2028 acrescenta 2028 e mantém 2027.
4. E-books continuam sendo direitos independentes.
5. Concessão empresarial/admin deve apontar para a edição/produto exato.
6. `app_access` permanece temporariamente como compatibilidade legada; não deve ser a fonte de verdade para novas edições anuais.
7. Redirecionamento do checkout nunca concede acesso por si só; somente confirmação segura do pagamento pode conceder entitlement.

## Estratégia de migração sem custo adicional
### Fase A — código/LAB GitHub
- Distinguir na interface administrativa “Acesso legado/global” de “Edições adquiridas/liberadas”.
- Preparar a UI para exibir anos adquiridos usando os dados de `user_editions`/`admin_list_users`.
- Não remover nem bloquear o mecanismo legado enquanto existirem usuários dependentes dele.

### Fase B — banco compartilhado (somente após aprovação explícita)
- Evoluir a regra de catálogo para permitir produto anual vinculado a uma edição sem enfraquecer a validação de e-books/devocionais.
- Vincular o produto anual 2027 à edição anual correta.
- Backfill aditivo: conceder 2027 aos compradores pagos existentes que ainda não tenham o entitlement.
- Preservar `app_access` durante a transição.
- Validar contagens antes/depois e abortar transacionalmente se houver divergência.

### Fase C — webhook (somente após aprovação explícita)
- Produto anual com edição deve conceder `user_editions` para a edição exata.
- Manter compatibilidade temporária somente quando necessária.
- Definir regra de estorno sem apagar direitos concedidos por outra origem (admin, empresa ou outra compra válida).

### Fase D — corte seguro
- Depois de validar compradores existentes e o frontend por edição, deixar `app_access` apenas para legado/admin global.
- Novas edições anuais passam a usar entitlement por edição desde o primeiro dia.

## Invariantes de segurança
- Nenhuma compra paga existente pode desaparecer.
- Nenhum usuário deve ganhar 2028 por possuir 2027.
- Nenhum e-book deve liberar outro e-book.
- Nenhum retorno de navegador/URL deve liberar produto sem confirmação do backend.
- Alterações de produção/Supabase compartilhado exigem aprovação explícita.
- Migrações devem ser transacionais e aditivas antes de qualquer remoção de compatibilidade.

## Pendências do Bloco 4
- [x] Diagnosticar acesso global versus edição.
- [x] Confirmar infraestrutura `user_editions`.
- [x] Confirmar comprador anual 2027 ainda sem entitlement específico.
- [x] Confirmar constraint que impede `app_access` com `edition_id`.
- [x] Criar LAB gratuito no GitHub.
- [x] Documentar arquitetura e migração segura.
- [ ] Ajustar painel administrativo para separar legado/global de edições.
- [ ] Preparar alteração de banco em dry-run antes de pedir aprovação.
- [ ] Preparar evolução segura do webhook em LAB antes de deploy.
- [ ] Definir comportamento de estorno/cancelamento por origem do entitlement.
- [ ] Verificar recuperação de senha e allowlist de redirecionamentos.
- [ ] Auditar permissões SECURITY DEFINER/RLS/Storage.
- [ ] Corrigir divergência de versão dos termos antes de novas vendas públicas.
- [ ] Checklist final pré-lançamento.

## Marco comercial
Lançamento/vendas públicas planejados para 07/11/2026. Antes disso, o foco é apresentação do projeto, preparação comercial/jurídica, cadastro de interessados e venda dos e-books já liberados conforme as regras aplicáveis.